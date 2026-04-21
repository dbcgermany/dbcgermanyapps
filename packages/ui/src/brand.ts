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
