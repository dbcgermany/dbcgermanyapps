import { SpeakerCard, type SpeakerCardData } from "./speaker-card";

export function FeaturedSpeakersStrip({
  speakers,
  hrefBase,
  eyebrow,
  title,
  viewLabel,
}: {
  speakers: SpeakerCardData[];
  hrefBase: string;
  eyebrow: string;
  title: string;
  viewLabel: string;
}) {
  if (speakers.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-6xl px-5 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {speakers.slice(0, 4).map((speaker, i) => (
          <SpeakerCard
            key={speaker.slug}
            speaker={speaker}
            hrefBase={hrefBase}
            viewLabel={viewLabel}
            revealDelay={i * 60}
          />
        ))}
      </div>
    </section>
  );
}
