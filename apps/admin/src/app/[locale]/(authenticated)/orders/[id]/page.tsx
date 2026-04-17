import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/actions/orders";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@dbc/ui";
import { OrderDetailClient } from "./order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let data;
  try {
    data = await getOrder(id);
  } catch {
    notFound();
  }

  const shortId = data.order.id.slice(0, 8).toUpperCase();
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const eventTitle = data.event
    ? ((data.event[`title_${l}` as keyof typeof data.event] as string) ||
      data.event.title_en)
    : "—";

  const statusVariant =
    data.order.status === "paid" || data.order.status === "comped"
      ? "success"
      : data.order.status === "pending"
        ? "warning"
        : "error";

  return (
    <div>
      <Link
        href={`/${locale}/orders`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Orders
      </Link>

      <PageHeader
        title={`Order #${shortId}`}
        description={`${eventTitle} — ${new Date(data.order.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}`}
        cta={<Badge variant={statusVariant}>{data.order.status}</Badge>}
      />

      <OrderDetailClient
        order={data.order}
        tickets={data.tickets}
        contact={data.contact}
        coupon={data.coupon}
        locale={locale}
      />
    </div>
  );
}
