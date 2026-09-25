"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AuthPanel } from "@/components/AuthPanel";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";

export function ResultsScreen({ onOpenLeaderboard }: { onOpenLeaderboard: () => void }) {
  const summary = useGameStore((s) => s.summary);
  const difficulties = useGameStore((s) => s.difficulties);
  const reset = useGameStore((s) => s.reset);
  const start = useGameStore((s) => s.start);

  const saveState = useGameStore((s) => s.saveState);
  const rank = useGameStore((s) => s.rank);
  const saveError = useGameStore((s) => s.saveError);
  const saveScore = useGameStore((s) => s.saveScore);

  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (session) void saveScore();
  }, [session, saveScore]);

  if (!summary) return null;

  const label = difficulties.find((d) => d.key === summary.difficulty)?.label ?? summary.difficulty;
  const accuracy = Math.round((summary.correctAnswers / summary.totalQuestions) * 100);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-8 sm:max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="text-left"
      >
        <p className="label">{label} round complete</p>

        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.12 }}
          className="mt-4 font-serif text-5xl font-semibold leading-none tracking-tight tabular-nums text-accent"
        >
          {summary.score}
        </motion.p>

        <div className="rule-t mt-8 grid grid-cols-3 pt-5">
          <div>
            <p className="font-serif text-2xl font-semibold tabular-nums">
              {summary.correctAnswers}/{summary.totalQuestions}
            </p>
            <p className="label mt-1">Correct</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold tabular-nums">{accuracy}%</p>
            <p className="label mt-1">Accuracy</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold tabular-nums">
              {Math.round(summary.durationMs / 1000)}s
            </p>
            <p className="label mt-1">Time</p>
          </div>
        </div>

        {saveState === "saved" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rule-t mt-6 pt-4 text-sm font-semibold text-correct"
          >
            Saved to the leaderboard{rank ? ` · rank #${rank}` : ""}
          </motion.p>
        ) : null}

        {saveState === "saving" ? (
          <p className="rule-t mt-6 pt-4 text-sm text-muted">Saving your score…</p>
        ) : null}

        {saveState === "failed" ? (
          <p className="rule-t mt-6 pt-4 text-sm text-wrong">{saveError}</p>
        ) : null}
      </motion.div>

      {!session ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">Sign in to save this score to the leaderboard.</p>
          <AuthPanel />
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => void start(summary.difficulty)}
          className="bg-accent px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="border border-rule px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em]"
        >
          View leaderboard
        </button>
        <button type="button" onClick={reset} className="py-1 text-xs text-muted underline decoration-[var(--rule-strong)] underline-offset-4">
          Change difficulty
        </button>
      </div>
    </main>
  );
}
