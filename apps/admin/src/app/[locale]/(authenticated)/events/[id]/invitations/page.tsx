import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "admin.events.invitations" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [invitations, tiers] = await Promise.all([
    listInvitationsForEvent(id),
    getEventTiers(id),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
        cta={
          <Link
            href={`/${locale}/events/${id}/invitations/bulk`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {t("bulkImport")}
          </Link>
        }
      />
      <p className="mt-1 text-sm text-muted-foreground">
        {t("filterNote")}{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">acquisition_type = invited</code>.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="font-heading text-lg font-bold">{t("newInvitation")}</h2>
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
            {t("invited")} ({invitations.length})
          </h2>
          <div className="mt-4 space-y-2">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
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
                        {ticket?.tier?.name_en ?? t("ticketFallback")} ·{" "}
                        {new Date(inv.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      {ticket?.checked_in_at ? (
                        <Badge variant="success"><Check className="mr-1 inline h-3 w-3" strokeWidth={2} /> {t("attended")}</Badge>
                      ) : inv.email_sent_at ? (
                        <Badge variant="default">{t("sent")}</Badge>
                      ) : (
                        <Badge variant="error">{t("emailPending")}</Badge>
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
