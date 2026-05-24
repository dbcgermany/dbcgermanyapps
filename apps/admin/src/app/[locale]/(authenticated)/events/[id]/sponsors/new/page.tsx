import { PageHeader } from "@/components/page-header";
import { SponsorForm } from "../sponsor-form";
import { pickSponsorT } from "../copy";

export default async function NewSponsorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = pickSponsorT(locale);
  const sponsorsListPath = `/${locale}/events/${eventId}/sponsors`;

  return (
    <div>
      <PageHeader
        back={{ href: sponsorsListPath, label: t.backToSponsors }}
        title={t.newSponsorTitle}
      />

      <div className="mt-8 max-w-3xl">
        <SponsorForm
          mode="create"
          eventId={eventId}
          locale={locale}
          successPath={sponsorsListPath}
          t={t}
        />
      </div>
    </div>
  );
}
