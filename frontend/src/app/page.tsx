"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GameScreen } from "@/components/GameScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThemeControl } from "@/components/ThemeControl";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";

const LeaderboardScreen = dynamic(
  () => import("@/components/LeaderboardScreen").then((m) => m.LeaderboardScreen),
  { ssr: false }
);

const AuthScreen = dynamic(() => import("@/components/AuthScreen").then((m) => m.AuthScreen), {
  ssr: false,
});

const ResetScreen = dynamic(() => import("@/components/ResetScreen").then((m) => m.ResetScreen), {
  ssr: false,
});

type Overlay = "leaderboard" | "signin" | null;

export default function Page() {
  const status = useGameStore((s) => s.status);
  const recovery = useAuthStore((s) => s.recovery);
  const checkRecoveryLink = useAuthStore((s) => s.checkRecoveryLink);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    checkRecoveryLink();
  }, [checkRecoveryLink]);

  const close = () => setOverlay(null);

  return (
    <>
      <ThemeControl />

      {recovery ? (
        <ResetScreen onDone={() => setOverlay("signin")} />
      ) : overlay === "leaderboard" ? (
        <LeaderboardScreen onBack={close} />
      ) : overlay === "signin" ? (
        <AuthScreen onBack={close} />
      ) : status === "playing" ? (
        <GameScreen />
      ) : status === "game_over" ? (
        <ResultsScreen onOpenLeaderboard={() => setOverlay("leaderboard")} />
      ) : (
        <HomeScreen
          onOpenLeaderboard={() => setOverlay("leaderboard")}
          onOpenSignIn={() => setOverlay("signin")}
        />
      )}
    </>
  );
}
