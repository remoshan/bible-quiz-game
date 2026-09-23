"use client";

import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { GameScreen } from "@/components/GameScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { LeaderboardScreen } from "@/components/LeaderboardScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThemeControl } from "@/components/ThemeControl";
import { useGameStore } from "@/store/useGameStore";

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
