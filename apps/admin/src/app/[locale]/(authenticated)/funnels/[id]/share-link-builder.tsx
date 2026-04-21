"use client";

import { useMemo, useState } from "react";
import { Card, Input, Select } from "@dbc/ui";
import { LOCALES } from "@dbc/types";

const T = {
  en: {
    help: "Build a tracked share link. The UTM params feed the KPI cards above.",
    targetLocale: "Target locale",
    utmSource: "utm_source",
    utmMedium: "utm_medium",
    utmCampaign: "utm_campaign",
    presets: "Presets",
    resultLabel: "Share URL",
    copy: "Copy",
    copied: "Copied",
  },
  de: {
    help: "Erzeuge einen getrackten Share-Link. Die UTM-Parameter speisen die KPI-Kacheln oben.",
    targetLocale: "Ziel-Sprache",
    utmSource: "utm_source",
    utmMedium: "utm_medium",
    utmCampaign: "utm_campaign",
    presets: "Voreinstellungen",
    resultLabel: "Share-URL",
    copy: "Kopieren",
    copied: "Kopiert",
  },
  fr: {
    help: "Génère un lien de partage tracké. Les paramètres UTM alimentent les KPI ci-dessus.",
    targetLocale: "Langue cible",
    utmSource: "utm_source",
    utmMedium: "utm_medium",
    utmCampaign: "utm_campaign",
    presets: "Préréglages",
    resultLabel: "URL de partage",
    copy: "Copier",
    copied: "Copié",
  },
} as const;

type Preset = {
  id: string;
  label: string;
  source: string;
  medium: string;
};

const PRESETS: Preset[] = [
  { id: "ig_story", label: "Instagram story", source: "instagram", medium: "story" },
  { id: "ig_bio", label: "Instagram bio", source: "instagram", medium: "bio" },
  { id: "linkedin_post", label: "LinkedIn post", source: "linkedin", medium: "post" },
  { id: "tiktok_bio", label: "TikTok bio", source: "tiktok", medium: "bio" },
  { id: "whatsapp", label: "WhatsApp broadcast", source: "whatsapp", medium: "broadcast" },
  { id: "email", label: "Email newsletter", source: "newsletter", medium: "email" },
];

const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://dbc-germany.com";

export function ShareLinkBuilder({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [targetLocale, setTargetLocale] = useState<string>(locale);
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState(slug);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const u = new URL(`${SITE_BASE}/${targetLocale}/f/${slug}`);
    if (source.trim()) u.searchParams.set("utm_source", source.trim());
    if (medium.trim()) u.searchParams.set("utm_medium", medium.trim());
    if (campaign.trim()) u.searchParams.set("utm_campaign", campaign.trim());
    return u.toString();
  }, [targetLocale, slug, source, medium, campaign]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card padding="md" className="space-y-4">
      <p className="text-xs text-muted-foreground">{t.help}</p>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground self-center">
          {t.presets}:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSource(p.source);
              setMedium(p.medium);
            }}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium">{t.targetLocale}</label>
          <Select
            value={targetLocale}
            onChange={(e) => setTargetLocale(e.target.value)}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t.utmSource}</label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="instagram"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t.utmMedium}</label>
          <Input
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            placeholder="story"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t.utmCampaign}</label>
          <Input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">{t.resultLabel}</label>
        <div className="flex gap-2">
          <Input value={url} readOnly className="font-mono text-xs" />
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
    </Card>
  );
}
