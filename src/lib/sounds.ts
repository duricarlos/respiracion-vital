// Sound engine using Web Audio API
// Generates pleasant tones for breathing cues without any audio files

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Create a pleasant bell-like tone
function createTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  // Set up filter for a warmer sound
  filterNode.type = "lowpass";
  filterNode.frequency.value = 2000;
  filterNode.Q.value = 1;

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  // Envelope: smooth attack and release
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect: oscillator -> filter -> gain -> output
  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

// Harmonics for a richer bell sound
function createBell(baseFreq: number, volume: number = 0.2) {
  const ctx = getAudioContext();
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
}

// Sound for "Inhale" - ascending, bright, opening
export function playInhaleSound() {
  createBell(523.25, 0.2); // C5
  setTimeout(() => createTone(659.25, 0.8, "sine", 0.15), 100); // E5
  setTimeout(() => createTone(783.99, 0.6, "sine", 0.1), 200); // G5
}

// Sound for "Hold" - soft, sustained, centered
export function playHoldSound() {
  createTone(392, 1.2, "sine", 0.12); // G4
  createTone(493.88, 1.2, "sine", 0.08); // B4
}

// Sound for "Exhale" - descending, warm, releasing
export function playExhaleSound() {
  createBell(440, 0.18); // A4
  setTimeout(() => createTone(349.23, 0.8, "sine", 0.12), 100); // F4
  setTimeout(() => createTone(293.66, 0.6, "sine", 0.08), 200); // D4
}

// Sound for "Complete" - celebratory chord
export function playCompleteSound() {
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C major chord
  freqs.forEach((freq, i) => {
    setTimeout(() => createBell(freq, 0.15), i * 150);
  });
}

// Gentle tick sound for countdown
export function playTickSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = 880;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

// Initialize audio context on user interaction
export function initAudio() {
  getAudioContext();
}
