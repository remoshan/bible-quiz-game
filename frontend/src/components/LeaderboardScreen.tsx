"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BackIcon, LaurelIcon } from "@/components/icons";
import { onScoreSaved } from "@/lib/realtime";
import { useGameStore } from "@/store/useGameStore";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";

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

  const difficulty = useLeaderboardStore((s) => s.difficulty);
  const entries = useLeaderboardStore((s) => s.entries);
  const you = useLeaderboardStore((s) => s.you);
  const error = useLeaderboardStore((s) => s.error);
  const live = useLeaderboardStore((s) => s.live);
  const highlighted = useLeaderboardStore((s) => s.highlighted);
  const setDifficulty = useLeaderboardStore((s) => s.setDifficulty);
  const load = useLeaderboardStore((s) => s.load);

  useEffect(() => {
    void load(false);
  }, [difficulty, load]);

  useEffect(
    () =>
      onScoreSaved((changed) => {
        if (changed === difficulty) void load(true);
      }),
    [difficulty, load]
  );

  const inTopList = you !== null && entries !== null && entries.some((e) => e.userId === you.userId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 sm:max-w-lg">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex h-8 w-8 items-center justify-center text-faint transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Leaderboard</h1>
      </header>

      <div className="mt-6 flex">
        {difficulties.map((setting) => {
          const isActive = setting.key === difficulty;

          return (
            <button
              key={setting.key}
              type="button"
              onClick={() => setDifficulty(setting.key)}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
              style={
                isActive
                  ? { color: "var(--foreground)", boxShadow: "inset 0 -2px 0 0 var(--accent)" }
                  : { color: "var(--faint)", boxShadow: "inset 0 -1px 0 0 var(--rule)" }
              }
            >
              {setting.label}
            </button>
          );
        })}
      </div>

      <p className="label mt-5">Each player&rsquo;s best round</p>

      <div className="mt-3 flex flex-1 flex-col">
        {error ? <p className="border border-rule p-4 text-xs text-wrong">{error}</p> : null}

        {!entries && !error ? <p className="label mt-10">Loading</p> : null}

        {entries?.length === 0 ? (
          <div className="mt-12 flex flex-col items-start gap-4">
            <LaurelIcon className="h-8 w-8 text-faint" />
            <p className="font-serif text-xl text-muted">No scores here yet. Be the first.</p>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
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
              isNew={highlighted.includes(entry.id)}
              delay={live ? 0 : Math.min(position * 0.03, 0.3)}
            />
          ))}
        </AnimatePresence>

        {you && !inTopList ? (
          <div className="rule-t mt-4 pt-4">
            <Row
              position={you.rank}
              name={you.displayName}
              score={you.score}
              correct={you.correctAnswers}
              total={you.totalQuestions}
              createdAt={you.createdAt}
              isYou
              isNew={false}
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
  isNew,
  delay,
}: {
  position: number;
  name: string;
  score: number;
  correct: number;
  total: number;
  createdAt: string;
  isYou: boolean;
  isNew: boolean;
  delay: number;
}) {
  const accent = isNew || isYou;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay, layout: { type: "spring", stiffness: 420, damping: 38 } }}
      className="rule-t flex items-center gap-4 py-3.5 pl-3 pr-1 transition-colors duration-700 last:rule-b"
      style={
        accent
          ? {
              background: "var(--accent-tint)",
              boxShadow: `inset ${isYou ? 2 : 3}px 0 0 0 var(--accent)`,
            }
          : undefined
      }
    >
      <span
        className="w-7 shrink-0 font-serif text-lg tabular-nums"
        style={{ color: position <= 3 ? "var(--gold)" : "var(--faint)" }}
      >
        {position}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-xl font-semibold leading-tight">
          {name}
          {isYou ? (
            <span className="ml-2 text-2xs font-sans font-medium uppercase tracking-[0.14em] text-accent">
              you
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-2xs text-faint">
          {correct}/{total} correct &middot; {timeAgo(createdAt)}
        </span>
      </span>

      <span className="shrink-0 font-serif text-xl font-semibold tabular-nums text-accent">
        {score}
      </span>
    </motion.div>
  );
}
