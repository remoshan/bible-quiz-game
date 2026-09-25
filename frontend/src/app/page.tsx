"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GameScreen } from "@/components/GameScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThemeControl } from "@/components/ThemeControl";
import { useGameStore } from "@/store/useGameStore";

const LeaderboardScreen = dynamic(
  () => import("@/components/LeaderboardScreen").then((m) => m.LeaderboardScreen),
  { ssr: false }
);

const AuthScreen = dynamic(() => import("@/components/AuthScreen").then((m) => m.AuthScreen), {
  ssr: false,
});

type Overlay = "leaderboard" | "signin" | null;

export default function Page() {
  const status = useGameStore((s) => s.status);
  const [overlay, setOverlay] = useState<Overlay>(null);

  const close = () => setOverlay(null);

  return (
    <>
      <ThemeControl />

      {overlay === "leaderboard" ? (
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
