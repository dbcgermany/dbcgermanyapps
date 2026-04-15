"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeThemeCookie(theme: Theme) {
  if (typeof document === "undefined") return;
  document.cookie = `dbc-theme=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readThemeCookie(): Theme | null {
  if (typeof document === "undefined") return null;
  const match = /(?:^|; )dbc-theme=([^;]*)/.exec(document.cookie);
  const v = match?.[1];
  return v === "light" || v === "dark" || v === "system" ? v : null;
}

export function ThemeProvider({
  children,
  initialTheme,
  defaultTheme = "system",
  storageKey = "dbc-theme",
}: {
  children: React.ReactNode;
  /** Server-computed initial theme from the user's persisted preference. */
  initialTheme?: Theme;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    initialTheme === "dark" ? "dark" : "light"
  );

  // After hydration, reconcile with localStorage + cookie fallback.
  useEffect(() => {
    if (initialTheme) return; // server-provided wins
    const fromStorage = localStorage.getItem(storageKey) as Theme | null;
    const fromCookie = readThemeCookie();
    const chosen = fromStorage ?? fromCookie;
    if (chosen) setThemeState(chosen);
  }, [initialTheme, storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);

      root.classList.toggle("dark", isDark);
      root.dataset.theme = isDark ? "dark" : "light";
      setResolvedTheme(isDark ? "dark" : "light");
    }

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      /* Safari private mode */
    }
    writeThemeCookie(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Tiny inline script that runs before React hydration to set the theme class
 * on <html>. Prevents flash-of-wrong-theme. Inline this in the <head> of the
 * root layout via dangerouslySetInnerHTML. Reads from cookie first (because
 * cookies are visible in the initial server-rendered HTML pipeline), then
 * localStorage, then the prefers-color-scheme media query.
 */
export const NO_FLASH_THEME_SCRIPT = `
(function() {
  try {
    var m = document.cookie.match(/(?:^|; )dbc-theme=([^;]*)/);
    var cookie = m ? m[1] : null;
    var ls = null;
    try { ls = localStorage.getItem('dbc-theme'); } catch(_) {}
    var v = cookie || ls;
    var isDark;
    if (v === 'dark') isDark = true;
    else if (v === 'light') isDark = false;
    else isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var root = document.documentElement;
    if (isDark) root.classList.add('dark');
    root.dataset.theme = isDark ? 'dark' : 'light';
  } catch(_) {}
})();
`;
