"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HomeScreen } from "@/components/HomeScreen";
import { ThemeControl } from "@/components/ThemeControl";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";

const loadGame = () => import("@/components/GameScreen").then((m) => m.GameScreen);
const loadResults = () => import("@/components/ResultsScreen").then((m) => m.ResultsScreen);

const GameScreen = dynamic(loadGame, { ssr: false });
const ResultsScreen = dynamic(loadResults, { ssr: false });

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

const AccountScreen = dynamic(
  () => import("@/components/AccountScreen").then((m) => m.AccountScreen),
  { ssr: false }
);

type Overlay = "leaderboard" | "signin" | "account" | null;

export default function Page() {
  const status = useGameStore((s) => s.status);
  const recovery = useAuthStore((s) => s.recovery);
  const signedIn = useAuthStore((s) => s.session !== null);
  const checkRecoveryLink = useAuthStore((s) => s.checkRecoveryLink);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    checkRecoveryLink();
    void loadGame();
    void loadResults();
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
      ) : overlay === "account" && signedIn ? (
        <AccountScreen onBack={close} />
      ) : status === "playing" ? (
        <GameScreen />
      ) : status === "game_over" ? (
        <ResultsScreen onOpenLeaderboard={() => setOverlay("leaderboard")} />
      ) : (
        <HomeScreen
          onOpenLeaderboard={() => setOverlay("leaderboard")}
          onOpenSignIn={() => setOverlay("signin")}
          onOpenAccount={() => setOverlay("account")}
        />
      )}
    </>
  );
}
