"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="glass relative flex h-9 w-16 shrink-0 items-center rounded-full p-1"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow transition-transform duration-300 ease-out dark:translate-x-7 dark:bg-black/70">
        <span className="dark:hidden">☀️</span>
        <span className="hidden dark:inline">🌙</span>
      </span>
    </button>
  );
}
