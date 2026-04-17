import Link from "next/link";
import { listInvitationsForEvent } from "@/actions/invitations";
import { getEventTiers } from "@/actions/door-sale";
import { InviteForm } from "./invite-form";
import { Card, Badge } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

export default async function EventInvitationsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [invitations, tiers] = await Promise.all([
    listInvitationsForEvent(id),
    getEventTiers(id),
  ]);

  return (
    <div>
      <Link
        href={`/${locale}/events/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Event
      </Link>
      <PageHeader
        title="Invitations"
        description="Comped tickets — guests receive a branded PDF and are tagged invited_guests in Contacts."
        cta={
          <Link
            href={`/${locale}/events/${id}/invitations/bulk`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Bulk import CSV →
          </Link>
        }
        className="mt-3"
      />
      <p className="mt-1 text-sm text-muted-foreground">
        Filter reports by{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">acquisition_type = invited</code>.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="font-heading text-lg font-bold">New invitation</h2>
          <InviteForm
            eventId={id}
            locale={locale}
            tiers={tiers.map((t) => ({
              id: t.id,
              name: t.name_en,
              remaining:
                t.max_quantity === null
                  ? null
                  : t.max_quantity - t.quantity_sold,
            }))}
          />
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold">
            Invited ({invitations.length})
          </h2>
          <div className="mt-4 space-y-2">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invitations yet for this event.
              </p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (invitations as any[]).map((inv) => {
                const ticket = inv.tickets?.[0];
                return (
                  <Card
                    key={inv.id}
                    padding="sm"
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.recipient_email} ·{" "}
                        {ticket?.tier?.name_en ?? "Ticket"} ·{" "}
                        {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {ticket?.checked_in_at ? (
                        <Badge variant="success">✓ Attended</Badge>
                      ) : inv.email_sent_at ? (
                        <Badge variant="default">Sent</Badge>
                      ) : (
                        <Badge variant="error">Email pending</Badge>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
