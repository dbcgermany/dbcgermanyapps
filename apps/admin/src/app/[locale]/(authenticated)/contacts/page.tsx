import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  INVOLVEMENT_ROLES,
  listContacts,
  listEventsForContactFilter,
  type InvolvementRole,
} from "@/actions/contacts";
import { PageHeader } from "@/components/page-header";

export default async function ContactsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    event?: string;
    role?: string;
    marketing?: string;
  }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.contacts" });
  const tRole = await getTranslations({
    locale,
    namespace: "admin.contacts.roles",
  });
  const tCommon = await getTranslations({ locale, namespace: "admin.common" });
  const sp = await searchParams;
  const [contacts, events] = await Promise.all([
    listContacts({
      search: sp.q,
      categorySlug: sp.category,
      eventId: sp.event || undefined,
      role:
        sp.role && (INVOLVEMENT_ROLES as readonly string[]).includes(sp.role)
          ? (sp.role as InvolvementRole)
          : undefined,
      marketingOnly: sp.marketing === "1",
    }),
    listEventsForContactFilter(),
  ]);

  const filterInput =
    "rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader
        title={t("title")}
        description=""
        cta={
          <Link
            href={`/${locale}/contacts/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("createContact")}
          </Link>
        }
      />

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
              contacts.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`contacts/${c.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">{c.country ?? "—"}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3">
                    {c.unsubscribed_at ? (
                      <span className="text-xs text-muted-foreground">
                        {t("unsubscribed")}
                      </span>
                    ) : c.marketing_consent ? (
                      <span className="text-xs font-medium text-green-600">
                        {t("subscribed")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{c.orders_count}</td>
                  <td className="px-4 py-3 text-right">{c.tickets_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
