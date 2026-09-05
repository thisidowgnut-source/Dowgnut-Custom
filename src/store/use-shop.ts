"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CartItem,
  ChatMessage,
  CustomerProfile,
  Donut,
  Favorite,
  Order,
  Review,
  SavedAddress,
} from "@/lib/types";
import { apiFetch, getSessionId, SESSION_KEY } from "@/lib/api";

export type ShopView =
  | "shop"
  | "slider"
  | "swipe"
  | "favorites"
  | "checkout"
  | "orders"
  | "tracking"
  | "admin";

interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  paymentMethod: string;
  paymentRef?: string;
}

interface ShopState {
  sessionId: string;
  view: ShopView;
  splashDone: boolean;

  // catalog
  donuts: Donut[];
  loadingDonuts: boolean;
  donutsError: string | null;
  filterType: string;
  search: string;
  sort: string;

  // cart
  cart: CartItem[];
  cartOpen: boolean;
  cartLoading: boolean;

  // favorites
  favorites: Favorite[];

  // detail modal
  selectedDonut: Donut | null;
  detailOpen: boolean;
  detailReviews: Review[];
  detailLoading: boolean;

  // ai panels
  conciergeOpen: boolean;
  designerOpen: boolean;

  // tracking
  trackingOrderId: string | null;
  trackingCustomerName: string;

  // orders cache
  orders: Order[];

  // optional customer profile (guest checkout = no profile)
  profile: CustomerProfile | null;

  initialised: boolean;

  // actions
  setView: (v: ShopView) => void;
  dismissSplash: () => void;
  setFilterType: (t: string) => void;
  setSearch: (s: string) => void;
  setSort: (s: string) => void;

  init: () => Promise<void>;
  loadDonuts: () => Promise<void>;

  openDetail: (donut: Donut) => Promise<void>;
  closeDetail: () => void;
  loadReviews: (donutId: string) => Promise<void>;
  addReview: (donutId: string, payload: { author: string; rating: number; comment: string }) => Promise<void>;

  loadCart: () => Promise<void>;
  addToCart: (donutId: string, quantity?: number) => Promise<void>;
  updateCartQty: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCartOpen: (open: boolean) => void;

  loadFavorites: () => Promise<void>;
  toggleFavorite: (donutId: string) => Promise<void>;
  isFavorite: (donutId: string) => boolean;

  checkout: (payload: CheckoutPayload) => Promise<Order>;
  loadOrders: () => Promise<Order[]>;

  startTracking: (orderId: string, customerName: string) => void;
  stopTracking: () => void;

  setConciergeOpen: (o: boolean) => void;
  setDesignerOpen: (o: boolean) => void;

  // customer profile + saved addresses + recently viewed
  createProfile: (data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }) => void;
  saveAddress: (address: SavedAddress) => void;
  removeAddress: (addressId: string) => void;
  trackViewed: (donutId: string) => void;

  aiConcierge: (messages: ChatMessage[]) => Promise<{ reply: string; donuts: Donut[] }>;
  aiDesigner: (prompt: string) => Promise<{ imageUrl: string }>;
}

function buildDonutsUrl(state: ShopState): string {
  const params = new URLSearchParams();
  params.set("type", state.filterType || "all");
  if (state.search) params.set("search", state.search);
  if (state.sort && state.sort !== "catalog") params.set("sort", state.sort);
  return `/api/donuts?${params.toString()}`;
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      sessionId: "",
      view: "shop",
      splashDone: false,

      donuts: [],
      loadingDonuts: false,
      donutsError: null,
      filterType: "all",
      search: "",
      sort: "catalog",

      cart: [],
      cartOpen: false,
      cartLoading: false,

      favorites: [],

      selectedDonut: null,
      detailOpen: false,
      detailReviews: [],
      detailLoading: false,

      conciergeOpen: false,
      designerOpen: false,

      trackingOrderId: null,
      trackingCustomerName: "",

      orders: [],
      profile: null,
      initialised: false,

      setView: (v) => set({ view: v }),
      dismissSplash: () => set({ splashDone: true }),
      setFilterType: (t) => {
        set({ filterType: t });
        get().loadDonuts();
      },
      setSearch: (s) => {
        set({ search: s });
        get().loadDonuts();
      },
      setSort: (s) => {
        set({ sort: s });
        get().loadDonuts();
      },

      init: async () => {
        if (get().initialised) return;
        const sid = getSessionId();
        set({ sessionId: sid, initialised: true });
        await Promise.all([get().loadDonuts(), get().loadCart(), get().loadFavorites()]);
      },

      loadDonuts: async () => {
        set({ loadingDonuts: true, donutsError: null });
        try {
          const url = buildDonutsUrl(get());
          const data = await apiFetch<Donut[]>(url);
          set({ donuts: data || [], donutsError: null });
        } catch (error) {
          set({
            donutsError:
              error instanceof Error ? error.message : "Failed to load donuts",
          });
        } finally {
          set({ loadingDonuts: false });
        }
      },

      openDetail: async (donut) => {
        set({ selectedDonut: donut, detailOpen: true, detailReviews: [], detailLoading: true });
        // Track in recently viewed (only if user has a profile = opted in)
        get().trackViewed(donut.id);
        try {
          const data = await apiFetch<{ donut: Donut; reviews: Review[] }>(
            `/api/donuts/${donut.id}`
          );
          set({ selectedDonut: data.donut, detailReviews: data.reviews || [] });
        } catch {
          // keep the originally passed donut
        } finally {
          set({ detailLoading: false });
        }
      },
      closeDetail: () => set({ detailOpen: false, selectedDonut: null, detailReviews: [] }),
      loadReviews: async (donutId) => {
        try {
          const data = await apiFetch<{ donut: Donut; reviews: Review[] }>(
            `/api/donuts/${donutId}`
          );
          set({ detailReviews: data.reviews || [], selectedDonut: data.donut });
        } catch {
          /* noop */
        }
      },
      addReview: async (donutId, payload) => {
        await apiFetch<Review>(`/api/donuts/${donutId}/reviews`, {
          method: "POST",
          body: JSON.stringify({ ...payload, sessionId: get().sessionId }),
        });
        await get().loadReviews(donutId);
      },

      loadCart: async () => {
        set({ cartLoading: true });
        try {
          const data = await apiFetch<CartItem[]>(`/api/cart`);
          set({ cart: data || [] });
        } catch {
          set({ cart: [] });
        } finally {
          set({ cartLoading: false });
        }
      },
      addToCart: async (donutId, quantity = 1) => {
        try {
          const data = await apiFetch<CartItem[]>(`/api/cart`, {
            method: "POST",
            body: JSON.stringify({ donutId, quantity }),
          });
          set({ cart: data || [] });
        } catch (err) {
          throw err instanceof Error ? err : new Error("Failed to add to cart");
        }
      },
      updateCartQty: async (cartItemId, quantity) => {
        try {
          const data = await apiFetch<CartItem[]>(`/api/cart/${cartItemId}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity }),
          });
          set({ cart: data || [] });
        } catch (err) {
          throw err instanceof Error ? err : new Error("Failed to update quantity");
        }
      },
      removeFromCart: async (cartItemId) => {
        try {
          const data = await apiFetch<CartItem[]>(`/api/cart/${cartItemId}`, {
            method: "DELETE",
          });
          set({ cart: data || [] });
        } catch (err) {
          throw err instanceof Error ? err : new Error("Failed to remove item");
        }
      },
      clearCart: async () => {
        // Single bulk DELETE instead of N parallel requests (CZ-01). One
        // round-trip, transactional server-side, no race window where
        // some items are gone and others remain.
        try {
          await apiFetch<CartItem[]>(`/api/cart`, { method: "DELETE" });
          set({ cart: [] });
        } catch (err) {
          throw err instanceof Error ? err : new Error("Failed to clear cart");
        }
      },
      setCartOpen: (open) => set({ cartOpen: open }),

      loadFavorites: async () => {
        try {
          const data = await apiFetch<Favorite[]>(`/api/favorites`);
          set({ favorites: data || [] });
        } catch {
          set({ favorites: [] });
        }
      },
      toggleFavorite: async (donutId) => {
        const isFav = get().isFavorite(donutId);
        try {
          if (isFav) {
            const data = await apiFetch<Favorite[]>(`/api/favorites/${donutId}`, {
              method: "DELETE",
            });
            set({ favorites: data || [] });
          } else {
            const data = await apiFetch<Favorite[]>(`/api/favorites`, {
              method: "POST",
              body: JSON.stringify({ donutId }),
            });
            set({ favorites: data || [] });
          }
        } catch (err) {
          // Re-throw so the caller's toast actually fires (CZ-03). Previously
          // the heart would not toggle, no toast showed, and the user thought
          // the action succeeded when it hadn't reached the server.
          throw err instanceof Error ? err : new Error("Failed to update favorite");
        }
      },
      isFavorite: (donutId) =>
        get().favorites.some((f) => f.donutId === donutId),

      checkout: async (payload) => {
        const order = await apiFetch<Order>(`/api/orders`, {
          method: "POST",
          body: JSON.stringify({ ...payload, sessionId: get().sessionId }),
        });
        // Auto-create / update profile + save address on first checkout so
        // the next order is one-tap. CZ-02: re-read profile AFTER the create
        // call (it's sync today, but the dependency was implicit and would
        // break the moment createProfile became async / server-backed).
        const { profile, createProfile, saveAddress } = get();
        if (!profile) {
          createProfile({
            customerName: payload.customerName,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone,
          });
        }
        const fresh = get().profile;
        if (fresh) {
          saveAddress({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `a-${Date.now().toString(36)}`,
            label: "Home",
            customerName: payload.customerName,
            customerPhone: payload.customerPhone,
            address: payload.address,
            city: payload.city,
            state: payload.state,
            zip: payload.zip,
            isDefault: true,
          });
        }
        return order;
      },
      loadOrders: async () => {
        const sid = get().sessionId;
        if (!sid) return [];
        try {
          const data = await apiFetch<Order[]>(`/api/orders?sessionId=${encodeURIComponent(sid)}`);
          set({ orders: data || [] });
          return data || [];
        } catch {
          return [];
        }
      },

      startTracking: (orderId, customerName) =>
        set({ trackingOrderId: orderId, trackingCustomerName: customerName, view: "tracking" }),
      stopTracking: () => set({ trackingOrderId: null }),

      setConciergeOpen: (open) => set({ conciergeOpen: open }),
      setDesignerOpen: (open) => set({ designerOpen: open }),

      // Profile: optional signup at checkout — non-blocking, doesn't gate purchase.
      createProfile: (data) => {
        const existing = get().profile;
        if (existing) {
          set({
            profile: {
              ...existing,
              customerName: data.customerName || existing.customerName,
              customerEmail: data.customerEmail || existing.customerEmail,
              customerPhone: data.customerPhone || existing.customerPhone,
            },
          });
          return;
        }
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `p-${Date.now().toString(36)}`;
        set({
          profile: {
            id,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            createdAt: new Date().toISOString(),
            addresses: [],
            recentlyViewed: [],
            optedInMarketing: false,
          },
        });
      },
      saveAddress: (address) => {
        const profile = get().profile;
        if (!profile) return;
        const a: SavedAddress = { ...address, isDefault: address.isDefault ?? false };
        // If marked default, clear default on others
        const addresses: SavedAddress[] = a.isDefault
          ? [...profile.addresses.map((x) => ({ ...x, isDefault: false })), a]
          : [...profile.addresses, a];
        set({ profile: { ...profile, addresses } });
      },
      removeAddress: (addressId) => {
        const profile = get().profile;
        if (!profile) return;
        set({
          profile: {
            ...profile,
            addresses: profile.addresses.filter((a) => a.id !== addressId),
          },
        });
      },
      trackViewed: (donutId) => {
        const profile = get().profile;
        if (!profile) return; // only track when opted-in (profile exists)
        const seen = [donutId, ...profile.recentlyViewed.filter((id) => id !== donutId)].slice(0, 10);
        set({ profile: { ...profile, recentlyViewed: seen } });
      },

      aiConcierge: async (messages) => {
        return apiFetch<{ reply: string; donuts: Donut[] }>(`/api/ai/concierge`, {
          method: "POST",
          body: JSON.stringify({ messages, sessionId: get().sessionId }),
        });
      },
      aiDesigner: async (prompt) => {
        return apiFetch<{ imageUrl: string }>(`/api/ai/designer`, {
          method: "POST",
          body: JSON.stringify({ prompt }),
        });
      },
    }),
    {
      name: "dohnut-shop",
      partialize: (s) => ({
        sessionId: s.sessionId,
        // keep splashDone so it doesn't replay on every refresh
        splashDone: s.splashDone,
        // persist profile + recently viewed for return customers
        profile: s.profile,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore sessionId into localStorage so apiFetch can read it
        if (state?.sessionId) {
          try {
            localStorage.setItem(SESSION_KEY, state.sessionId);
          } catch {
            /* ignore */
          }
        }
      },
    }
  )
);
