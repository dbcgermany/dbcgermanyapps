/**
 * Format an ISO timestamp as a short relative time ("just now", "3m ago",
 * "2h ago", "5d ago") falling back to a localized "Mon DD" for older dates.
 *
 * SSOT — shared by:
 *   - apps/admin/src/app/[locale]/(authenticated)/events/[id]/questions/questions-list.tsx
 *   - apps/admin/src/app/[locale]/(authenticated)/contacts/page.tsx ("Last contacted" column)
 *
 * Keep the language strings minimal (English) — the column header is
 * already localized via next-intl; this is just the value. If we ever
 * need fully-localized relatives, swap the body for `Intl.RelativeTimeFormat`.
 */
export function formatRelative(iso: string, locale: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.round(ms / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}
