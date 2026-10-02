"use client"

import React, { useState, useEffect } from "react"
import {
  Zap,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Shield,
  Heart,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Code2,
  Activity,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type PrimerStep = "triage" | "big-o" | "trade-off" | "centering"

const BIG_O_QUESTIONS = [
  {
    snippet: `for (int i = 1; i < n; i *= 2) {
    for (int j = 0; j < n; j++) {
        // O(1) operations
    }
}`,
    options: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"],
    correct: "O(N log N)",
    explanation: "Outer loop doubles i each iteration (log2 N steps). Inner loop runs N times. Total: O(N log N).",
  },
  {
    snippet: `int binarySearch(int[] arr, int target) {
    int l = 0, r = arr.length - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
}`,
    options: ["O(log N) Time, O(1) Space", "O(N) Time, O(1) Space", "O(log N) Time, O(log N) Space"],
    correct: "O(log N) Time, O(1) Space",
    explanation: "Search space halves each step (log N). Iterative implementation uses zero additional heap memory (O(1)).",
  },
  {
    snippet: `// Recursive Fibonacci
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`,
    options: ["O(N) Time", "O(N^2) Time", "O(2^N) Time, O(N) Call Stack Space", "O(log N) Time"],
    correct: "O(2^N) Time, O(N) Call Stack Space",
    explanation: "Binary recursion tree branches twice at each level of depth N. Call stack depth is O(N).",
  },
]

export function PrimerTab() {
  const [activeStep, setActiveStep] = useState<PrimerStep>("triage")
  const [isRunning, setIsRunning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60) // 15 mins
  const [triageRevealed, setTriageRevealed] = useState(false)

  // Big-O state
  const [selectedBigO, setSelectedBigO] = useState<Record<number, string>>({})
  const [tradeOffRevealed, setTradeOffRevealed] = useState(false)

  // Box breathing phase
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale")
  const [breathTimer, setBreathTimer] = useState(4)

  // Countdown timer
  useEffect(() => {
    let interval: any
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((s) => s - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, secondsRemaining])

  // Box breathing loop
  useEffect(() => {
    if (activeStep !== "centering") return
    const breathInterval = setInterval(() => {
      setBreathTimer((t) => {
        if (t <= 1) {
          setBreathPhase((prev) => {
            if (prev === "Inhale") return "Hold"
            if (prev === "Hold") return "Exhale"
            if (prev === "Exhale") return "Pause"
            return "Inhale"
          })
          return 4
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(breathInterval)
  }, [activeStep])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleReset = () => {
    setIsRunning(false)
    setSecondsRemaining(15 * 60)
    setActiveStep("triage")
    setTriageRevealed(false)
    setSelectedBigO({})
    setTradeOffRevealed(false)
  }

  return (
    <div className="space-y-6">
      {/* ── Sprint Countdown Clock Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent p-6 sm:p-7 backdrop-blur-xl shadow-lg shadow-teal-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-inner">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                Pre-Interview Cognitive Sprint
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                15-Minute Neuro-Adrenaline Primer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shake off cold nerves and prime your problem triage reflexes before stepping into a live interview call.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-500/30 shadow-md font-mono text-2xl font-black text-slate-900 dark:text-white tracking-wider">
              <Clock className={cn("w-5 h-5 text-teal-500", isRunning && "animate-spin")} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "p-3 rounded-2xl font-bold text-xs text-white transition-all shadow-md hover:scale-105",
                isRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-teal-600 hover:bg-teal-700"
              )}
              title={isRunning ? "Pause Countdown" : "Start 15-Minute Sprint"}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Reset Sprint"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Stage Step Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6">
          {[
            { id: "triage", label: "1. Bug Triage", desc: "3 Mins", num: "01" },
            { id: "big-o", label: "2. Big-O Reflex", desc: "2 Mins", num: "02" },
            { id: "trade-off", label: "3. Trade-off Flash", desc: "5 Mins", num: "03" },
            { id: "centering", label: "4. Box Breathing", desc: "5 Mins", num: "04" },
          ].map((s) => {
            const isActive = activeStep === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id as PrimerStep)}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 group hover:scale-[1.01]",
                  isActive
                    ? "bg-white dark:bg-slate-900 border-teal-500 shadow-md ring-2 ring-teal-500/20 text-slate-900 dark:text-white"
                    : "bg-white/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-500 hover:border-slate-400"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-teal-500">{s.num}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{s.desc}</span>
                </div>
                <span className="text-xs font-black">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Stage 1: Bug Triage (3 Mins) ── */}
      {activeStep === "triage" && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 space-y-4 backdrop-blur-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                Stage 1 of 4 • Bug Triage (3 Minutes)
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Find the Subtle Concurrency / Boundary Flaw in 60s
              </h3>
            </div>
            <button
              onClick={() => setActiveStep("big-o")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 transition-transform"
            >
              <span>Next: Big-O Reflex</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 p-5 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            <pre>{`// Task: Thread-safe singleton counter in high-throughput microservice
public class MetricsCollector {
    private static MetricsCollector instance = null;
    private int requestCount = 0;

    private MetricsCollector() {}

    public static MetricsCollector getInstance() {
        if (instance == null) {
            instance = new MetricsCollector(); // <-- Can multiple threads enter here simultaneously?
        }
        return instance;
    }

    public void increment() {
        requestCount++; // <-- Is ++ an atomic operation under JVM bytecode?
    }
}`}</pre>
          </div>

          <div className="pt-2">
            {!triageRevealed ? (
              <button
                onClick={() => setTriageRevealed(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md hover:scale-[1.02]"
              >
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span>Reveal 2 Subtle Production Bugs</span>
              </button>
            ) : (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in">
                <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block text-sm">
                  Staff Engineer Code Review:
                </strong>
                <p className="leading-relaxed">
                  <strong>1. Race Condition on Instantiation:</strong> Without <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">synchronized</code> or double-checked locking with <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">volatile</code>, two concurrent threads can evaluate <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">instance == null</code> simultaneously and instantiate two separate singletons.
                </p>
                <p className="leading-relaxed">
                  <strong>2. Non-atomic Increment:</strong> <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">requestCount++</code> translates to three byte-code instructions (read, modify, write back). Under high concurrent load, writes will overwrite each other. Solution: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">AtomicInteger</code> or synchronization.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stage 2: Big-O Reflex (2 Mins) ── */}
      {activeStep === "big-o" && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 space-y-6 backdrop-blur-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                Stage 2 of 4 • Complexity Reflex (2 Minutes)
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Instant Big-O Identification
              </h3>
            </div>
            <button
              onClick={() => setActiveStep("trade-off")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 transition-transform"
            >
              <span>Next: Trade-off Flash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {BIG_O_QUESTIONS.map((q, idx) => {
              const selected = selectedBigO[idx]
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed shadow-inner">
                    {q.snippet}
                  </pre>

                  <div className="flex flex-wrap gap-2.5">
                    {q.options.map((opt) => {
                      const isChosen = selected === opt
                      const isRight = selected && opt === q.correct
                      const isWrong = isChosen && opt !== q.correct
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedBigO((prev) => ({ ...prev, [idx]: opt }))}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-[1.02]",
                            isRight
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                              : isWrong
                              ? "bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400 animate-in shake"
                              : isChosen
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-500"
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>

                  {selected && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-sans italic pt-1 animate-in fade-in">
                      {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Stage 3: Architectural Trade-off Flash (5 Mins) ── */}
      {activeStep === "trade-off" && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 space-y-4 backdrop-blur-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                Stage 3 of 4 • Trade-off Flash (5 Minutes)
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                The 2-Sentence Justification Challenge
              </h3>
            </div>
            <button
              onClick={() => setActiveStep("centering")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 transition-transform"
            >
              <span>Next: Centering & Anchors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            <span className="font-extrabold text-teal-600 uppercase text-[10px] tracking-wider block">
              High-Contention Scenario:
            </span>
            <p>
              &quot;We are designing a flash-sale concert ticket checkout service. Should we use <strong>Optimistic Concurrency Control (Version checks)</strong> or <strong>Pessimistic Locking (SELECT FOR UPDATE)</strong> at the database layer when reserving high-demand seats? Justify in 2 sentences.&quot;
            </p>
          </div>

          <div className="pt-2">
            {!tradeOffRevealed ? (
              <button
                onClick={() => setTradeOffRevealed(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md hover:scale-[1.02]"
              >
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span>Reveal Staff Engineer Trade-off Verdict</span>
              </button>
            ) : (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 animate-in fade-in">
                <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block text-sm">
                  Verdict & Trade-off:
                </strong>
                <p className="leading-relaxed font-medium">
                  <strong>Pessimistic Locking with short timeout (or Redis distributed lock / Lua script):</strong> In extreme write contention (thousands of buyers competing for 10 seats), optimistic locking leads to 99.9% abort-and-retry waste, destroying database throughput with rollbacks.
                </p>
                <p className="leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                  <strong>Senior Polish Point:</strong> In real production, neither raw DB lock is used at the front door; reservations are queued in Redis via atomic decrement with TTL, persisting to Postgres asynchronously upon payment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stage 4: Centering & Box Breathing (5 Mins) ── */}
      {activeStep === "centering" && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-7 space-y-7 backdrop-blur-xl shadow-sm text-center animate-in fade-in duration-300">
          <div>
            <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              Stage 4 of 4 • Centering & Confidence Anchor
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Reset Heart Rate & Lock in Your 3 Golden Talking Points
            </h3>
          </div>

          {/* Visual Breathing Circle with Glowing Halo */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div
              className={cn(
                "w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl relative",
                breathPhase === "Inhale"
                  ? "scale-110 border-teal-500 bg-teal-500/15 text-teal-600 dark:text-teal-400 shadow-teal-500/30"
                  : breathPhase === "Hold"
                  ? "scale-110 border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-amber-500/30"
                  : breathPhase === "Exhale"
                  ? "scale-90 border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/30"
                  : "scale-90 border-slate-400 bg-slate-400/15 text-slate-500 shadow-slate-500/30"
              )}
            >
              <span className="text-lg font-black uppercase tracking-widest">{breathPhase}</span>
              <span className="text-3xl font-mono font-extrabold mt-1">{breathTimer}s</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium">Box Breathing (4-4-4-4) lowers cortisol and steadies voice frequency in 120 seconds.</p>
          </div>

          {/* 3 Golden Talking Points Flashcard */}
          <div className="max-w-lg mx-auto p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-3 shadow-md">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Golden Interview Anchors
            </span>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Think Out Loud:</strong> Clarify inputs, edge cases, and scale requirements before writing a single line of code.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Trade-Offs Over Perfection:</strong> Every architectural choice has a cost; state the trade-off explicitly.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Composure Under Curveballs:</strong> When interviewer pushes back, acknowledge calmly: &quot;That is a great constraint, let us adjust our approach.&quot;</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
