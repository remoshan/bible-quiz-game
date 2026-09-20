"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGameStore, type Difficulty } from "@/store/useGameStore";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
};

export function HomeScreen() {
  const status = useGameStore((s) => s.status);
  const error = useGameStore((s) => s.error);
  const start = useGameStore((s) => s.start);
  const difficulties = useGameStore((s) => s.difficulties);
  const loadDifficulties = useGameStore((s) => s.loadDifficulties);

  const [choice, setChoice] = useState<Difficulty | null>(null);
  const [showAuthHint, setShowAuthHint] = useState(false);

  useEffect(() => {
    void loadDifficulties();
  }, [loadDifficulties]);

  const isLoading = status === "loading";
  const active = choice ?? difficulties[0]?.key ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-7 pt-5">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1 text-[11px] font-medium tracking-wide text-muted backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <span className="h-1.5 w-1.5 rounded-full bg-warm" />
          NIV · Catholic Bible Quiz
        </span>
        <ThemeToggle />
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-1 flex-col justify-center gap-7 py-8"
      >
        <div>
          <motion.h1
            variants={item}
            className="bg-gradient-to-br from-accent to-accent-soft bg-clip-text text-7xl font-semibold leading-none tracking-tighter text-transparent"
          >
            Verse
          </motion.h1>
          <motion.p variants={item} className="mt-3 text-[15px] leading-relaxed text-muted">
            How well do you really know Scripture? Beat the clock across three rounds of
            increasingly obscure verses.
          </motion.p>
        </div>

        <div className="flex min-h-[13.5rem] flex-col gap-2.5">
          {difficulties.map((setting, position) => {
            const isActive = setting.key === active;

            return (
              <motion.button
                key={setting.key}
                type="button"
                variants={item}
                whileTap={{ scale: 0.985 }}
                onClick={() => setChoice(setting.key)}
                aria-pressed={isActive}
                className="glass flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-shadow"
                style={isActive ? { boxShadow: "0 0 0 2px var(--accent)" } : undefined}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={{ borderColor: isActive ? "var(--accent)" : "var(--muted)" }}
                >
                  {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                </span>

                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">{setting.label}</span>
                  <span className="block text-xs text-muted">
                    {setting.questions} questions · {setting.seconds}s each
                  </span>
                </span>

                <span className="flex gap-1" aria-hidden>
                  {difficulties.map((level, i) => (
                    <span
                      key={level.key}
                      className="h-4 w-1 rounded-full"
                      style={{
                        background: i <= position ? "var(--accent)" : "var(--muted)",
                        opacity: i <= position ? 1 : 0.25,
                      }}
                    />
                  ))}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            variants={item}
            type="button"
            whileTap={{ scale: 0.985 }}
            disabled={isLoading || !active}
            onClick={() => active && start(active)}
            className="rounded-2xl bg-accent py-4 text-[15px] font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-opacity disabled:opacity-60"
          >
            {isLoading ? "Gathering verses…" : "Play Now"}
          </motion.button>

          <motion.button
            variants={item}
            type="button"
            onClick={() => setShowAuthHint(true)}
            className="py-1 text-[13px] text-muted underline decoration-muted/40 underline-offset-4"
          >
            Sign in to save your scores
          </motion.button>

          {showAuthHint ? (
            <p className="text-center text-xs text-muted">
              Accounts land in the final step. Guest scores work right now.
            </p>
          ) : null}

          {error ? (
            <p className="glass rounded-2xl px-4 py-3 text-center text-xs text-wrong">{error}</p>
          ) : null}
        </div>
      </motion.div>

      <footer className="text-center text-[11px] text-muted">
        Scripture quoted from the New International Version
      </footer>
    </main>
  );
}
