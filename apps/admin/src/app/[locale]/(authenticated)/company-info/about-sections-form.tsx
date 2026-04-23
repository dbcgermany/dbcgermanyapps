"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Textarea } from "@dbc/ui";
import type { AboutSections } from "@dbc/types";
import {
  updateCompanyInfoAboutSections,
  type CompanyInfo,
} from "@/actions/company-info";

type LocaleKey = "en" | "de" | "fr";

// Flattened editor state — each locale is edited independently; on save
// we rebuild the AboutSections shape from these slices.
interface LocaleState {
  // mission
  missionTitle: string;
  missionBody: string;
  // story
  storyTitle: string;
  storyBody: string;
  // values
  valuesTitle: string;
  values: { title: string; desc: string }[];
  // metrics
  metrics: { value: string; label: string }[];
  // press
  pressTitle: string;
  press: { name: string; logoUrl: string; href: string }[];
  // finalCta
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaPrimaryCta: string;
  finalCtaPrimaryCtaHref: string;
}

function toLocaleState(raw: unknown): LocaleState {
  const a = (raw ?? {}) as Partial<AboutSections>;
  return {
    missionTitle: a.mission?.title ?? "",
    missionBody: a.mission?.body ?? "",
    storyTitle: a.story?.title ?? "",
    storyBody: a.story?.body ?? "",
    valuesTitle: a.values?.title ?? "",
    values: a.values?.items ? a.values.items.map((v) => ({ ...v })) : [],
    metrics: a.metrics?.items ? a.metrics.items.map((m) => ({ ...m })) : [],
    pressTitle: a.press?.title ?? "",
    press: a.press?.logos
      ? a.press.logos.map((p) => ({
          name: p.name,
          logoUrl: p.logoUrl,
          href: p.href ?? "",
        }))
      : [],
    finalCtaTitle: a.finalCta?.title ?? "",
    finalCtaSubtitle: a.finalCta?.subtitle ?? "",
    finalCtaPrimaryCta: a.finalCta?.primaryCta ?? "",
    finalCtaPrimaryCtaHref: a.finalCta?.primaryCtaHref ?? "",
  };
}

function fromLocaleState(s: LocaleState): Partial<AboutSections> {
  const out: Partial<AboutSections> = {};
  if (s.missionTitle.trim() && s.missionBody.trim()) {
    out.mission = { title: s.missionTitle, body: s.missionBody };
  }
  if (s.storyTitle.trim() && s.storyBody.trim()) {
    out.story = { title: s.storyTitle, body: s.storyBody };
  }
  const values = s.values.filter((v) => v.title.trim() || v.desc.trim());
  if (values.length > 0) {
    out.values = { title: s.valuesTitle || undefined, items: values };
  }
  const metrics = s.metrics.filter((m) => m.value.trim() || m.label.trim());
  if (metrics.length > 0) {
    out.metrics = { items: metrics };
  }
  const press = s.press.filter((p) => p.name.trim() || p.logoUrl.trim());
  if (press.length > 0) {
    out.press = {
      title: s.pressTitle || undefined,
      logos: press.map((p) => ({
        name: p.name,
        logoUrl: p.logoUrl,
        ...(p.href.trim() ? { href: p.href } : {}),
      })),
    };
  }
  if (s.finalCtaTitle.trim() && s.finalCtaPrimaryCta.trim() && s.finalCtaPrimaryCtaHref.trim()) {
    out.finalCta = {
      title: s.finalCtaTitle,
      subtitle: s.finalCtaSubtitle || undefined,
      primaryCta: s.finalCtaPrimaryCta,
      primaryCtaHref: s.finalCtaPrimaryCtaHref,
    };
  }
  return out;
}

const T = {
  en: {
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    heading: "About page sections",
    help:
      "Everything below appears on /about. Leave a section empty to hide it; fill the EN tab first — DE and FR fall back to EN on the public page when empty.",
    saving: "Saving…",
    save: "Save About sections",
    saved: "About sections saved.",
    mission: "Mission",
    missionTitleField: "Title",
    missionBodyField: "Body",
    story: "Story",
    storyTitleField: "Title",
    storyBodyField: "Body",
    values: "Values",
    valuesTitleField: "Section title (optional)",
    addValue: "Add value",
    valueTitle: "Title",
    valueDesc: "Description",
    metrics: "Numbers strip",
    addMetric: "Add metric",
    metricValue: "Value (e.g. 900)",
    metricLabel: "Label (e.g. seats · one day)",
    press: "Press / partner logos",
    pressTitleField: "Section title (optional)",
    addPress: "Add logo",
    pressName: "Name",
    pressLogoUrl: "Logo URL",
    pressHref: "Link URL (optional)",
    finalCta: "Final CTA band",
    finalCtaTitleField: "Title",
    finalCtaSubtitleField: "Subtitle (optional)",
    finalCtaPrimaryField: "Button label",
    finalCtaHrefField: "Button URL",
    remove: "Remove",
  },
  de: {
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    heading: "About-Seiten-Abschnitte",
    help:
      "Alles hier erscheint auf /about. Abschnitt leer lassen = wird ausgeblendet. EN zuerst ausfüllen — DE und FR fallen bei leeren Feldern auf EN zurück.",
    saving: "Wird gespeichert…",
    save: "About-Abschnitte speichern",
    saved: "About-Abschnitte gespeichert.",
    mission: "Mission",
    missionTitleField: "Titel",
    missionBodyField: "Text",
    story: "Geschichte",
    storyTitleField: "Titel",
    storyBodyField: "Text",
    values: "Werte",
    valuesTitleField: "Abschnittstitel (optional)",
    addValue: "Wert hinzufügen",
    valueTitle: "Titel",
    valueDesc: "Beschreibung",
    metrics: "Zahlen-Streifen",
    addMetric: "Kennzahl hinzufügen",
    metricValue: "Wert (z. B. 900)",
    metricLabel: "Label (z. B. Plätze · ein Tag)",
    press: "Presse / Partner-Logos",
    pressTitleField: "Abschnittstitel (optional)",
    addPress: "Logo hinzufügen",
    pressName: "Name",
    pressLogoUrl: "Logo-URL",
    pressHref: "Link-URL (optional)",
    finalCta: "Abschluss-CTA",
    finalCtaTitleField: "Titel",
    finalCtaSubtitleField: "Untertitel (optional)",
    finalCtaPrimaryField: "Button-Text",
    finalCtaHrefField: "Button-URL",
    remove: "Entfernen",
  },
  fr: {
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    heading: "Sections de la page À propos",
    help:
      "Tout ce qui suit apparaît sur /about. Laisser une section vide = masquée. Remplir EN d'abord — DE et FR retombent sur EN quand c'est vide.",
    saving: "Enregistrement…",
    save: "Enregistrer les sections",
    saved: "Sections À propos enregistrées.",
    mission: "Mission",
    missionTitleField: "Titre",
    missionBodyField: "Texte",
    story: "Histoire",
    storyTitleField: "Titre",
    storyBodyField: "Texte",
    values: "Valeurs",
    valuesTitleField: "Titre de section (optionnel)",
    addValue: "Ajouter une valeur",
    valueTitle: "Titre",
    valueDesc: "Description",
    metrics: "Bande de chiffres",
    addMetric: "Ajouter une métrique",
    metricValue: "Valeur (p. ex. 900)",
    metricLabel: "Libellé (p. ex. places · une journée)",
    press: "Presse / logos partenaires",
    pressTitleField: "Titre de section (optionnel)",
    addPress: "Ajouter un logo",
    pressName: "Nom",
    pressLogoUrl: "URL du logo",
    pressHref: "URL du lien (optionnel)",
    finalCta: "Bandeau CTA final",
    finalCtaTitleField: "Titre",
    finalCtaSubtitleField: "Sous-titre (optionnel)",
    finalCtaPrimaryField: "Libellé du bouton",
    finalCtaHrefField: "URL du bouton",
    remove: "Retirer",
  },
} as const;

export function AboutSectionsForm({
  info,
  locale,
}: {
  info: CompanyInfo;
  locale: string;
}) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = T[l];
  const [activeTab, setActiveTab] = useState<LocaleKey>("en");
  const [state, setState] = useState<Record<LocaleKey, LocaleState>>({
    en: toLocaleState(info.about_sections_en),
    de: toLocaleState(info.about_sections_de),
    fr: toLocaleState(info.about_sections_fr),
  });
  const [isPending, startTransition] = useTransition();

  function patch(k: LocaleKey, p: Partial<LocaleState>) {
    setState((s) => ({ ...s, [k]: { ...s[k], ...p } }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCompanyInfoAboutSections({
        en: fromLocaleState(state.en),
        de: fromLocaleState(state.de),
        fr: fromLocaleState(state.fr),
      });
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success(t.saved);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-semibold">{t.heading}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.help}</p>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-border">
        {(["en", "de", "fr"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={activeTab === k}
            onClick={() => setActiveTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === k
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      {(["en", "de", "fr"] as const).map((k) => (
        <div key={k} hidden={activeTab !== k} className="space-y-6">
          <LocaleSectionEditor
            t={t}
            value={state[k]}
            patch={(p) => patch(k, p)}
          />
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.save}
        </Button>
      </div>
    </form>
  );
}

type TCopy = (typeof T)[keyof typeof T];

function LocaleSectionEditor({
  t,
  value,
  patch,
}: {
  t: TCopy;
  value: LocaleState;
  patch: (p: Partial<LocaleState>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Mission */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.mission}</legend>
        <Labelled label={t.missionTitleField}>
          <Input
            value={value.missionTitle}
            onChange={(e) => patch({ missionTitle: e.target.value })}
          />
        </Labelled>
        <Labelled label={t.missionBodyField}>
          <Textarea
            rows={3}
            value={value.missionBody}
            onChange={(e) => patch({ missionBody: e.target.value })}
          />
        </Labelled>
      </Card>

      {/* Story */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.story}</legend>
        <Labelled label={t.storyTitleField}>
          <Input
            value={value.storyTitle}
            onChange={(e) => patch({ storyTitle: e.target.value })}
          />
        </Labelled>
        <Labelled label={t.storyBodyField}>
          <Textarea
            rows={5}
            value={value.storyBody}
            onChange={(e) => patch({ storyBody: e.target.value })}
          />
        </Labelled>
      </Card>

      {/* Values */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.values}</legend>
        <Labelled label={t.valuesTitleField}>
          <Input
            value={value.valuesTitle}
            onChange={(e) => patch({ valuesTitle: e.target.value })}
          />
        </Labelled>
        <div className="space-y-3">
          {value.values.map((v, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3 space-y-2"
            >
              <Input
                placeholder={t.valueTitle}
                value={v.title}
                onChange={(e) =>
                  patch({
                    values: value.values.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x
                    ),
                  })
                }
              />
              <Textarea
                rows={2}
                placeholder={t.valueDesc}
                value={v.desc}
                onChange={(e) =>
                  patch({
                    values: value.values.map((x, j) =>
                      j === i ? { ...x, desc: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({ values: value.values.filter((_, j) => j !== i) })
                }
                className="text-xs text-red-500 hover:text-red-700"
              >
                {t.remove}
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              patch({
                values: [...value.values, { title: "", desc: "" }],
              })
            }
          >
            {t.addValue}
          </Button>
        </div>
      </Card>

      {/* Metrics */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.metrics}</legend>
        <div className="space-y-3">
          {value.metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3 grid grid-cols-[140px_1fr_auto] gap-2 items-center"
            >
              <Input
                placeholder={t.metricValue}
                value={m.value}
                onChange={(e) =>
                  patch({
                    metrics: value.metrics.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x
                    ),
                  })
                }
              />
              <Input
                placeholder={t.metricLabel}
                value={m.label}
                onChange={(e) =>
                  patch({
                    metrics: value.metrics.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({ metrics: value.metrics.filter((_, j) => j !== i) })
                }
                className="text-xs text-red-500 hover:text-red-700"
              >
                {t.remove}
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              patch({
                metrics: [...value.metrics, { value: "", label: "" }],
              })
            }
          >
            {t.addMetric}
          </Button>
        </div>
      </Card>

      {/* Press */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.press}</legend>
        <Labelled label={t.pressTitleField}>
          <Input
            value={value.pressTitle}
            onChange={(e) => patch({ pressTitle: e.target.value })}
          />
        </Labelled>
        <div className="space-y-3">
          {value.press.map((p, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3 space-y-2"
            >
              <Input
                placeholder={t.pressName}
                value={p.name}
                onChange={(e) =>
                  patch({
                    press: value.press.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x
                    ),
                  })
                }
              />
              <Input
                type="url"
                placeholder={t.pressLogoUrl}
                value={p.logoUrl}
                onChange={(e) =>
                  patch({
                    press: value.press.map((x, j) =>
                      j === i ? { ...x, logoUrl: e.target.value } : x
                    ),
                  })
                }
              />
              <Input
                type="url"
                placeholder={t.pressHref}
                value={p.href}
                onChange={(e) =>
                  patch({
                    press: value.press.map((x, j) =>
                      j === i ? { ...x, href: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({ press: value.press.filter((_, j) => j !== i) })
                }
                className="text-xs text-red-500 hover:text-red-700"
              >
                {t.remove}
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              patch({
                press: [
                  ...value.press,
                  { name: "", logoUrl: "", href: "" },
                ],
              })
            }
          >
            {t.addPress}
          </Button>
        </div>
      </Card>

      {/* Final CTA */}
      <Card padding="md" className="space-y-3">
        <legend className="text-sm font-semibold">{t.finalCta}</legend>
        <Labelled label={t.finalCtaTitleField}>
          <Input
            value={value.finalCtaTitle}
            onChange={(e) => patch({ finalCtaTitle: e.target.value })}
          />
        </Labelled>
        <Labelled label={t.finalCtaSubtitleField}>
          <Textarea
            rows={2}
            value={value.finalCtaSubtitle}
            onChange={(e) => patch({ finalCtaSubtitle: e.target.value })}
          />
        </Labelled>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Labelled label={t.finalCtaPrimaryField}>
            <Input
              value={value.finalCtaPrimaryCta}
              onChange={(e) => patch({ finalCtaPrimaryCta: e.target.value })}
            />
          </Labelled>
          <Labelled label={t.finalCtaHrefField}>
            <Input
              type="url"
              value={value.finalCtaPrimaryCtaHref}
              onChange={(e) => patch({ finalCtaPrimaryCtaHref: e.target.value })}
            />
          </Labelled>
        </div>
      </Card>
    </div>
  );
}

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
