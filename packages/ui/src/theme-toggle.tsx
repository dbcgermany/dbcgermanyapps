"use client";

import { useTheme } from "./theme-provider";

type Labels = { light: string; dark: string; system: string };

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function ThemeToggle({
  labels = { light: "Light", dark: "Dark", system: "System" },
  className = "",
}: {
  labels?: Labels;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();

  const modes: Array<{ key: keyof Labels; icon: React.ReactNode }> = [
    { key: "light", icon: <SunIcon /> },
    { key: "system", icon: <MonitorIcon /> },
    { key: "dark", icon: <MoonIcon /> },
  ];

  return (
    <div
      role="group"
      aria-label={labels.system}
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-background/60 p-1 ${className}`}
    >
      {modes.map((m) => {
        const active = theme === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => setTheme(m.key)}
            aria-label={labels[m.key]}
            aria-pressed={active}
            title={labels[m.key]}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {m.icon}
          </button>
        );
      })}
    </div>
  );
}
