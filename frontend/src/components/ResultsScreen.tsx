"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

export function ResultsScreen() {
  const summary = useGameStore((s) => s.summary);
  const difficulties = useGameStore((s) => s.difficulties);
  const reset = useGameStore((s) => s.reset);
  const start = useGameStore((s) => s.start);

  if (!summary) return null;

  const label = difficulties.find((d) => d.key === summary.difficulty)?.label ?? summary.difficulty;
  const accuracy = Math.round((summary.correctAnswers / summary.totalQuestions) * 100);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col justify-center gap-5 px-5 py-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass rounded-3xl px-6 py-8 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {label} round complete
        </p>

        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.12 }}
          className="mt-3 bg-gradient-to-br from-accent to-accent-soft bg-clip-text text-6xl font-semibold tabular-nums tracking-tighter text-transparent"
        >
          {summary.score}
        </motion.p>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {summary.correctAnswers}/{summary.totalQuestions}
            </p>
            <p className="text-[11px] text-muted">Correct</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{accuracy}%</p>
            <p className="text-[11px] text-muted">Accuracy</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {Math.round(summary.durationMs / 1000)}s
            </p>
            <p className="text-[11px] text-muted">Time</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => void start(summary.difficulty)}
          className="rounded-2xl bg-accent py-4 text-[15px] font-semibold text-accent-foreground shadow-lg shadow-accent/25"
        >
          Play again
        </button>
        <button type="button" onClick={reset} className="glass rounded-2xl py-3.5 text-[15px]">
          Change difficulty
        </button>
      </div>
    </main>
  );
}
