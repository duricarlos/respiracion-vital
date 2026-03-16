// Sound engine using HTMLAudioElement + MP3 files
// Reliable on iOS Safari, Android Chrome, and all desktop browsers

const sounds: Record<string, HTMLAudioElement[]> = {};

// Pool size: how many concurrent instances of each sound we allow
const POOL_SIZE = 3;

function createPool(src: string): HTMLAudioElement[] {
  const pool: HTMLAudioElement[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 1.0;
    pool.push(audio);
  }
  return pool;
}

// Pick the first audio element in the pool that is not currently playing
function playFromPool(pool: HTMLAudioElement[]) {
  for (const audio of pool) {
    if (audio.paused || audio.ended) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
  }
  // All busy — clone and play (fallback)
  const clone = pool[0].cloneNode() as HTMLAudioElement;
  clone.currentTime = 0;
  clone.play().catch(() => {});
}

// Preload all sounds — call this from a user gesture (click/tap)
export function initAudio(): void {
  if (Object.keys(sounds).length > 0) {
    // Already initialized — just "warm up" by touching each pool
    // iOS requires at least one play() from a user gesture
    for (const pool of Object.values(sounds)) {
      for (const audio of pool) {
        // Play + immediately pause to unlock on iOS
        const p = audio.play();
        if (p) {
          p.then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {});
        }
      }
    }
    return;
  }

  sounds.inhale = createPool("/sounds/inhale.mp3");
  sounds.hold = createPool("/sounds/hold.mp3");
  sounds.exhale = createPool("/sounds/exhale.mp3");
  sounds.complete = createPool("/sounds/complete.mp3");
  sounds.tick = createPool("/sounds/tick.mp3");

  // Warm up all pools on first init (user gesture context)
  for (const pool of Object.values(sounds)) {
    for (const audio of pool) {
      const p = audio.play();
      if (p) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    }
  }
}

export function playInhaleSound() {
  if (sounds.inhale) playFromPool(sounds.inhale);
}

export function playHoldSound() {
  if (sounds.hold) playFromPool(sounds.hold);
}

export function playExhaleSound() {
  if (sounds.exhale) playFromPool(sounds.exhale);
}

export function playCompleteSound() {
  if (sounds.complete) playFromPool(sounds.complete);
}

export function playTickSound() {
  if (sounds.tick) playFromPool(sounds.tick);
}
