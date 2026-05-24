import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import {
  Calendar,
  ClipboardList,
  Gift,
  Globe,
  Handshake,
  Image as ImageIcon,
  ListChecks,
  Mail,
  Megaphone,
  MessageCircleQuestion,
  Mic,
  QrCode,
  Radio,
  Scissors,
  Tag,
  TicketCheck,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Button, Card, LinkButton, BRAND_HEX } from "@dbc/ui";
import { getEvent, togglePublish, duplicateEvent } from "@/actions/events";
import { getEventChecklist } from "@/actions/checklist";
import { getLiveEventStats } from "@/actions/live-event";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { YourInvitesCard } from "./your-invites-card";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { DeleteEventButton } from "./delete-button";
import { EventQrCard } from "./event-qr-card";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [t, tBack, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.events.detail" }),
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const isExternal = event.event_branch === "other";

  // Ticketing-only data: only fetch when we'll actually render it.
  const [checklist, liveStats] = isExternal
    ? [
        { progress: { done: 0, total: 0, overdue: 0 } },
        {
          ticketsSold: 0,
          ticketsAllocated: 0,
          totalTickets: 0,
          revenueCents: 0,
          checkedIn: 0,
          checkedInPct: 0,
          revenueByTier: [] as Array<{
            tier_id: string;
            tier_name: string;
            tickets_sold: number;
            revenue_cents: number;
          }>,
        },
      ]
    : await Promise.all([getEventChecklist(id), getLiveEventStats(id)]);
  const clPct = checklist.progress.total > 0
    ? Math.round((checklist.progress.done / checklist.progress.total) * 100)
    : 0;

  // Sales target progress — counts real sales only, not allocations.
  const ticketTarget = event.sales_target_tickets;
  const revenueTarget = event.sales_target_revenue_cents;
  const ticketsSoldForTarget = liveStats.ticketsSold;
  const revenueForTarget = liveStats.revenueCents;

  // Days-until computation (server component — Date.now is fine here)
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysUntil = Math.ceil(
    (new Date(event.starts_at).getTime() - nowMs) / 86400000
  );
  const daysLabel =
    daysUntil > 0
      ? `${daysUntil} ${daysUntil === 1 ? t("day") : t("days")}`
      : daysUntil === 0
        ? t("today")
        : `${Math.abs(daysUntil)} ${
            Math.abs(daysUntil) === 1 ? t("dayAgo") : t("daysAgo")
          }`;
  const ticketProgressPct = ticketTarget && ticketTarget > 0
    ? Math.min(100, Math.round((ticketsSoldForTarget / ticketTarget) * 100))
    : null;
  const revenueProgressPct = revenueTarget && revenueTarget > 0
    ? Math.min(100, Math.round((revenueForTarget / revenueTarget) * 100))
    : null;

  const titleKey = `title_${locale}` as keyof typeof event;
  const descKey = `description_${locale}` as keyof typeof event;

  // Public event-page QR — encodes the marketing/landing URL on the tickets
  // app (NOT the per-ticket QR used at the door for check-in). Use this for
  // flyers, social posts, partner decks — anywhere you want someone to read
  // about the event before deciding to buy.
  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
  const publicEventUrl = `${ticketsBaseUrl}/${locale}/events/${event.slug}`;
  const publicEventQrPng = await QRCode.toDataURL(publicEventUrl, {
    width: 720,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: BRAND_HEX.ink, light: BRAND_HEX.paper },
  });

  return (
    <div>
      {/* Header */}
      <div>
        <PageHeader
          title={(event[titleKey] as string) || event.title_en}
          back={{ href: `/${locale}/events`, label: tBack("events") }}
          cta={
            <div className="flex flex-wrap gap-2">
              <ActionForm
                action={async () => {
                  "use server";
                  return togglePublish(id, locale);
                }}
                successToast={
                  event.is_published
                    ? tCommon("unpublishedToast")
                    : tCommon("publishedToast")
                }
                errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
              >
                <Button type="submit" variant="secondary">
                  {event.is_published ? t("unpublish") : t("publish")}
                </Button>
              </ActionForm>
              <ActionForm
                action={async () => {
                  "use server";
                  return duplicateEvent(id, locale);
                }}
                successToast={tCommon("duplicatedToast")}
                errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  title={t("duplicateTitle")}
                >
                  {t("duplicate")}
                </Button>
              </ActionForm>
              <LinkButton href={`/${locale}/events/${id}/edit`}>
                {t("edit")}
              </LinkButton>
            </div>
          }
        />
        <div className="mt-1 flex items-center gap-3">
          <Badge variant={event.is_published ? "success" : "warning"}>
            {event.is_published ? t("published") : t("draft")}
          </Badge>
          {isExternal ? (
            <Badge variant="accent">{t("externalBranch")}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground capitalize">
              {event.event_type}
            </span>
          )}
          {isExternal && event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("openExternal")} &#x2197;
            </a>
          )}
        </div>
      </div>

      {/* Team-member's own team-friend invite codes (ticketing-only). */}
      {!isExternal && (
      <div className="mt-8">
        <YourInvitesCard eventId={id} />
      </div>
      )}

      {/* Event KPIs — 4 cards (ticketing-only) */}
      {!isExternal && (
      <div className="mt-8">
        <StatGrid cols={4}>
          <StatCard
            label={t("ticketsSold")}
            value={liveStats.ticketsSold.toLocaleString(locale)}
            sub={
              event.capacity
                ? t("ofCapacity", { n: event.capacity.toLocaleString(locale) })
                : undefined
            }
          />
          <StatCard
            label={t("allocations")}
            value={liveStats.ticketsAllocated.toLocaleString(locale)}
            sub={t("allocationsSub")}
          />
          <StatCard
            label={t("revenue")}
            value={`\u20AC${(liveStats.revenueCents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
          />
          <StatCard
            label={daysUntil >= 0 ? t("startsIn") : t("ended")}
            value={daysLabel}
          />
        </StatGrid>
      </div>
      )}

      {/* Per-tier sales breakdown (ticketing-only) */}
      {!isExternal && (
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t("salesByTier")}</h2>
        {liveStats.revenueByTier.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            {t("salesByTierEmpty")}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">{t("tierName")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("tierTickets")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("tierRevenue")}</th>
                </tr>
              </thead>
              <tbody>
                {liveStats.revenueByTier.map((row) => (
                  <tr key={row.tier_id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{row.tier_name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.tickets_sold.toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      €{(row.revenue_cents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {/* Event Info */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("dateTime")}
            </h2>
            <p className="mt-1">
              {new Date(event.starts_at).toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.starts_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              &ndash;{" "}
              {new Date(event.ends_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({event.timezone})
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("venue")}
            </h2>
            <p className="mt-1">{event.venue_name || t("venueNotSet")}</p>
            <p className="text-sm text-muted-foreground">
              {event.venue_address}
              {event.city && `, ${event.city}`}
            </p>
          </section>

          {!isExternal && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("capacity")}
            </h2>
            <p className="mt-1">
              {event.capacity} {t("attendees")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("maxPerOrder", { n: String(event.max_tickets_per_order) })}
            </p>
          </section>
          )}

          {!isExternal && (ticketProgressPct != null || revenueProgressPct != null) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground">
                {t("salesTarget")}
              </h2>
              <div className="mt-2 space-y-3">
                {ticketProgressPct != null && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {ticketsSoldForTarget}/{ticketTarget} {t("tickets")}
                      </span>
                      <span className="font-medium">{ticketProgressPct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${ticketProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {revenueProgressPct != null && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {`\u20AC${(revenueForTarget / 100).toLocaleString()} / \u20AC${(revenueTarget! / 100).toLocaleString()}`}
                      </span>
                      <span className="font-medium">{revenueProgressPct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-success-strong transition-all"
                        style={{ width: `${revenueProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {!isExternal && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("paymentMethods")}
            </h2>
            <div className="mt-1 flex gap-2">
              {event.enabled_payment_methods?.map((method: string) => (
                <Badge key={method} variant="default" className="capitalize">
                  {method}
                </Badge>
              ))}
            </div>
          </section>
          )}
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("description")}
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {(event[descKey] as string) || event.description_en || t("noDescription")}
            </p>
          </section>
        </div>
      </div>

      {/* Event-page QR — distinct from the per-ticket check-in QR. Encodes
          the public landing URL so people can scan a flyer / poster / slide
          and land on the event page (where they'll then choose to buy).
          External events don't live on our domain, so the QR is hidden. */}
      {!isExternal && (
      <section className="mt-8">
        <EventQrCard
          pngDataUrl={publicEventQrPng}
          publicUrl={publicEventUrl}
          fileBaseName={`event-page-${event.slug}`}
          labels={{
            title: t("qrCardTitle"),
            description: t("qrCardDesc"),
            publicLink: t("qrCardPublicLink"),
            download: t("qrCardDownload"),
            copy: t("qrCardCopy"),
            copied: t("qrCardCopied"),
            open: t("qrCardOpen"),
          }}
        />
      </section>
      )}

      {/* Management Hub — all sub-pages grouped (ticketing-only) */}
      {!isExternal && (
      <div className="mt-12 space-y-10 border-t border-border pt-8">
        {/* Setup */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t("setup")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/tiers`} icon={Tag} title={t("ticketTiers")} desc={t("ticketTiersDesc")} />
            <HubLink href={`/${locale}/events/${id}/coupons`} icon={Scissors} title={t("couponCodes")} desc={t("couponCodesDesc")} />
            <HubLink href={`/${locale}/events/${id}/team-invites`} icon={Scissors} title={t("teamFriendInvites")} desc={t("teamFriendInvitesDesc")} />
            <HubLink href={`/${locale}/chapter-delegates?event=${id}`} icon={Globe} title={t("chapterDelegates")} desc={t("chapterDelegatesDesc")} />
            <HubLink href={`/${locale}/events/${id}/catering`} icon={Tag} title={t("cateringMenu")} desc={t("cateringMenuDesc")} />
            <HubLink href={`/${locale}/events/${id}/schedule`} icon={Calendar} title={t("scheduleSpeakers")} desc={t("scheduleSpeakersDesc")} />
            <HubLink href={`/${locale}/events/${id}/ticket-preview`} icon={TicketCheck} title={t("ticketPreview")} desc={t("ticketPreviewDesc")} />
          </div>
        </section>

        {/* Marketing */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t("marketing")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink
              href={`/${locale}/events/${id}/funnel`}
              icon={Megaphone}
              title="Funnel content"
              desc="Hero video, intro/closing copy, pillars, testimonials, FAQs, scarcity threshold."
            />
            <HubLink
              href={`/${locale}/events/${id}/speakers`}
              icon={Mic}
              title="Speakers"
              desc="Attach speakers to this event and set role labels (Keynote, Host, Co-Host)."
            />
            <HubLink href={`/${locale}/events/${id}/emails`} icon={Mail} title={t("emailSequences")} desc={t("emailSequencesDesc")} />
            <HubLink
              href={`/${locale}/events/${id}/questions`}
              icon={MessageCircleQuestion}
              title="Speaker questions"
              desc="Buyer-submitted questions, triage by speaker, export PDF for prep."
            />
            <HubLink href={`/${locale}/events/${id}/invitations`} icon={Gift} title={t("invitations")} desc={t("invitationsDesc")} />
            <HubLink href={`/${locale}/events/${id}/invitations/bulk`} icon={Upload} title={t("bulkInvitations")} desc={t("bulkInvitationsDesc")} />
          </div>
        </section>

        {/* Operations */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t("operations")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink
              href={`/${locale}/events/${id}/checklist`}
              icon={ListChecks}
              title={t("checklist")}
              desc={`${checklist.progress.done}/${checklist.progress.total} (${clPct}%)${checklist.progress.overdue > 0 ? ` \u00B7 ${checklist.progress.overdue} ${t("checklistOverdueSuffix")}` : ""}`}
            />
            <HubLink href={`/${locale}/events/${id}/runsheet`} icon={ClipboardList} title={t("runSheet")} desc={t("runSheetDesc")} />
            <HubLink href={`/${locale}/events/${id}/sponsors`} icon={Handshake} title={t("sponsors")} desc={t("sponsorsDesc")} />
            <HubLink href={`/${locale}/events/${id}/budget`} icon={Wallet} title={t("budgetExpenses")} desc={t("budgetExpensesDesc")} />
            <HubLink
              href={`/${locale}/events/${id}/staff`}
              icon={Users}
              title="Event staff"
              desc="DBC team members on duty for this event (scanners, managers, on-site admins)."
            />
            <HubLink href={`/${locale}/events/${id}/live`} icon={Radio} title={t("liveDashboard")} desc={t("liveDashboardDesc")} />
          </div>
        </section>

        {/* Post-event */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t("postEvent")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/attendees`} icon={Users} title={t("attendeesHub")} desc={t("attendeesHubDesc")} />
            <HubLink
              href={`/${locale}/events/${id}/orders`}
              icon={Wallet}
              title="Orders"
              desc="Online purchases + manual door sales for this event."
            />
            <HubLink href={`/${locale}/events/${id}/media`} icon={ImageIcon} title={t("media")} desc={t("mediaDesc")} />
            <HubLink href={`/${locale}/events/${id}/poster`} icon={QrCode} title={t("posterDoor")} desc={t("posterDoorDesc")} />
          </div>
        </section>
      </div>
      )}

      {/* Danger zone */}
      <div className="mt-12 rounded-lg border border-danger-border p-6">
        <h3 className="text-sm font-medium text-danger">
          {t("dangerZone")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dangerDesc")}
        </p>
        <DeleteEventButton
          eventId={id}
          eventTitle={event.title_en}
          locale={locale}
        />
      </div>
    </div>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Tag;
  title: string;
  desc: string;
}) {
  // h-full on both the Link and the Card so every card in a grid row
  // stretches to the height of the tallest sibling — otherwise rows
  // with longer descriptions tower over their neighbours.
  return (
    <Link href={href} className="block h-full">
      <Card
        padding="sm"
        className="group h-full rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/50"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" strokeWidth={1.75} />
          <div>
            <p className="font-medium group-hover:text-primary">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
