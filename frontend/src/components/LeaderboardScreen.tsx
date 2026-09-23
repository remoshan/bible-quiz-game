"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackIcon, LaurelIcon } from "@/components/icons";
import { request } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore, type Difficulty } from "@/store/useGameStore";

type Entry = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  createdAt: string;
};

type Standing = Omit<Entry, "id"> & { rank: number };

type Loaded = {
  difficulty: Difficulty;
  entries: Entry[];
  you: Standing | null;
  error: string | null;
};

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const difficulties = useGameStore((s) => s.difficulties);
  const session = useAuthStore((s) => s.session);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = session ? await accessToken() : null;

      try {
        const body = await request(`/api/leaderboard?difficulty=${difficulty}&limit=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (active) {
          setLoaded({ difficulty, entries: body.entries, you: body.you, error: null });
        }
      } catch {
        if (active) {
          setLoaded({
            difficulty,
            entries: [],
            you: null,
            error: "Could not load the leaderboard.",
          });
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [difficulty, session, accessToken]);

  const current = loaded?.difficulty === difficulty ? loaded : null;
  const entries = current?.entries ?? null;
  const you = current?.you ?? null;
  const error = current?.error ?? null;

  const inTopList = you !== null && entries !== null && entries.some((e) => e.userId === you.userId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-7 pt-4 sm:max-w-lg">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <h1 className="font-serif text-lg font-semibold tracking-tight">Leaderboard</h1>
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
              className={
                isActive
                  ? "glass-raised flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-[0.1em]"
                  : "hairline flex-1 rounded-xl bg-transparent py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted"
              }
              style={isActive ? { borderColor: "var(--accent)" } : undefined}
            >
              {setting.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-2xs uppercase tracking-[0.16em] text-faint">
        Each player&rsquo;s best round
      </p>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        {error ? (
          <p className="glass rounded-2xl p-4 text-center text-xs text-wrong">{error}</p>
        ) : null}

        {!entries && !error ? (
          <p className="mt-8 text-center text-2xs uppercase tracking-[0.16em] text-faint">Loading</p>
        ) : null}

        {entries?.length === 0 ? (
          <div className="glass mt-8 flex flex-col items-center gap-3 rounded-2xl p-8 text-center">
            <LaurelIcon className="h-7 w-7 text-faint" />
            <p className="text-sm text-muted">No scores here yet. Be the first.</p>
          </div>
        ) : null}

        {entries?.map((entry, position) => (
          <Row
            key={entry.id}
            position={position + 1}
            name={entry.displayName}
            score={entry.score}
            correct={entry.correctAnswers}
            total={entry.totalQuestions}
            createdAt={entry.createdAt}
            isYou={you !== null && entry.userId === you.userId}
            delay={Math.min(position * 0.03, 0.3)}
          />
        ))}

        {you && !inTopList ? (
          <div className="mt-2 border-t border-white/10 pt-3">
            <Row
              position={you.rank}
              name={you.displayName}
              score={you.score}
              correct={you.correctAnswers}
              total={you.totalQuestions}
              createdAt={you.createdAt}
              isYou
              delay={0}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Row({
  position,
  name,
  score,
  correct,
  total,
  createdAt,
  isYou,
  delay,
}: {
  position: number;
  name: string;
  score: number;
  correct: number;
  total: number;
  createdAt: string;
  isYou: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
      style={isYou ? { boxShadow: "0 0 0 2px var(--accent)" } : undefined}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        style={
          position <= 3
            ? { color: "var(--gold)", border: "1px solid var(--gold)" }
            : { color: "var(--faint)", border: "1px solid var(--border)" }
        }
      >
        {position}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-base font-semibold">
          {name}
          {isYou ? (
            <span className="ml-2 text-2xs font-sans font-medium uppercase tracking-[0.14em] text-accent">
              you
            </span>
          ) : null}
        </span>
        <span className="block text-2xs text-faint">
          {correct}/{total} correct · {timeAgo(createdAt)}
        </span>
      </span>

      <span className="shrink-0 font-serif text-lg font-semibold tabular-nums text-accent">
        {score}
      </span>
    </motion.div>
  );
}
