"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { busy, error, notice, signIn, signUp, clearMessages } = useAuthStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const isSignUp = mode === "signup";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const ok = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);

    if (ok) onSuccess?.();
  };

  const swap = () => {
    clearMessages();
    setMode(isSignUp ? "signin" : "signup");
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="glass flex flex-col gap-2.5 rounded-2xl p-4"
    >
      {isSignUp ? (
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          autoComplete="nickname"
          maxLength={32}
          required
          className="hairline rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
        />
      ) : null}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        required
        className="hairline rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={isSignUp ? "Password (8+ characters)" : "Password"}
        autoComplete={isSignUp ? "new-password" : "current-password"}
        required
        className="hairline rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-faint focus:border-accent"
      />

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-accent py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-foreground transition-opacity disabled:opacity-60"
      >
        {busy ? "Working…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
      {notice ? <p className="text-center text-xs text-accent">{notice}</p> : null}

      <button type="button" onClick={swap} className="py-1 text-center text-xs text-muted">
        {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </motion.form>
  );
}
