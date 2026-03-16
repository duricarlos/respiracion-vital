"use client";

import { useState, useEffect, useCallback, useRef } from "react";


type Phase = "inhale" | "hold" | "exhale";
type AppState = "wizard" | "breathing" | "complete";

interface BreathingConfig {
  baseTime: number;
  cycles: number;
}

// ─── Wizard Step Components ─────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-float-in flex flex-col items-center gap-10 text-center">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-accent/10 animate-breathe-hold" />
        <div className="absolute inset-6 rounded-full border border-accent/20 animate-breathe-hold [animation-delay:0.3s]" />
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent to-accent-cyan opacity-80 shadow-[0_0_60px_rgba(94,234,212,0.3)] animate-breathe-hold [animation-delay:0.6s]" />
      </div>

      <div className="space-y-4">
        <h1
          className="text-5xl font-light tracking-tight sm:text-6xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Respiracion
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text font-medium text-transparent">
            Vital
          </span>
        </h1>
        <p className="mx-auto max-w-xs text-base leading-relaxed text-secondary">
          Guia tu respiracion con la tecnica 1-4-2. Inhala, retiene, exhala.
          Sonidos te avisaran en cada fase.
        </p>
      </div>

      <button
        onClick={onNext}
        className="group relative mt-2 overflow-hidden rounded-full bg-gradient-to-r from-accent to-accent-cyan px-10 py-4 text-lg font-medium text-[#0a0e1a] transition-all duration-300 hover:shadow-[0_0_40px_rgba(94,234,212,0.3)] active:scale-95"
      >
        <span className="relative z-10">Comenzar</span>
        <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
      </button>
    </div>
  );
}

function TimeStep({
  baseTime,
  onChange,
  onNext,
  onBack,
}: {
  baseTime: number;
  onChange: (t: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const inhale = baseTime;
  const hold = baseTime * 4;
  const exhale = baseTime * 2;

  return (
    <div className="animate-float-in flex w-full max-w-sm flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Paso 1 de 2
        </p>
        <h2
          className="text-3xl font-light sm:text-4xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Tiempo base
        </h2>
        <p className="text-sm text-secondary">
          Elige los segundos de inhalacion. El resto se calcula automaticamente.
        </p>
      </div>

      {/* Large number display */}
      <div className="flex flex-col items-center">
        <span
          className="block text-9xl font-extralight tabular-nums text-accent drop-shadow-[0_0_30px_rgba(94,234,212,0.3)] leading-none"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {baseTime}
        </span>
        <span className="mt-2 text-sm font-medium text-secondary">
          segundos
        </span>
      </div>

      {/* Slider */}
      <div className="w-full px-4">
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={baseTime}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          aria-label="Tiempo base en segundos"
        />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>2s</span>
          <span>10s</span>
        </div>
      </div>

      {/* Preview of all times */}
      <div className="glass-card grid w-full grid-cols-3 gap-4 rounded-2xl p-5">
        <TimePreview label="Inhala" seconds={inhale} color="from-accent to-accent-cyan" />
        <TimePreview label="Retiene" seconds={hold} color="from-accent-indigo to-accent-cyan" />
        <TimePreview label="Exhala" seconds={exhale} color="from-accent-cyan to-accent" />
      </div>

      {/* Navigation */}
      <div className="flex w-full gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-white/10 py-3.5 text-sm font-medium text-secondary transition-all hover:border-accent/30 hover:text-foreground active:scale-95"
        >
          Atras
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-full bg-gradient-to-r from-accent to-accent-cyan py-3.5 text-sm font-medium text-[#0a0e1a] transition-all hover:shadow-[0_0_30px_rgba(94,234,212,0.25)] active:scale-95"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function TimePreview({
  label,
  seconds,
  color,
}: {
  label: string;
  seconds: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`bg-gradient-to-b ${color} bg-clip-text text-3xl font-light tabular-nums text-transparent leading-none sm:text-4xl`}
        style={{ fontFamily: "var(--font-cormorant)" }}
      >
        {seconds}
      </span>
      <span className="text-xs text-secondary">{label}</span>
    </div>
  );
}

function CyclesStep({
  cycles,
  onChange,
  onStart,
  onBack,
  config,
}: {
  cycles: number;
  onChange: (c: number) => void;
  onStart: () => void;
  onBack: () => void;
  config: BreathingConfig;
}) {
  const totalSeconds =
    (config.baseTime + config.baseTime * 4 + config.baseTime * 2) * cycles;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return (
    <div className="animate-float-in flex w-full max-w-sm flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Paso 2 de 2
        </p>
        <h2
          className="text-3xl font-light sm:text-4xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Ciclos de respiracion
        </h2>
        <p className="text-sm text-secondary">
          Cuantas veces quieres repetir el ciclo completo?
        </p>
      </div>

      {/* Cycle selector */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onChange(Math.max(1, cycles - 1))}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 text-2xl font-light text-secondary transition-all hover:border-accent/40 hover:text-accent active:scale-90"
          aria-label="Reducir ciclos"
        >
          -
        </button>
        <span
          className="text-8xl font-extralight tabular-nums text-accent drop-shadow-[0_0_30px_rgba(94,234,212,0.3)] leading-none"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {cycles}
        </span>
        <button
          onClick={() => onChange(Math.min(20, cycles + 1))}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 text-2xl font-light text-secondary transition-all hover:border-accent/40 hover:text-accent active:scale-90"
          aria-label="Aumentar ciclos"
        >
          +
        </button>
      </div>

      {/* Duration estimate */}
      <div className="glass-card flex w-full flex-col items-center gap-1 rounded-2xl p-4">
        <span className="text-xs uppercase tracking-widest text-muted">
          Duracion estimada
        </span>
        <span
          className="text-2xl font-light text-foreground"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {minutes > 0 ? `${minutes} min ` : ""}
          {secs > 0 ? `${secs} seg` : ""}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex w-full gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-white/10 py-3.5 text-sm font-medium text-secondary transition-all hover:border-accent/30 hover:text-foreground active:scale-95"
        >
          Atras
        </button>
        <button
          onClick={onStart}
          className="flex-1 rounded-full bg-gradient-to-r from-accent to-accent-cyan py-3.5 text-sm font-medium text-[#0a0e1a] transition-all hover:shadow-[0_0_30px_rgba(94,234,212,0.25)] active:scale-95"
        >
          Iniciar
        </button>
      </div>
    </div>
  );
}

// ─── Breathing Timer ────────────────────────────────────────────────

function BreathingTimer({
  config,
  onComplete,
  onStop,
}: {
  config: BreathingConfig;
  onComplete: () => void;
  onStop: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(config.baseTime);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("inhale");
  const secondsRef = useRef(config.baseTime);
  const cycleRef = useRef(1);

  const phaseDurations = useRef({
    inhale: config.baseTime,
    hold: config.baseTime * 4,
    exhale: config.baseTime * 2,
  }).current;

  const phaseLabels: Record<Phase, string> = {
    inhale: "Inhala",
    hold: "Retiene",
    exhale: "Exhala",
  };

  const phaseColors: Record<Phase, string> = {
    inhale: "from-accent to-accent-cyan",
    hold: "from-accent-indigo to-accent-cyan",
    exhale: "from-accent-cyan to-accent",
  };

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextPhase = useCallback(() => {
    const current = phaseRef.current;
    const cycle = cycleRef.current;

    if (current === "inhale") {
      phaseRef.current = "hold";
      setPhase("hold");
      secondsRef.current = phaseDurations.hold;
      setSecondsLeft(phaseDurations.hold);
    } else if (current === "hold") {
      phaseRef.current = "exhale";
      setPhase("exhale");
      secondsRef.current = phaseDurations.exhale;
      setSecondsLeft(phaseDurations.exhale);
    } else {
      if (cycle >= config.cycles) {
        clearTimer();
        onComplete();
        return;
      }
      cycleRef.current = cycle + 1;
      setCurrentCycle(cycle + 1);
      phaseRef.current = "inhale";
      setPhase("inhale");
      secondsRef.current = phaseDurations.inhale;
      setSecondsLeft(phaseDurations.inhale);
    }
  }, [config.cycles, phaseDurations, clearTimer, onComplete]);

  const tick = useCallback(() => {
    const s = secondsRef.current;
    if (s <= 1) {
      nextPhase();
    } else {
      secondsRef.current = s - 1;
      setSecondsLeft(s - 1);
    }
  }, [nextPhase]);

  // Start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return clearTimer;
  }, [tick, clearTimer]);

  // Pause / Resume
  const handlePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        clearTimer();
      } else {
        timerRef.current = setInterval(tick, 1000);
      }
      return next;
    });
  }, [tick, clearTimer]);

  const handleStop = useCallback(() => {
    clearTimer();
    onStop();
  }, [clearTimer, onStop]);

  const totalPhaseTime = phaseDurations[phase];
  const progress = 1 - secondsLeft / totalPhaseTime;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);

  const breatheClass =
    phase === "inhale"
      ? "animate-breathe-in"
      : phase === "exhale"
      ? "animate-breathe-out"
      : "animate-breathe-hold";

  const glowColor =
    phase === "inhale"
      ? "rgba(94,234,212,0.08)"
      : phase === "hold"
      ? "rgba(129,140,248,0.08)"
      : "rgba(34,211,238,0.08)";

  const innerColor =
    phase === "inhale"
      ? "rgba(94,234,212,0.15)"
      : phase === "hold"
      ? "rgba(129,140,248,0.15)"
      : "rgba(34,211,238,0.15)";

  const borderColor =
    phase === "inhale"
      ? "rgba(94,234,212,0.2)"
      : phase === "hold"
      ? "rgba(129,140,248,0.2)"
      : "rgba(34,211,238,0.2)";

  const gradientStart =
    phase === "inhale" ? "#5eead4" : phase === "hold" ? "#818cf8" : "#22d3ee";
  const gradientEnd =
    phase === "inhale" ? "#22d3ee" : phase === "hold" ? "#22d3ee" : "#5eead4";

  return (
    <div className="animate-fade-in flex flex-col items-center gap-6">
      {/* Cycle counter */}
      <span className="text-xs uppercase tracking-widest text-muted">
        Ciclo {currentCycle} de {config.cycles}
      </span>

      {/* Main breathing circle with timer */}
      <div className="relative flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96 md:h-[28rem] md:w-[28rem]">
        {/* Outer glow */}
        <div
          className={`absolute inset-0 rounded-full ${breatheClass}`}
          style={
            {
              "--duration": `${totalPhaseTime}s`,
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            } as React.CSSProperties
          }
        />

        {/* Progress ring SVG */}
        <svg
          className="absolute inset-0 m-auto h-72 w-72 -rotate-90 sm:h-80 sm:w-80 md:h-96 md:w-96"
          viewBox="0 0 300 300"
        >
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="3"
          />
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner breathing circle */}
        <div
          className={`absolute inset-0 m-auto h-48 w-48 rounded-full sm:h-56 sm:w-56 md:h-64 md:w-64 ${breatheClass}`}
          style={
            {
              "--duration": `${totalPhaseTime}s`,
              background: `radial-gradient(circle at 40% 40%, ${innerColor}, transparent)`,
              border: `1px solid ${borderColor}`,
            } as React.CSSProperties
          }
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center">
          <span
            className={`text-8xl font-extralight tabular-nums leading-none drop-shadow-lg sm:text-9xl md:text-[11rem] bg-gradient-to-b ${phaseColors[phase]} bg-clip-text text-transparent`}
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {secondsLeft}
          </span>
          <span
            className={`mt-2 text-xl font-light tracking-wide sm:text-2xl md:text-3xl bg-gradient-to-r ${phaseColors[phase]} bg-clip-text text-transparent`}
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {phaseLabels[phase]}
          </span>
        </div>
      </div>

      {/* Phase indicator dots */}
      <div className="flex items-center gap-5">
        {(["inhale", "hold", "exhale"] as Phase[]).map((p) => (
          <div key={p} className="flex flex-col items-center gap-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                p === phase
                  ? "scale-125 bg-accent shadow-[0_0_10px_rgba(94,234,212,0.5)]"
                  : "bg-white/10"
              }`}
            />
            <span
              className={`text-[11px] transition-colors ${
                p === phase ? "text-accent" : "text-muted"
              }`}
            >
              {phaseLabels[p]}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handlePause}
          className="rounded-full border border-white/10 px-8 py-3 text-sm font-medium text-secondary transition-all hover:border-accent/30 hover:text-foreground active:scale-95"
        >
          {isPaused ? "Reanudar" : "Pausar"}
        </button>
        <button
          onClick={handleStop}
          className="rounded-full border border-red-500/20 px-8 py-3 text-sm font-medium text-red-400/70 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95"
        >
          Detener
        </button>
      </div>
    </div>
  );
}

// ─── Complete Screen ────────────────────────────────────────────────

function CompleteScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="animate-float-in flex flex-col items-center gap-10 text-center">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/5 animate-breathe-hold" />
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-cyan shadow-[0_0_60px_rgba(94,234,212,0.3)]">
          <svg
            className="h-12 w-12 text-[#0a0e1a]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        <h2
          className="text-4xl font-light sm:text-5xl"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Sesion
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text font-medium text-transparent">
            Completada
          </span>
        </h2>
        <p className="text-base text-secondary">
          Excelente trabajo. Tu cuerpo y mente te lo agradecen.
        </p>
      </div>

      <button
        onClick={onRestart}
        className="rounded-full bg-gradient-to-r from-accent to-accent-cyan px-10 py-4 text-lg font-medium text-[#0a0e1a] transition-all hover:shadow-[0_0_40px_rgba(94,234,212,0.3)] active:scale-95"
      >
        Nueva sesion
      </button>
    </div>
  );
}

// ─── Main App Component ─────────────────────────────────────────────

export default function BreathingApp() {
  const [appState, setAppState] = useState<AppState>("wizard");
  const [wizardStep, setWizardStep] = useState(0);
  const [config, setConfig] = useState<BreathingConfig>({
    baseTime: 4,
    cycles: 5,
  });

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleStart = useCallback(() => {
    setAppState("breathing");
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      {appState === "wizard" && (
        <>
          {wizardStep === 0 && (
            <WelcomeStep
              onNext={() => {
                setWizardStep(1);
              }}
            />
          )}
          {wizardStep === 1 && (
            <TimeStep
              baseTime={config.baseTime}
              onChange={(t) => setConfig((c) => ({ ...c, baseTime: t }))}
              onNext={() => setWizardStep(2)}
              onBack={() => setWizardStep(0)}
            />
          )}
          {wizardStep === 2 && (
            <CyclesStep
              cycles={config.cycles}
              onChange={(c) => setConfig((prev) => ({ ...prev, cycles: c }))}
              onStart={handleStart}
              onBack={() => setWizardStep(1)}
              config={config}
            />
          )}
        </>
      )}

      {appState === "breathing" && (
        <BreathingTimer
          config={config}
          onComplete={() => setAppState("complete")}
          onStop={() => {
            setAppState("wizard");
            setWizardStep(0);
          }}
        />
      )}

      {appState === "complete" && (
        <CompleteScreen
          onRestart={() => {
            setAppState("wizard");
            setWizardStep(0);
          }}
        />
      )}
    </div>
  );
}
