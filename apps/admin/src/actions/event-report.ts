"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

export interface EventReportSections {
  kpis: boolean;
  tiers: boolean;
  demographics: boolean;
  attendees: boolean;
}

export interface EventReportData {
  event: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    venueName: string;
    city: string;
    capacity: number | null;
  };
  brand: {
    brandName: string;
    legalName: string | null;
    logoUrl: string | null;
    primaryColor: string;
    supportEmail: string | null;
  };
  kpis?: {
    ticketsSold: number;
    checkedInCount: number;
    checkInRate: number;
    ordersPaid: number;
    ordersComped: number;
    ordersInvited: number;
    ordersDoorSale: number;
    revenueCents: number;
    currency: string;
  };
  tiers?: Array<{
    name: string;
    priceCents: number;
    quantitySold: number;
    maxQuantity: number | null;
    revenueCents: number;
  }>;
  demographics?: {
    byCountry: Array<{ code: string | null; count: number }>;
    byGender: Array<{ gender: string | null; count: number }>;
    byOccupation: Array<{ occupation: string | null; count: number }>;
    bySource: Array<{ source: string | null; count: number }>;
  };
  attendees?: Array<{
    name: string;
    email: string;
    tier: string;
    checkedIn: boolean;
    country: string | null;
  }>;
}

export async function getEventReportData(opts: {
  eventId: string;
  locale: string;
  sections: EventReportSections;
}): Promise<EventReportData> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const loc = (opts.locale === "de" || opts.locale === "fr"
    ? opts.locale
    : "en") as "en" | "de" | "fr";

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, venue_name, city, capacity"
    )
    .eq("id", opts.eventId)
    .single();
  if (!event) throw new Error("Event not found");

  const { data: companyInfo } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const eventTitle =
    (event[`title_${loc}` as keyof typeof event] as string) || event.title_en;

  const data: EventReportData = {
    event: {
      id: event.id,
      title: eventTitle,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      venueName: event.venue_name ?? "",
      city: event.city ?? "",
      capacity: event.capacity,
    },
    brand: {
      brandName: companyInfo?.brand_name ?? "DBC Germany",
      legalName: companyInfo
        ? [companyInfo.legal_name, companyInfo.legal_form]
            .filter(Boolean)
            .join(" ")
        : null,
      logoUrl: companyInfo?.logo_light_url ?? null,
      primaryColor: companyInfo?.primary_color ?? "#c8102e",
      supportEmail: companyInfo?.support_email ?? null,
    },
  };

  if (opts.sections.kpis) {
    const { data: orders } = await supabase
      .from("orders")
      .select("status, acquisition_type, total_cents, currency")
      .eq("event_id", opts.eventId);
    const { count: ticketCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", opts.eventId);
    const { count: checkedInCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", opts.eventId)
      .not("checked_in_at", "is", null);

    const paid = (orders ?? []).filter((o) => o.status === "paid");
    const byAcq = (type: string) =>
      (orders ?? []).filter((o) => o.acquisition_type === type).length;

    data.kpis = {
      ticketsSold: ticketCount ?? 0,
      checkedInCount: checkedInCount ?? 0,
      checkInRate:
        (ticketCount ?? 0) > 0
          ? (checkedInCount ?? 0) / (ticketCount ?? 0)
          : 0,
      ordersPaid: paid.length,
      ordersComped: byAcq("assigned"),
      ordersInvited: byAcq("invited"),
      ordersDoorSale: byAcq("door_sale"),
      revenueCents: paid.reduce((sum, o) => sum + (o.total_cents ?? 0), 0),
      currency: paid[0]?.currency ?? "EUR",
    };
  }

  if (opts.sections.tiers) {
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select(
        "id, name_en, name_de, name_fr, price_cents, max_quantity, quantity_sold"
      )
      .eq("event_id", opts.eventId)
      .order("sort_order", { ascending: true });
    data.tiers = (tiers ?? []).map((t) => ({
      name:
        (t[`name_${loc}` as keyof typeof t] as string) || t.name_en,
      priceCents: t.price_cents,
      quantitySold: t.quantity_sold,
      maxQuantity: t.max_quantity,
      revenueCents: t.price_cents * t.quantity_sold,
    }));
  }

  if (opts.sections.demographics || opts.sections.attendees) {
    const { data: tickets } = await supabase
      .from("tickets")
      .select(
        "id, attendee_name, attendee_email, contact_id, tier_id, checked_in_at, order_id"
      )
      .eq("event_id", opts.eventId);

    const contactIds = Array.from(
      new Set((tickets ?? []).map((t) => t.contact_id).filter(Boolean))
    ) as string[];
    const { data: contacts } =
      contactIds.length > 0
        ? await supabase
            .from("contacts")
            .select("id, country, gender, occupation")
            .in("id", contactIds)
        : { data: [] as Array<{ id: string; country: string | null; gender: string | null; occupation: string | null }> };
    const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]));

    if (opts.sections.demographics) {
      const counts = <K extends string | null>(keyFn: (contactId: string | null) => K) => {
        const m = new Map<K, number>();
        for (const t of tickets ?? []) {
          const k = keyFn(t.contact_id);
          m.set(k, (m.get(k) ?? 0) + 1);
        }
        return Array.from(m.entries())
          .map(([k, v]) => ({ key: k, count: v }))
          .sort((a, b) => b.count - a.count);
      };

      const byCountryRaw = counts<string | null>((cid) => {
        if (!cid) return null;
        return contactMap.get(cid)?.country ?? null;
      });
      const byGenderRaw = counts<string | null>((cid) => {
        if (!cid) return null;
        return contactMap.get(cid)?.gender ?? null;
      });
      const byOccupationRaw = counts<string | null>((cid) => {
        if (!cid) return null;
        return contactMap.get(cid)?.occupation ?? null;
      });

      // Source comes from the order, not the ticket directly.
      const orderIds = Array.from(
        new Set((tickets ?? []).map((t) => t.order_id).filter(Boolean))
      ) as string[];
      const { data: orders } =
        orderIds.length > 0
          ? await supabase
              .from("orders")
              .select("id, source")
              .in("id", orderIds)
          : { data: [] as Array<{ id: string; source: string | null }> };
      const orderSourceMap = new Map(
        (orders ?? []).map((o) => [o.id, o.source])
      );
      const bySourceMap = new Map<string | null, number>();
      for (const t of tickets ?? []) {
        const src = orderSourceMap.get(t.order_id) ?? null;
        bySourceMap.set(src, (bySourceMap.get(src) ?? 0) + 1);
      }
      const bySource = Array.from(bySourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      data.demographics = {
        byCountry: byCountryRaw.map((r) => ({ code: r.key, count: r.count })),
        byGender: byGenderRaw.map((r) => ({ gender: r.key, count: r.count })),
        byOccupation: byOccupationRaw.map((r) => ({
          occupation: r.key,
          count: r.count,
        })),
        bySource,
      };
    }

    if (opts.sections.attendees) {
      const tierIds = Array.from(
        new Set((tickets ?? []).map((t) => t.tier_id))
      );
      const { data: tiers } =
        tierIds.length > 0
          ? await supabase
              .from("ticket_tiers")
              .select("id, name_en, name_de, name_fr")
              .in("id", tierIds)
          : { data: [] as Array<{ id: string; name_en: string; name_de: string; name_fr: string }> };
      const tierMap = new Map((tiers ?? []).map((t) => [t.id, t]));

      data.attendees = (tickets ?? [])
        .map((t) => {
          const tier = tierMap.get(t.tier_id);
          return {
            name: t.attendee_name ?? "",
            email: t.attendee_email ?? "",
            tier: tier
              ? (tier[`name_${loc}` as keyof typeof tier] as string) ||
                tier.name_en
              : "",
            checkedIn: !!t.checked_in_at,
            country: t.contact_id
              ? contactMap.get(t.contact_id)?.country ?? null
              : null,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return data;
}
