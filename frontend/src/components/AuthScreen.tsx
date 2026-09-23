"use client";

import { AuthPanel } from "@/components/AuthPanel";
import { BackIcon, OrnamentIcon } from "@/components/icons";

export function AuthScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 sm:max-w-lg">
      <header className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex h-8 w-8 items-center justify-center text-faint transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <BackIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="label">Your account</p>

        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
          Save your scores
        </h1>

        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
          An account keeps your best round at each difficulty on the leaderboard. Everything else
          stays open to guests.
        </p>

        <OrnamentIcon className="my-8 h-4 w-32 text-faint" />

        <AuthPanel onSuccess={onBack} />
      </div>
    </main>
  );
}
