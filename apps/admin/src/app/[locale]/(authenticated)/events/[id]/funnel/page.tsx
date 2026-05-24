import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@dbc/supabase/server";
import {
  getEventFunnelCopy,
  getFaqsForEvent,
  getPillarsForEvent,
  getTestimonialsForEvent,
} from "@/actions/event-funnel-content";
import { PageHeader } from "@/components/page-header";
import { FunnelContentClient } from "./funnel-content-client";

export default async function EventFunnelAdminPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title_en")
    .eq("id", id)
    .single();
  if (!event) return notFound();

  const [copy, pillars, testimonials, faqs] = await Promise.all([
    getEventFunnelCopy(id),
    getPillarsForEvent(id),
    getTestimonialsForEvent(id),
    getFaqsForEvent(id),
  ]);

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
        title={`Funnel content · ${event.title_en}`}
        description="Edit hero video, tagline, intro, pillars, testimonials, FAQs, closing pitch and the scarcity threshold for this event."
      />
      <div className="mt-6">
        <FunnelContentClient
          eventId={id}
          locale={locale}
          copy={copy}
          pillars={pillars}
          testimonials={testimonials}
          faqs={faqs}
        />
      </div>
    </div>
  );
}
