// Generate breathing exercise audio cues as WAV files
// Run: node scripts/generate-sounds.js

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const outDir = path.join(__dirname, "..", "public", "sounds");

// ─── WAV Writer ─────────────────────────────────────────────────────

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const val = Math.round(clamped * 32767);
    buffer.writeInt16LE(val, 44 + i * 2);
  }

  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`  Created ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ─── DSP Helpers ────────────────────────────────────────────────────

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

// Soft attack + exponential decay envelope
function envelope(t, attack, decay, totalDuration) {
  if (t < attack) return t / attack;
  const decayStart = t - attack;
  const decayDuration = totalDuration - attack;
  return Math.exp((-decayStart / decayDuration) * decay);
}

// Bell-like tone: fundamental + inharmonic partials
function bellTone(t, baseFreq, volume, duration) {
  const partials = [
    { ratio: 1.0, amp: 1.0, decay: 4 },
    { ratio: 2.4, amp: 0.5, decay: 5 },
    { ratio: 3.0, amp: 0.3, decay: 6 },
    { ratio: 4.5, amp: 0.15, decay: 7 },
  ];
  let sample = 0;
  for (const p of partials) {
    sample +=
      sine(baseFreq * p.ratio, t) *
      p.amp *
      envelope(t, 0.003, p.decay, duration);
  }
  return sample * volume;
}

// Generate sample array
function generate(durationSec, fn) {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = fn(t, durationSec);
  }
  return samples;
}

// Mix multiple sample arrays (pads shorter ones with silence)
function mix(...arrays) {
  const maxLen = Math.max(...arrays.map((a) => a.length));
  const out = new Float64Array(maxLen);
  for (const arr of arrays) {
    for (let i = 0; i < arr.length; i++) {
      out[i] += arr[i];
    }
  }
  return out;
}

// Offset samples by a delay in seconds
function delay(samples, delaySec) {
  const delaySamples = Math.floor(SAMPLE_RATE * delaySec);
  const out = new Float64Array(samples.length + delaySamples);
  for (let i = 0; i < samples.length; i++) {
    out[i + delaySamples] = samples[i];
  }
  return out;
}

// ─── Sound Generators ───────────────────────────────────────────────

function generateInhale() {
  // Ascending bell chord: C5 -> E5 -> G5 (staggered)
  const bell1 = generate(1.5, (t, d) => bellTone(t, 523.25, 0.35, d));
  const bell2 = delay(
    generate(1.2, (t, d) => bellTone(t, 659.25, 0.25, d)),
    0.1
  );
  const bell3 = delay(
    generate(1.0, (t, d) => bellTone(t, 783.99, 0.18, d)),
    0.2
  );
  return mix(bell1, bell2, bell3);
}

function generateHold() {
  // Soft sustained fifth: G4 + D5
  const tone1 = generate(1.2, (t, d) => {
    return sine(392, t) * 0.2 * envelope(t, 0.05, 3, d);
  });
  const tone2 = generate(1.2, (t, d) => {
    return sine(587.33, t) * 0.12 * envelope(t, 0.05, 3, d);
  });
  return mix(tone1, tone2);
}

function generateExhale() {
  // Descending bell chord: A4 -> F4 -> D4
  const bell1 = generate(1.5, (t, d) => bellTone(t, 440, 0.3, d));
  const bell2 = delay(
    generate(1.2, (t, d) => bellTone(t, 349.23, 0.22, d)),
    0.1
  );
  const bell3 = delay(
    generate(1.0, (t, d) => bellTone(t, 293.66, 0.15, d)),
    0.2
  );
  return mix(bell1, bell2, bell3);
}

function generateComplete() {
  // Arpeggiated C major chord: C5 -> E5 -> G5 -> C6
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  const parts = freqs.map((freq, i) =>
    delay(
      generate(1.8 - i * 0.2, (t, d) => bellTone(t, freq, 0.22, d)),
      i * 0.15
    )
  );
  return mix(...parts);
}

function generateTick() {
  // Short soft click
  return generate(0.12, (t, d) => {
    return sine(880, t) * 0.3 * envelope(t, 0.002, 8, d);
  });
}

// ─── Main ───────────────────────────────────────────────────────────

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log("Generating breathing sounds...\n");

writeWav("inhale.wav", generateInhale());
writeWav("hold.wav", generateHold());
writeWav("exhale.wav", generateExhale());
writeWav("complete.wav", generateComplete());
writeWav("tick.wav", generateTick());

console.log("\nDone! WAV files in public/sounds/");
