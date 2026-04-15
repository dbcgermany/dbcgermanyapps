import Link from "next/link";
import { getEventTiers } from "@/actions/door-sale";
import { BulkInviteClient } from "./bulk-invite-client";

export default async function BulkInvitationsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tiers = await getEventTiers(id);

  return (
    <div className="p-8">
      <Link
        href={`/${locale}/events/${id}/invitations`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Invitations
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-bold">
        Bulk invite from CSV
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a CSV with one guest per row. Header required; columns —{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">email</code>{" "}
        (required),{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">first_name</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">last_name</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">country</code>{" "}
        (ISO-2),{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">occupation</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">category_tags</code>{" "}
        (semicolon-separated slugs),{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">tier_slug</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">locale</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">note</code>.
      </p>
      <p className="mt-2 text-sm">
        <a
          href="/samples/invitations-sample.csv"
          download
          className="text-primary underline hover:opacity-80"
        >
          Download sample CSV
        </a>
      </p>

      <BulkInviteClient
        eventId={id}
        locale={locale}
        tiers={tiers.map((t) => ({
          id: t.id,
          name: t.name_en,
          remaining:
            t.max_quantity === null ? null : t.max_quantity - t.quantity_sold,
        }))}
      />
    </div>
  );
}
