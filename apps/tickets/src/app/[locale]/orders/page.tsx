import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@dbc/supabase/server";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const t = await getTranslations({
    locale,
    namespace: "tickets.orders.list",
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const browseHref = `/${locale}`;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("signInRequired")}</p>
      </main>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total_cents, status, acquisition_type, recipient_name, created_at, event_id"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const eventIds = [...new Set((orders ?? []).map((o) => o.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, slug")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

  const statusKeys = new Set([
    "pending",
    "paid",
    "comped",
    "refunded",
    "cancelled",
  ]);
  function statusLabelOf(status: string): string {
    if (statusKeys.has(status)) {
      return t(`status.${status}`);
    }
    return status;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href={browseHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {t("emptyCta")}
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => {
            const evt = eventMap.get(order.event_id);
            const titleKey = `title_${locale}` as keyof NonNullable<typeof evt>;
            const eventTitle = evt
              ? (evt[titleKey] as string) || evt.title_en
              : "Event";
            const statusLabel = statusLabelOf(order.status);
            const isPaid =
              order.status === "paid" || order.status === "comped";

            return (
              <li key={order.id}>
                <Link
                  href={`/${locale}/confirmation/${order.id}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{eventTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      {order.total_cents === 0
                        ? t("free")
                        : `€${(order.total_cents / 100).toFixed(2)}`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPaid
                          ? "bg-success-soft text-success"
                          : order.status === "pending"
                            ? "bg-warning-soft text-warning"
                            : "bg-danger-soft text-danger"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
