"use client";

import { useState } from "react";
import { BackIcon } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";

export function AccountScreen({ onBack }: { onBack: () => void }) {
  const { session, busy, error, notice, rename, clearMessages } = useAuthStore();
  const [displayName, setDisplayName] = useState(session?.user.displayName ?? "");

  const leave = () => {
    clearMessages();
    onBack();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await rename(displayName);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 sm:max-w-lg">
      <header className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={leave}
          className="-ml-1 flex h-8 w-8 items-center justify-center text-faint transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <BackIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="label">Your account</p>

        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
          {session?.user.displayName}
        </h1>

        <form onSubmit={submit} className="rise mt-8 flex flex-col gap-2.5">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            aria-label="Display name"
            autoComplete="nickname"
            maxLength={32}
            required
            className="border border-rule bg-transparent px-3.5 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
          />

          <button
            type="submit"
            disabled={busy || displayName.trim() === session?.user.displayName}
            className="bg-accent py-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-opacity disabled:opacity-60"
          >
            {busy ? "Working…" : "Change display name"}
          </button>

          {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
          {notice ? <p className="text-center text-xs text-accent">{notice}</p> : null}
        </form>
      </div>
    </main>
  );
}
