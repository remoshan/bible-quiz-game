"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="glass relative flex h-9 w-16 items-center rounded-full p-1"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow dark:bg-black/70"
        style={{ marginLeft: isDark ? "1.75rem" : 0 }}
      >
        {mounted ? (isDark ? "🌙" : "☀️") : ""}
      </motion.span>
    </button>
  );
}
