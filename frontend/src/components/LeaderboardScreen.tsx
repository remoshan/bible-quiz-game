"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

const MEDALS = ["🥇", "🥈", "🥉"];

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

      <p className="mt-3 text-center text-[11px] text-muted">Each player&rsquo;s best round</p>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        {error ? (
          <p className="glass rounded-2xl p-4 text-center text-xs text-wrong">{error}</p>
        ) : null}

        {!entries && !error ? <p className="mt-8 text-center text-xs text-muted">Loading…</p> : null}

        {entries?.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-6 text-center text-[13px] text-muted">
            No scores here yet. Be the first.
          </p>
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
      <span className="w-7 shrink-0 text-center text-[13px] font-semibold tabular-nums text-muted">
        {MEDALS[position - 1] ?? position}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium">
          {name}
          {isYou ? <span className="ml-1.5 text-[11px] font-normal text-accent">you</span> : null}
        </span>
        <span className="block text-[11px] text-muted">
          {correct}/{total} correct · {timeAgo(createdAt)}
        </span>
      </span>

      <span className="shrink-0 text-[15px] font-semibold tabular-nums text-accent">{score}</span>
    </motion.div>
  );
}
