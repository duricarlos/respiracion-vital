// Sound engine using Web Audio API with pre-decoded AudioBuffers
// iOS Safari: AudioContext.resume() from a user gesture permanently unlocks it.
// After that, AudioBufferSourceNode.start() works from timers/callbacks — no
// per-play user gesture required. No HTMLAudioElement = no iOS audio-session
// conflicts, no audible "unlock" sounds.

type SoundKey = "inhale" | "hold" | "exhale" | "complete" | "tick";

let ctx: AudioContext | null = null;
const buffers = new Map<SoundKey, AudioBuffer>();
let loadPromise: Promise<void> | null = null;

// Track active source nodes so we can stop phase sounds on transitions
let activeNodes: { key: SoundKey; source: AudioBufferSourceNode }[] = [];

const SOUND_URLS: Record<SoundKey, string> = {
  inhale: "/sounds/inhale.mp3",
  hold: "/sounds/hold.mp3",
  exhale: "/sounds/exhale.mp3",
  complete: "/sounds/complete.mp3",
  tick: "/sounds/tick.mp3",
};

async function loadSounds(audioCtx: AudioContext): Promise<void> {
  const keys = Object.keys(SOUND_URLS) as SoundKey[];
  await Promise.all(
    keys.map(async (key) => {
      try {
        const res = await fetch(SOUND_URLS[key]);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
        buffers.set(key, audioBuf);
      } catch (err) {
        console.warn(`[sounds] failed to load ${key}:`, err);
      }
    }),
  );
}

function play(key: SoundKey): void {
  if (!ctx) return;
  const buffer = buffers.get(key);
  if (!buffer) return;

  // Defensive: resume context if iOS suspended it (e.g. after tab switch)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  // Stop other phase sounds before playing a new one (tick is independent)
  if (key !== "tick") {
    activeNodes = activeNodes.filter((node) => {
      if (node.key !== "tick") {
        try {
          node.source.stop();
        } catch {
          /* already stopped */
        }
        return false;
      }
      return true;
    });
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);

  const entry = { key, source };
  activeNodes.push(entry);
  source.onended = () => {
    activeNodes = activeNodes.filter((n) => n !== entry);
  };
}

// ── Public API ──────────────────────────────────────────────────────

// MUST be called from a direct user gesture (tap/click) to unlock iOS audio.
// Safe to call multiple times — only creates one AudioContext and one load.
export async function initAudio(): Promise<void> {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }

  // resume() from user gesture is what unlocks audio on iOS
  await ctx.resume();

  if (!loadPromise) {
    loadPromise = loadSounds(ctx);
  }
  await loadPromise;
}

export function playInhaleSound(): void {
  play("inhale");
}

export function playHoldSound(): void {
  play("hold");
}

export function playExhaleSound(): void {
  play("exhale");
}

export function playCompleteSound(): void {
  // Stop everything before the completion chime
  activeNodes.forEach((node) => {
    try {
      node.source.stop();
    } catch {
      /* already stopped */
    }
  });
  activeNodes = [];
  play("complete");
}

export function playTickSound(): void {
  play("tick");
}
