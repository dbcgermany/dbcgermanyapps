// SSOT for brand asset paths used in every app's header, footer, and
// auth chrome. The asset files themselves live in each consumer app's
// /public/brand folder (Next.js can't serve files out of a workspace
// package's public folder). These constants give consumers a stable
// src= string plus the canonical wordmark label for aria/SEO.

export const BRAND = {
  /** Wide DBC wordmark with the gold swoosh. Used as the visible
   *  header + footer brand mark. WebP (1200×376 @92%) — rendered from
   *  icons/dbc-logo-red-gold-vector.svg so next/image can serve it
   *  through its standard raster pipeline (next/image silently
   *  refuses to optimise SVGs by default).
   *
   *  Pure path — no query string. next/image's optimizer rejects
   *  any `url` param that contains characters outside a plain
   *  pathname (returns 400 INVALID_IMAGE_OPTIMIZE_REQUEST). If the
   *  wordmark ever changes, rename the file (e.g. dbc-logo-v2.webp)
   *  to bust cache safely. */
  logoSrc: "/brand/dbc-logo.webp",
  /** Square D-mark. Used for app icons and in-page contexts where
   *  the wordmark would be too wide. */
  iconSrc: "/brand/dbc-icon.svg",
  /** Canonical brand name. Pass as aria-label / alt so SEO and
   *  screen readers still see "DBC Germany" even when the visible
   *  text is just "Germany" next to the wordmark. */
  wordmarkAlt: "DBC Germany",
} as const;

/**
 * SSOT-approved hex literals for inline-style contexts that cannot use
 * CSS variables: PDF generators (`@react-pdf/renderer` runs in a Node
 * context with no DOM), chart libraries that demand string colours,
 * and the catastrophic-error <html><body> fallback rendered before
 * stylesheets finish loading.
 *
 * Source: `packages/ui/tokens/base.css` (the declared `--dbc-color-*`
 * variables). Keep both files in sync — when you change a token in
 * base.css, mirror the change here.
 *
 * Components that DO have access to CSS variables MUST use the Tailwind
 * semantic classes (`bg-success-soft`, `text-danger`, `border-warning-border`)
 * declared in `packages/ui/tokens/tailwind-theme.css` instead of these.
 */
export const BRAND_HEX = {
  red: "#c8102e",
  redHover: "#a00d24",
  gold: "#d4a017",
  goldHover: "#b88a12",
  ink: "#111111",
  inkSecondary: "#525252",
  inkMuted: "#737373",
  inkSubtle: "#a3a3a3",
  paper: "#ffffff",
  paperSoft: "#fafafa",
  paperMid: "#f5f5f5",
  /** Dark-theme equivalent of `paper` — used in PWA manifests + meta
   *  theme-color tags so dark-mode browsers chrome the address bar
   *  consistently with the rendered page. Mirrors the dark-theme
   *  `--dbc-color-bg` in `tokens/base.css`. */
  paperDark: "#0a0a0a",
  border: "#e5e5e5",
  borderSubtle: "#f0f0f0",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  info: "#2563eb",
} as const;
