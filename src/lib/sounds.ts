/**
 * Sound Design — subtle audio feedback using Web Audio API.
 * No external files needed — generates tones programmatically.
 * Respects user preference (can be toggled off).
 */

let audioCtx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.1) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// 🎉 Add to cart — quick pop
export function playAddToCart() {
  playTone(800, 0.1, "sine", 0.08);
  setTimeout(() => playTone(1200, 0.08, "sine", 0.06), 60);
}

// 💗 Favorite — soft heart pop
export function playFavorite() {
  playTone(600, 0.12, "sine", 0.06);
}

// 💨 Swipe — woosh (white noise burst)
export function playSwipe() {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1000;
  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// 🎊 Order complete — celebration jingle (3 ascending notes)
export function playOrderComplete() {
  playTone(523, 0.15, "sine", 0.08); // C
  setTimeout(() => playTone(659, 0.15, "sine", 0.08), 120); // E
  setTimeout(() => playTone(784, 0.2, "sine", 0.08), 240); // G
}

// 🔄 Page transition — subtle whoosh
export function playTransition() {
  playTone(400, 0.1, "sine", 0.04);
  setTimeout(() => playTone(600, 0.1, "sine", 0.03), 50);
}
