import { NotFoundHero } from "@dbc/ui";

export default function GlobalNotFound() {
  return (
    <NotFoundHero
      eyebrow="Not found"
      title="We can't find that ticket page."
      description="The event or order you're looking for may have ended, been moved, or the link may have expired. You can still browse the active events."
      actions={[
        { label: "Browse events", href: "/en", variant: "primary" },
        { label: "My orders", href: "/en/orders", variant: "secondary" },
      ]}
    />
  );
}
