import { NotFoundHero } from "@dbc/ui";

/**
 * Global fallback 404 — fires when the URL doesn't match any [locale] segment
 * (e.g. /foo, /en-NONSENSE, /xyz). The copy stays English-only here since we
 * can't infer a locale from an unmatched path. Inside a valid locale like
 * /en/foo, Next.js renders [locale]/not-found.tsx instead.
 */
export default function GlobalNotFound() {
  return (
    <NotFoundHero
      eyebrow="Lost the trail"
      title="We can't find that page."
      description="The page you're after may have moved, been archived, or never existed. Here's where to go next."
      actions={[
        { label: "Home", href: "/en", variant: "primary" },
        { label: "Events", href: "/en/events", variant: "secondary" },
        { label: "Contact us", href: "/en/contact", variant: "ghost" },
      ]}
    />
  );
}
