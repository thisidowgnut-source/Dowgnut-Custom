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
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtxClass();
    } catch {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
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

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio node error gracefully suppressed
  }
}

// 🍩 Tap — subtle low-frequency punch
export function playTap(freq = 420) {
  playTone(freq, 0.04, "triangle", 0.05);
}

// 🎉 Add to cart — rich harmonic chime (crisp double bell)
export function playAddToCart() {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [
      { f: 880, d: 0.18, v: 0.08, t: 0 },
      { f: 1320, d: 0.22, v: 0.06, t: 0.05 },
      { f: 1760, d: 0.25, v: 0.04, t: 0.1 },
    ].forEach(({ f, d, v, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(v, now + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d);
    });
  } catch {
    playTone(880, 0.1, "sine", 0.08);
  }
}

// 💗 Favorite — soft heart pop
export function playFavorite() {
  playTone(587.33, 0.08, "triangle", 0.06);
  setTimeout(() => playTone(880, 0.12, "sine", 0.05), 40);
}

// 💨 Swipe — physical whoosh with frequency modulation
export function playSwipe(speedRatio = 1) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const centerFreq = Math.min(2200, Math.max(600, 900 * speedRatio));
    filter.frequency.setValueAtTime(centerFreq, ctx.currentTime);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // Graceful fallback
  }
}

// 🎊 Order complete — joyful ascending celebration chord
export function playOrderComplete() {
  playTone(523.25, 0.15, "sine", 0.08); // C5
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.08), 110); // E5
  setTimeout(() => playTone(783.99, 0.18, "sine", 0.09), 220); // G5
  setTimeout(() => playTone(1046.50, 0.28, "sine", 0.07), 330); // C6
}

// 🔄 Page transition — subtle smooth whoosh
export function playTransition() {
  playTone(392, 0.08, "sine", 0.03);
  setTimeout(() => playTone(587.33, 0.1, "sine", 0.03), 45);
}

