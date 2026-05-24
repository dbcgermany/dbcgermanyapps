import Link from "next/link";
import { LinkButton, BRAND_HEX } from "@dbc/ui";
import { getTranslations } from "next-intl/server";
import {
  listContacts,
  listEventsForContactFilter,
  listContactCategoriesForFilter,
} from "@/actions/contacts";
import { formatRelative } from "@/lib/relative-time";
import { getAllAttendees } from "@/actions/attendees";
import {
  EVENT_ROLE_FILTER_VALUES,
  PIPELINE_STATUS_VALUES,
  type EventRoleFilterValue,
  type PipelineStatus,
} from "@dbc/types";
import type { InvolvementRole } from "@/lib/involvements";
import { PageHeader } from "@/components/page-header";
import { PipelineBadge } from "@/components/pipeline-badge";
import { Tabs } from "@/components/tabs";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";
import { EmptyState } from "@/components/empty-state";
import { AttendeesTab } from "./attendees-tab";
import { ContactsFilterBar } from "./contacts-filter-bar";

type Tab = "contacts" | "attendees";

export default async function ContactsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: string;
    q?: string;
    category?: string;
    event?: string;
    role?: string;
    pipeline?: string;
    marketing?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "attendees" ? "attendees" : "contacts";

  const t = await getTranslations({ locale, namespace: "admin.contacts" });
  const tTabs = await getTranslations({ locale, namespace: "admin.contacts.list.tabs" });

  // Event + category lists are needed by the filter form; fetch once.
  const [events, categories] = await Promise.all([
    listEventsForContactFilter(),
    listContactCategoriesForFilter(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description=""
        cta={
          tab === "contacts" ? (
            <LinkButton href={`/${locale}/contacts/new`}>
              {t("createContact")}
            </LinkButton>
          ) : null
        }
      />

      <Tabs
        className="mt-6"
        items={[
          {
            href: `/${locale}/contacts`,
            label: tTabs("contacts"),
            active: tab === "contacts",
          },
          {
            href: `/${locale}/contacts?tab=attendees${sp.event ? `&event=${sp.event}` : ""}`,
            label: tTabs("attendees"),
            active: tab === "attendees",
          },
        ]}
      />

      {tab === "contacts" ? (
        <ContactsTabContent
          locale={locale}
          sp={sp}
          events={events}
          categories={categories}
          t={t}
        />
      ) : (
        <AttendeesTabContent
          locale={locale}
          eventId={sp.event ?? ""}
          events={events}
        />
      )}
    </div>
  );
}

// -- Contacts tab (server component) ---------------------------------------

async function ContactsTabContent({
  locale,
  sp,
  events,
  categories,
  t,
}: {
  locale: string;
  sp: {
    q?: string;
    category?: string;
    event?: string;
    role?: string;
    pipeline?: string;
    marketing?: string;
  };
  events: Array<{ id: string; title_en: string }>;
  categories: Array<{
    slug: string;
    name_en: string;
    name_de: string | null;
    name_fr: string | null;
  }>;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const role: InvolvementRole | undefined =
    sp.role &&
    (EVENT_ROLE_FILTER_VALUES as readonly string[]).includes(sp.role)
      ? (sp.role as EventRoleFilterValue)
      : undefined;
  const pipelineStatus: PipelineStatus | "none" | undefined =
    sp.pipeline === "none"
      ? "none"
      : sp.pipeline &&
        (PIPELINE_STATUS_VALUES as readonly string[]).includes(sp.pipeline)
      ? (sp.pipeline as PipelineStatus)
      : undefined;

  const contacts = await listContacts({
    search: sp.q,
    categorySlug: sp.category,
    eventId: sp.event || undefined,
    role,
    pipelineStatus,
    marketingOnly: sp.marketing === "1",
    // Pure attendees (event_attendees tag only, no other category) live in
    // the dedicated Attendees tab — hide them here so the Contacts tab stays
    // focused on sponsors / press / speakers / founders / etc. Sponsors who
    // also bought a ticket keep showing because they carry another category.
    excludePureAttendees: true,
  });

  if (contacts.length === 0) {
    return (
      <>
        <ContactsFilterBar
          locale={locale}
          events={events}
          categories={categories}
        />
        <div className="mt-8">
          <EmptyState message={t("empty")} />
        </div>
      </>
    );
  }

  return (
    <>
      <ContactsFilterBar
        locale={locale}
        events={events}
        categories={categories}
      />

      {/* Mobile: shared MobileList — condensed cell (name + email + pipeline badge) */}
      <MobileList
        className="mt-6 md:hidden"
        items={contacts}
        renderCell={(c) => {
          const displayName =
            [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
          return {
            id: c.id,
            title: displayName,
            meta: (
              <>
                <span className="block truncate">{c.email}</span>
                {c.country && (
                  <span className="mt-1 block text-[11px]">{c.country}</span>
                )}
              </>
            ),
            trailing: <PipelineBadge status={c.pipeline_status} />,
            href: `/${locale}/contacts/${c.id}`,
          };
        }}
      />

      {/* Desktop: shared DataTable — every cell links to the detail page so
          any pixel in the row is a tap target */}
      <div className="mt-6 hidden md:block">
        <DataTable
          columns={[
            t("name"),
            t("email"),
            t("country"),
            t("categories"),
            t("list.columns.pipeline"),
            t("marketing"),
            t("list.columns.lastContacted"),
            { label: t("orders"), align: "right" },
            { label: t("tickets"), align: "right" },
          ]}
        >
          {contacts.map((c) => {
            const profileHref = `/${locale}/contacts/${c.id}`;
            const cellLink = "-mx-4 -my-3 block px-4 py-3 hover:bg-muted/30";
            return (
              <DataTable.Row key={c.id} className="group">
                <DataTable.Cell className="p-0">
                  <Link
                    href={profileHref}
                    className={`${cellLink} font-medium text-foreground group-hover:text-primary`}
                  >
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link
                    href={profileHref}
                    className={`${cellLink} text-muted-foreground`}
                  >
                    {c.email}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link href={profileHref} className={cellLink}>
                    {c.country ?? "—"}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link href={profileHref} className={cellLink}>
                    <span className="flex flex-wrap gap-1">
                      {c.categories.map((cat) => (
                        <span
                          key={cat.slug}
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor:
                              (cat.color ?? BRAND_HEX.inkMuted) + "22",
                            color: cat.color ?? undefined,
                          }}
                        >
                          {cat.name_en}
                        </span>
                      ))}
                    </span>
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link href={profileHref} className={cellLink}>
                    <PipelineBadge status={c.pipeline_status} />
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link href={profileHref} className={cellLink}>
                    {c.unsubscribed_at ? (
                      <span className="text-xs text-muted-foreground">
                        {t("unsubscribed")}
                      </span>
                    ) : c.marketing_consent ? (
                      <span className="text-xs font-medium text-success">
                        {t("subscribed")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell className="p-0">
                  <Link href={profileHref} className={cellLink}>
                    {c.last_contacted_at ? (
                      <time
                        dateTime={c.last_contacted_at}
                        title={new Date(c.last_contacted_at).toLocaleString()}
                        className="text-xs text-muted-foreground"
                      >
                        {formatRelative(c.last_contacted_at, locale)}
                      </time>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell align="right" className="p-0">
                  <Link
                    href={profileHref}
                    className={`${cellLink} text-right`}
                  >
                    {c.orders_count}
                  </Link>
                </DataTable.Cell>
                <DataTable.Cell align="right" className="p-0">
                  <Link
                    href={profileHref}
                    className={`${cellLink} text-right`}
                  >
                    {c.tickets_count}
                  </Link>
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      </div>
    </>
  );
}

// -- Attendees tab (server fetch + client component) -----------------------

async function AttendeesTabContent({
  locale,
  eventId,
  events,
}: {
  locale: string;
  eventId: string;
  events: Array<{ id: string; title_en: string }>;
}) {
  const attendees = await getAllAttendees({ eventId: eventId || undefined });
  return (
    <AttendeesTab
      locale={locale}
      attendees={attendees}
      events={events}
      selectedEventId={eventId}
    />
  );
}
