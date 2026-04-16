import { NotFoundHero } from "@dbc/ui";

export default function GlobalNotFound() {
  return (
    <NotFoundHero
      eyebrow="Admin"
      title="This page doesn't exist."
      description="The route you followed isn't part of the admin app. You may have mistyped the URL or been sent a broken link."
      actions={[
        { label: "Go to dashboard", href: "/en/dashboard", variant: "primary" },
        { label: "Back to login", href: "/en/login", variant: "secondary" },
      ]}
    />
  );
}
