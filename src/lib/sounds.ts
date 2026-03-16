// Sound engine using HTMLAudioElement + MP3 files
// Single instance per sound — stops previous before playing next

const sounds: Record<string, HTMLAudioElement> = {};
let initialized = false;

function createAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
}

// Stop all currently playing sounds
function stopAll() {
  for (const audio of Object.values(sounds)) {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}

function playSingle(key: string) {
  const audio = sounds[key];
  if (!audio) return;
  // Stop any phase sound that's still ringing (but not tick)
  if (key !== "tick") {
    for (const [k, a] of Object.entries(sounds)) {
      if (k !== "tick" && k !== key && !a.paused) {
        a.pause();
        a.currentTime = 0;
      }
    }
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// Preload all sounds — MUST be called from a user gesture (click/tap)
export function initAudio(): void {
  if (!initialized) {
    sounds.inhale = createAudio("/sounds/inhale.mp3");
    sounds.hold = createAudio("/sounds/hold.mp3");
    sounds.exhale = createAudio("/sounds/exhale.mp3");
    sounds.complete = createAudio("/sounds/complete.mp3");
    sounds.tick = createAudio("/sounds/tick.mp3");
    initialized = true;
  }

  // Unlock each audio element on iOS (play+pause from user gesture)
  for (const audio of Object.values(sounds)) {
    const p = audio.play();
    if (p) {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  }
}

export function playInhaleSound() {
  playSingle("inhale");
}

export function playHoldSound() {
  playSingle("hold");
}

export function playExhaleSound() {
  playSingle("exhale");
}

export function playCompleteSound() {
  stopAll();
  playSingle("complete");
}

export function playTickSound() {
  playSingle("tick");
}
