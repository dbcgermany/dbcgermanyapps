import Link from "next/link";
import { listContacts } from "@/actions/contacts";

export default async function ContactsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; marketing?: string }>;
}) {
  const sp = await searchParams;
  const contacts = await listContacts({
    search: sp.q,
    categorySlug: sp.category,
    marketingOnly: sp.marketing === "1",
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every person who ever bought a ticket, was invited, or subscribed
            to the newsletter. Click a row for their full history.
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name or email…"
          className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="marketing"
            value="1"
            defaultChecked={sp.marketing === "1"}
          />
          Newsletter-active only
        </label>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Filter
        </button>
        {(sp.q || sp.marketing) && (
          <Link
            href="?"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Categories</th>
              <th className="px-4 py-3 text-left">Marketing</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Tickets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No contacts yet.
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
                        Unsubscribed
                      </span>
                    ) : c.marketing_consent ? (
                      <span className="text-xs font-medium text-green-600">
                        Subscribed
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
