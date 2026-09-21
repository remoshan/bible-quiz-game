"use client";

import { useState } from "react";
import { GameScreen } from "@/components/GameScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { LeaderboardScreen } from "@/components/LeaderboardScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useGameStore } from "@/store/useGameStore";

export default function Page() {
  const status = useGameStore((s) => s.status);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (showLeaderboard) {
    return <LeaderboardScreen onBack={() => setShowLeaderboard(false)} />;
  }

  if (status === "playing") return <GameScreen />;

  if (status === "game_over") {
    return <ResultsScreen onOpenLeaderboard={() => setShowLeaderboard(true)} />;
  }

  return <HomeScreen onOpenLeaderboard={() => setShowLeaderboard(true)} />;
}
