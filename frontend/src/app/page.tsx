"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GameScreen } from "@/components/GameScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useGameStore } from "@/store/useGameStore";

export default function Page() {
  const status = useGameStore((s) => s.status);
  const screen = status === "playing" ? "game" : status === "game_over" ? "results" : "home";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        {screen === "game" ? <GameScreen /> : null}
        {screen === "results" ? <ResultsScreen /> : null}
        {screen === "home" ? <HomeScreen /> : null}
      </motion.div>
    </AnimatePresence>
  );
}
