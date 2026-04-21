"use client";

import { useTheme } from "./theme-provider";

type Labels = { light: string; dark: string };

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

/**
 * Binary light/dark toggle. "system" stays the implicit default when no user
 * preference is set, but is never exposed as an option.
 */
export function ThemeToggle({
  labels = { light: "Light", dark: "Dark" },
  className = "",
}: {
  labels?: Labels;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();

  // Treat the effective binary state: if theme is "system" (or unset), we
  // still need a visual state — resolve to "dark" when the document has the
  // dark class, otherwise "light".
  const resolved: "light" | "dark" =
    theme === "dark"
      ? "dark"
      : theme === "light"
        ? "light"
        : typeof document !== "undefined" &&
            document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";

  const next = resolved === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={resolved === "dark" ? labels.light : labels.dark}
      title={resolved === "dark" ? labels.light : labels.dark}
      className={`inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
