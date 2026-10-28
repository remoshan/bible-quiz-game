"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
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
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (session) void saveScore();
  }, [session, saveScore]);

  if (!summary) return null;

  const label = difficulties.find((d) => d.key === summary.difficulty)?.label ?? summary.difficulty;

  const share = async () => {
    const text = `I scored ${summary.score} on Verse, a Catholic Bible quiz (${label}, ${summary.correctAnswers}/${summary.totalQuestions} correct). Can you beat it?`;
    const url = window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Verse", text, url });
        return;
      }

      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNote("Copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareNote("Could not share");
    }

    setTimeout(() => setShareNote(null), 2000);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-8 sm:max-w-lg">
      <m.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="text-left"
      >
        <p className="label">{label} round complete</p>

        <m.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.12 }}
          className="mt-4 font-serif text-5xl font-semibold leading-none tracking-tight tabular-nums text-accent"
        >
          {summary.score}
        </m.p>

        <div className="rule-t mt-8 grid grid-cols-3 pt-5">
          <div>
            <p className="font-serif text-2xl font-semibold tabular-nums">
              {summary.correctAnswers}/{summary.totalQuestions}
            </p>
            <p className="label mt-1">Correct</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold tabular-nums">{summary.accuracy}%</p>
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
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rule-t mt-6 pt-4 text-sm font-semibold text-correct"
          >
            Saved to the leaderboard{rank ? ` · rank #${rank}` : ""}
          </m.p>
        ) : null}

        {saveState === "saving" ? (
          <p className="rule-t mt-6 pt-4 text-sm text-muted">Saving your score…</p>
        ) : null}

        {saveState === "failed" ? (
          <p className="rule-t mt-6 pt-4 text-sm text-wrong">{saveError}</p>
        ) : null}
      </m.div>

      {summary.review.length > 0 ? (
        <details className="rule-t pt-4">
          <summary className="label cursor-pointer">
            Review {summary.review.length} missed {summary.review.length === 1 ? "question" : "questions"}
          </summary>

          <ul className="mt-2">
            {summary.review.map((item) => (
              <li key={item.id} className="rule-t py-4 first:border-t-0">
                <p className="font-serif text-base leading-snug">{item.verse}</p>
                <p className="mt-2 text-xs text-wrong">
                  {item.picked === null ? "No answer in time" : `You chose ${item.picked}`}
                </p>
                <p className="mt-1 text-xs text-correct">
                  Answer: <span className="font-semibold">{item.answer}</span>
                </p>
                <p className="mt-1 text-2xs text-faint">{item.reference} · {item.translation}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

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
          onClick={() => void share()}
          aria-live="polite"
          className="border border-rule px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em]"
        >
          {shareNote ?? "Share result"}
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
