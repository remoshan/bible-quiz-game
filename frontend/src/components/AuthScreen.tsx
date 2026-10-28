"use client";

import { AccountLayout } from "@/components/AccountLayout";
import { AuthPanel } from "@/components/AuthPanel";
import { OrnamentIcon } from "@/components/icons";

export function AuthScreen({ onBack }: { onBack: () => void }) {
  return (
    <AccountLayout onBack={onBack} title="Save your scores">
      <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
        An account keeps your best round at each difficulty on the leaderboard. Everything else
        stays open to guests.
      </p>

      <OrnamentIcon className="my-8 h-4 w-32 text-faint" />

      <AuthPanel onSuccess={onBack} />
    </AccountLayout>
  );
}
