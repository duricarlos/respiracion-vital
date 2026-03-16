// Sound engine using Web Audio API
// Generates pleasant tones for breathing cues without any audio files

let audioContext: AudioContext | null = null;
let isUnlocked = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Unlock AudioContext on iOS/mobile by playing a silent buffer
// This MUST be called from a direct user gesture (click/touch)
export async function initAudio(): Promise<void> {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  if (!isUnlocked) {
    // Play a tiny silent buffer to fully unlock audio on iOS
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isUnlocked = true;
  }
}

// Ensure context is running before any sound
function ensureContext(): AudioContext {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

// Create a pleasant bell-like tone
function createTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
) {
  try {
    const ctx = ensureContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    filterNode.type = "lowpass";
    filterNode.frequency.value = 2000;
    filterNode.Q.value = 1;

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // Silently fail if audio is not available
  }
}

// Harmonics for a richer bell sound
function createBell(baseFreq: number, volume: number = 0.2) {
  try {
    const ctx = ensureContext();
    const harmonics = [1, 2.4, 3, 4.5];
    const volumes = [1, 0.5, 0.3, 0.15];
    const duration = 1.5;

    harmonics.forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = baseFreq * harmonic;

      const now = ctx.currentTime;
      const vol = volume * volumes[i];
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch {
    // Silently fail
  }
}

// Sound for "Inhale" - ascending, bright, opening
export function playInhaleSound() {
  createBell(523.25, 0.25); // C5
  setTimeout(() => createTone(659.25, 0.8, "sine", 0.18), 100); // E5
  setTimeout(() => createTone(783.99, 0.6, "sine", 0.12), 200); // G5
}

// Sound for "Hold" - soft, sustained, centered
export function playHoldSound() {
  createTone(392, 1.2, "sine", 0.15); // G4
  createTone(493.88, 1.2, "sine", 0.1); // B4
}

// Sound for "Exhale" - descending, warm, releasing
export function playExhaleSound() {
  createBell(440, 0.22); // A4
  setTimeout(() => createTone(349.23, 0.8, "sine", 0.15), 100); // F4
  setTimeout(() => createTone(293.66, 0.6, "sine", 0.1), 200); // D4
}

// Sound for "Complete" - celebratory chord
export function playCompleteSound() {
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((freq, i) => {
    setTimeout(() => createBell(freq, 0.18), i * 150);
  });
}

// Gentle tick sound for countdown
export function playTickSound() {
  try {
    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Silently fail
  }
}
