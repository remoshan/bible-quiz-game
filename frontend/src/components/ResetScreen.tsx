"use client";

import { useState } from "react";
import { AccountLayout } from "@/components/AccountLayout";
import { useAuthStore } from "@/store/useAuthStore";

export function ResetScreen({ onDone }: { onDone: () => void }) {
  const { busy, error, recovery, resetPassword, endRecovery } = useAuthStore();
  const [password, setPassword] = useState("");

  const leave = () => {
    endRecovery();
    onDone();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await resetPassword(password)) onDone();
  };

  if (!recovery?.token) {
    return (
      <AccountLayout onBack={leave} title="This link has expired">
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
          Email links work once and only for a short while. Request a new one from the sign-in
          screen.
        </p>

        <button type="button" onClick={leave} className="button-primary mt-8">
          Back to sign in
        </button>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout onBack={leave} title="Choose a new password">
      <form onSubmit={submit} className="rise mt-8 flex flex-col gap-2.5">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (8+ characters)"
          aria-label="New password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field"
        />

        <button type="submit" disabled={busy} className="button-primary">
          {busy ? "Working…" : "Set password"}
        </button>

        {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
      </form>
    </AccountLayout>
  );
}
