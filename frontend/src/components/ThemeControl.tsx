"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

const OPTIONS = [
  { value: "system", label: "Match system", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, onClient, onServer);
  const active = mounted ? (theme ?? "system") : null;

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="fixed right-4 top-4 z-50 flex items-center gap-px border border-rule bg-background p-px"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = active === value;

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
            className="flex h-7 w-7 items-center justify-center transition-colors"
            style={
              isActive
                ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                : { color: "var(--faint)" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
