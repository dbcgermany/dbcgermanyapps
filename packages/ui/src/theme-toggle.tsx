"use client";

import { useTheme } from "./theme-provider";

type Labels = { light: string; dark: string; system: string };

const ICONS = {
  light: "\u263C", // ☼ sun
  dark: "\u263E", // ☾ moon
  system: "\u25D1", // ◑ half-circle
} as const;

export function ThemeToggle({
  labels = { light: "Light", dark: "Dark", system: "System" },
  className = "",
}: {
  labels?: Labels;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const modes: Array<keyof Labels> = ["light", "dark", "system"];

  return (
    <div
      role="group"
      aria-label={labels.system}
      className={`flex items-center gap-1 rounded-full border border-border px-1 py-0.5 text-xs font-medium ${className}`}
    >
      {modes.map((m) => {
        const active = theme === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setTheme(m)}
            aria-label={labels[m]}
            aria-pressed={active}
            title={labels[m]}
            className={`flex h-6 w-7 items-center justify-center rounded-full transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span aria-hidden>{ICONS[m]}</span>
          </button>
        );
      })}
    </div>
  );
}
