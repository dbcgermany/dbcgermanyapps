import Link from "next/link";
import { LinkButton } from "@dbc/ui";
import { getTranslations } from "next-intl/server";
import {
  listContacts,
  listEventsForContactFilter,
} from "@/actions/contacts";
import { getAllAttendees } from "@/actions/attendees";
import {
  INVOLVEMENT_ROLES,
  type InvolvementRole,
} from "@/lib/involvements";
import { PageHeader } from "@/components/page-header";
import { AttendeesTab } from "./attendees-tab";

type Tab = "contacts" | "attendees";

const TAB_T = {
  en: { contacts: "Contacts", attendees: "Attendees" },
  de: { contacts: "Kontakte", attendees: "Teilnehmer" },
  fr: { contacts: "Contacts", attendees: "Participants" },
} as const;

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
    marketing?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "attendees" ? "attendees" : "contacts";

  const t = await getTranslations({ locale, namespace: "admin.contacts" });
  const tCommon = await getTranslations({ locale, namespace: "admin.common" });
  const tabT =
    TAB_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof TAB_T];

  // Event list is needed by both tabs, so fetch once.
  const events = await listEventsForContactFilter();

  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

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

      <div className="mt-6 flex gap-1 border-b border-border">
        <Link
          href={`/${locale}/contacts`}
          className={tabClass(tab === "contacts")}
        >
          {tabT.contacts}
        </Link>
        <Link
          href={`/${locale}/contacts?tab=attendees${sp.event ? `&event=${sp.event}` : ""}`}
          className={tabClass(tab === "attendees")}
        >
          {tabT.attendees}
        </Link>
      </div>

      {tab === "contacts" ? (
        <ContactsTabContent
          locale={locale}
          sp={sp}
          events={events}
          t={t}
          tCommon={tCommon}
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
  t,
  tCommon,
}: {
  locale: string;
  sp: {
    q?: string;
    category?: string;
    event?: string;
    role?: string;
    marketing?: string;
  };
  events: Array<{ id: string; title_en: string }>;
  t: Awaited<ReturnType<typeof getTranslations>>;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const tRole = await getTranslations({
    locale,
    namespace: "admin.contacts.roles",
  });
  const contacts = await listContacts({
    search: sp.q,
    categorySlug: sp.category,
    eventId: sp.event || undefined,
    role:
      sp.role && (INVOLVEMENT_ROLES as readonly string[]).includes(sp.role)
        ? (sp.role as InvolvementRole)
        : undefined,
    marketingOnly: sp.marketing === "1",
  });

  const filterInput =
    "rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <>
      <form className="mt-6 flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={t("search")}
          className={`${filterInput} w-64`}
        />
        <select
          name="event"
          defaultValue={sp.event ?? ""}
          className={filterInput}
        >
          <option value="">{t("allEvents")}</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title_en}
            </option>
          ))}
        </select>
        <select
          name="role"
          defaultValue={sp.role ?? ""}
          className={filterInput}
        >
          <option value="">{t("allRoles")}</option>
          {(INVOLVEMENT_ROLES as readonly InvolvementRole[]).map((r) => (
            <option key={r} value={r}>
              {tRole(r)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="marketing"
            value="1"
            defaultChecked={sp.marketing === "1"}
          />
          {t("marketingOnly")}
        </label>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          {tCommon("filter")}
        </button>
        {(sp.q || sp.marketing || sp.event || sp.role) && (
          <Link
            href="?"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {tCommon("cancel")}
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">{t("name")}</th>
              <th className="px-4 py-3 text-left">{t("email")}</th>
              <th className="px-4 py-3 text-left">{t("country")}</th>
              <th className="px-4 py-3 text-left">{t("categories")}</th>
              <th className="px-4 py-3 text-left">{t("marketing")}</th>
              <th className="px-4 py-3 text-right">{t("orders")}</th>
              <th className="px-4 py-3 text-right">{t("tickets")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              contacts.map((c) => {
                const profileHref = `/${locale}/contacts/${c.id}`;
                // Each cell wraps its content in a Link to the same target.
                // Multiple anchors per <tr> is valid HTML (vs. a nested-link
                // antipattern), and it gives every column a click target —
                // the user can hit any pixel of the row to open the profile.
                const cell =
                  "block px-4 py-3 hover:bg-muted/30 focus:bg-muted/40 focus:outline-none";
                return (
                  <tr
                    key={c.id}
                    className="group transition-colors hover:bg-muted/10"
                  >
                    <td className="p-0">
                      <Link
                        href={profileHref}
                        className={`${cell} font-medium text-foreground group-hover:text-primary`}
                      >
                        {[c.first_name, c.last_name]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link
                        href={profileHref}
                        className={`${cell} text-muted-foreground`}
                      >
                        {c.email}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={profileHref} className={cell}>
                        {c.country ?? "—"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={profileHref} className={cell}>
                        <div className="flex flex-wrap gap-1">
                          {c.categories.map((cat) => (
                            <span
                              key={cat.slug}
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: (cat.color ?? "#888") + "22",
                                color: cat.color ?? undefined,
                              }}
                            >
                              {cat.name_en}
                            </span>
                          ))}
                        </div>
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={profileHref} className={cell}>
                        {c.unsubscribed_at ? (
                          <span className="text-xs text-muted-foreground">
                            {t("unsubscribed")}
                          </span>
                        ) : c.marketing_consent ? (
                          <span className="text-xs font-medium text-green-600">
                            {t("subscribed")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="p-0 text-right">
                      <Link href={profileHref} className={`${cell} text-right`}>
                        {c.orders_count}
                      </Link>
                    </td>
                    <td className="p-0 text-right">
                      <Link href={profileHref} className={`${cell} text-right`}>
                        {c.tickets_count}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
