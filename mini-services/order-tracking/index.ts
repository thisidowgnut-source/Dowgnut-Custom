import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { Server } from 'socket.io'

// ---------------------------------------------------------------------------
// DowgNut order-tracking WebSocket mini-service
// Port: 3004
// Path:  "/"  (Caddy forwards /?XTransformPort=3004 here)
// ---------------------------------------------------------------------------

type OrderStatus = 'preparing' | 'baking' | 'out_for_delivery' | 'delivered'

interface OrderState {
  orderId: string
  customerName: string
  step: number // 0..3
  startedAt: number // ms epoch when tracking began
  sockets: Set<string> // socket ids currently in the room
  timers: NodeJS.Timeout[] // pending step-transition timers
  deliveredAt: number | null // ms epoch once delivered emitted
  deliveredCleanupTimer: NodeJS.Timeout | null // 60s post-delivered cleanup
  emptyCleanupTimer: NodeJS.Timeout | null // 120s post-last-socket cleanup
}

// ---------------------------------------------------------------------------
// Static configuration
// ---------------------------------------------------------------------------

const STATUSES: OrderStatus[] = [
  'preparing',
  'baking',
  'out_for_delivery',
  'delivered',
]

// Absolute ms-from-start at which each step begins.
// preparing @ 0s, baking @ 8s, out_for_delivery @ 18s, delivered @ 30s.
const STEP_DELAYS_MS: number[] = [0, 8_000, 18_000, 30_000]

const ETA_MINUTES: Record<OrderStatus, number> = {
  preparing: 18,
  baking: 10,
  out_for_delivery: 4,
  delivered: 0,
}

const MESSAGES: Record<OrderStatus, string> = {
  preparing: 'Your dowg is being prepped with love 🍩',
  baking: 'Into the fryer — golden & fluffy coming up 🔥',
  out_for_delivery: 'Out for delivery — good vibes on the way 🛵',
  delivered: 'Delivered! Good vibes & good dowg. Enjoy! ✨',
}

const DELIVERED_TTL_MS = 60_000 // keep entry for 60s after delivered
const EMPTY_TTL_MS = 120_000 // cleanup if no sockets for 120s

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

const orders = new Map<string, OrderState>()

const roomName = (orderId: string) => `order:${orderId}`

function computeStepFromElapsed(elapsedMs: number): number {
  if (elapsedMs >= STEP_DELAYS_MS[3]) return 3
  if (elapsedMs >= STEP_DELAYS_MS[2]) return 2
  if (elapsedMs >= STEP_DELAYS_MS[1]) return 1
  return 0
}

function buildStatusPayload(order: OrderState, stepOverride?: number) {
  const step = stepOverride ?? order.step
  const status = STATUSES[step]
  return {
    orderId: order.orderId,
    status,
    step,
    etaMinutes: ETA_MINUTES[status],
    message: MESSAGES[status],
    updatedAt: new Date().toISOString(),
  }
}

function emitStatusToRoom(io: Server, order: OrderState, step?: number) {
  const payload = buildStatusPayload(order, step)
  io.to(roomName(order.orderId)).emit('order-status', payload)
}

function clearAllTimers(order: OrderState) {
  order.timers.forEach((t) => clearTimeout(t))
  order.timers = []
  if (order.deliveredCleanupTimer) {
    clearTimeout(order.deliveredCleanupTimer)
    order.deliveredCleanupTimer = null
  }
  if (order.emptyCleanupTimer) {
    clearTimeout(order.emptyCleanupTimer)
    order.emptyCleanupTimer = null
  }
}

function scheduleDeliveredCleanup(io: Server, order: OrderState) {
  if (order.deliveredCleanupTimer) return
  order.deliveredCleanupTimer = setTimeout(() => {
    console.log(
      `[order-tracking] TTL expired for delivered order ${order.orderId} — removing`,
    )
    clearAllTimers(order)
    io.in(roomName(order.orderId)).socketsLeave(roomName(order.orderId))
    orders.delete(order.orderId)
  }, DELIVERED_TTL_MS)
}

function scheduleEmptyCleanup(order: OrderState) {
  if (order.emptyCleanupTimer) return
  if (order.deliveredAt !== null) return // delivered-cleanup will handle it
  if (order.sockets.size > 0) return
  order.emptyCleanupTimer = setTimeout(() => {
    order.emptyCleanupTimer = null
    if (order.sockets.size === 0 && order.deliveredAt === null) {
      console.log(
        `[order-tracking] no sockets tracking order ${order.orderId} for ${EMPTY_TTL_MS}ms — cleaning up`,
      )
      clearAllTimers(order)
      orders.delete(order.orderId)
    }
  }, EMPTY_TTL_MS)
}

// Schedule the step-transition timers (steps 1, 2, 3).
// Step 0 is emitted immediately by the caller on order creation.
function scheduleStepTimers(io: Server, order: OrderState) {
  for (let s = 1; s <= 3; s++) {
    const delay = STEP_DELAYS_MS[s] - (Date.now() - order.startedAt)
    if (delay <= 0) {
      // Already past this step's start time — fire immediately if not reached.
      if (order.step < s) {
        order.step = s
        emitStatusToRoom(io, order, s)
        if (s === 3) {
          order.deliveredAt = Date.now()
          scheduleDeliveredCleanup(io, order)
        }
      }
      continue
    }
    const t = setTimeout(() => {
      order.step = s
      emitStatusToRoom(io, order, s)
      console.log(
        `[order-tracking] order ${order.orderId} → step ${s} (${STATUSES[s]})`,
      )
      if (s === 3) {
        // Delivered: clear any remaining timers (none should be left) and
        // keep entry for 60s so late joiners see "delivered".
        order.timers.forEach((tt) => clearTimeout(tt))
        order.timers = []
        order.deliveredAt = Date.now()
        scheduleDeliveredCleanup(io, order)
      }
    }, delay)
    order.timers.push(t)
  }
}

// ---------------------------------------------------------------------------
// HTTP + Socket.io setup
// ---------------------------------------------------------------------------

const httpServer = createServer()

const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60_000,
  pingInterval: 25_000,
})

// Tiny health endpoint.
//
// NOTE: We can't use `httpServer.on('request', ...)` here. Engine.io's
// `attach` (called by `new Server(httpServer, ...)`) replaces all existing
// 'request' listeners with its own that intercepts EVERY request whose URL
// starts with the configured path (`/` here → matches all URLs) and routes
// it through `handleRequest`. Non-socket.io requests get a 400 "Transport
// unknown" via `abortRequest`. Any listener registered after Server creation
// still fires but by then engine.io has already written its 400 response, so
// `res.writeHead` from our side throws `ERR_HTTP_HEADERS_SENT`.
//
// The clean intercept point is engine.io's middleware chain via
// `io.engine.use(...)`, which runs inside `handleRequest` BEFORE the verify
// step. For /health we write the response and skip `next()` — engine.io then
// stops processing this request with no error. For everything else we call
// `next()` and normal socket.io flow proceeds.
io.engine.use((req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
  if (req.method === 'GET' && req.url?.split('?')[0] === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'dowgnut-order-tracking' }))
    return // intentionally do NOT call next()
  }
  next()
})

io.on('connection', (socket) => {
  console.log(`[order-tracking] socket connected: ${socket.id}`)

  socket.on('track-order', (data: { orderId: string; customerName: string }) => {
    if (!data || typeof data.orderId !== 'string') {
      socket.emit('error', { message: 'invalid track-order payload' })
      return
    }
    const { orderId, customerName } = data
    const room = roomName(orderId)
    socket.join(room)

    let order = orders.get(orderId)
    if (order) {
      // Existing order — attach this socket and emit current state.
      order.sockets.add(socket.id)
      order.customerName = customerName || order.customerName
      if (order.emptyCleanupTimer) {
        clearTimeout(order.emptyCleanupTimer)
        order.emptyCleanupTimer = null
      }
      const elapsed = Date.now() - order.startedAt
      const currentStep = computeStepFromElapsed(elapsed)
      // Bring order.step forward in case timers fired while no one watched
      // (they would have emitted to an empty room; align local step too).
      if (currentStep > order.step) order.step = currentStep
      socket.emit('order-status', buildStatusPayload(order, currentStep))
      console.log(
        `[order-tracking] socket ${socket.id} re-joined order ${orderId} at step ${currentStep}`,
      )
      return
    }

    // New order.
    order = {
      orderId,
      customerName: customerName || 'DowgNut fan',
      step: 0,
      startedAt: Date.now(),
      sockets: new Set<string>([socket.id]),
      timers: [],
      deliveredAt: null,
      deliveredCleanupTimer: null,
      emptyCleanupTimer: null,
    }
    orders.set(orderId, order)
    socket.emit('order-status', buildStatusPayload(order, 0))
    scheduleStepTimers(io, order)
    console.log(
      `[order-tracking] new order ${orderId} tracking started by socket ${socket.id}`,
    )
  })

  socket.on('stop-tracking', (data: { orderId: string }) => {
    if (!data || typeof data.orderId !== 'string') return
    const { orderId } = data
    const order = orders.get(orderId)
    if (!order) return
    order.sockets.delete(socket.id)
    socket.leave(roomName(orderId))
    console.log(
      `[order-tracking] socket ${socket.id} stopped tracking order ${orderId}`,
    )
    if (order.sockets.size === 0) {
      scheduleEmptyCleanup(order)
    }
  })

  socket.on('disconnect', () => {
    console.log(`[order-tracking] socket disconnected: ${socket.id}`)
    for (const order of orders.values()) {
      if (order.sockets.has(socket.id)) {
        order.sockets.delete(socket.id)
        // socket.io auto-leaves rooms on disconnect; just bookkeep.
        if (order.sockets.size === 0) {
          // Leave timers running so a brief refresh doesn't reset progress;
          // schedule cleanup after 120s if no one rejoins.
          scheduleEmptyCleanup(order)
        }
      }
    }
  })

  socket.on('error', (err: unknown) => {
    console.error(`[order-tracking] socket error (${socket.id}):`, err)
  })
})

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`[order-tracking] DowgNut order-tracking service on port ${PORT}`)
  console.log(`[order-tracking] health:  GET http://localhost:${PORT}/health`)
})

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[order-tracking] ${signal} received — shutting down`)
  for (const order of orders.values()) clearAllTimers(order)
  orders.clear()
  io.close(() => {
    httpServer.close(() => {
      console.log('[order-tracking] closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
