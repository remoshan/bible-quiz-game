"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { request } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore, type Difficulty } from "@/store/useGameStore";

type Entry = {
  id: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  displayName: string;
};

type Loaded = { difficulty: Difficulty; entries: Entry[]; error: string | null };

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const difficulties = useGameStore((s) => s.difficulties);
  const displayName = useAuthStore((s) => s.session?.user.displayName ?? null);

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let active = true;

    request(`/api/leaderboard?difficulty=${difficulty}&limit=20`)
      .then((body) => {
        if (active) setLoaded({ difficulty, entries: body.entries, error: null });
      })
      .catch(() => {
        if (active) {
          setLoaded({ difficulty, entries: [], error: "Could not load the leaderboard." });
        }
      });

    return () => {
      active = false;
    };
  }, [difficulty]);

  const current = loaded?.difficulty === difficulty ? loaded : null;
  const entries = current?.entries ?? null;
  const error = current?.error ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-7 pt-5">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-sm"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-[15px] font-semibold tracking-tight">Leaderboard</h1>
        <span className="h-9 w-9" />
      </header>

      <div className="mt-5 flex gap-2">
        {difficulties.map((setting) => {
          const isActive = setting.key === difficulty;

          return (
            <button
              key={setting.key}
              type="button"
              onClick={() => setDifficulty(setting.key)}
              className="glass flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-shadow"
              style={isActive ? { boxShadow: "0 0 0 2px var(--accent)" } : undefined}
            >
              {setting.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        {error ? <p className="glass rounded-2xl p-4 text-center text-xs text-wrong">{error}</p> : null}

        {!entries && !error ? <p className="mt-8 text-center text-xs text-muted">Loading…</p> : null}

        {entries?.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-6 text-center text-[13px] text-muted">
            No scores here yet. Be the first.
          </p>
        ) : null}

        {entries?.map((entry, position) => {
          const isYou = displayName !== null && entry.displayName === displayName;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(position * 0.03, 0.3) }}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
              style={isYou ? { boxShadow: "0 0 0 2px var(--accent)" } : undefined}
            >
              <span className="w-7 shrink-0 text-center text-[13px] font-semibold tabular-nums text-muted">
                {MEDALS[position] ?? position + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{entry.displayName}</span>
                <span className="block text-[11px] text-muted">
                  {entry.correctAnswers}/{entry.totalQuestions} correct ·{" "}
                  {Math.round(entry.durationMs / 1000)}s
                </span>
              </span>

              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-accent">
                {entry.score}
              </span>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
