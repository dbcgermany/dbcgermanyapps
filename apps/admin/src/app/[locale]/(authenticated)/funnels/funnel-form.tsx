"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@dbc/ui";
import {
  FUNNEL_CTA_TYPES,
  FUNNEL_STATUS_VALUES,
  type FunnelContent,
  type FunnelCtaType,
  type FunnelStatus,
} from "@dbc/types";
import {
  createFunnel,
  updateFunnel,
  uploadFunnelHeroImage,
  type FunnelInput,
  type FunnelRow,
} from "@/actions/funnels";

type TabKey = "en" | "de" | "fr";

type Benefit = { key: string; title: string; desc: string };
type FaqItem = { q: string; a: string };

type LocaleContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  benefitsEyebrow: string;
  benefitsTitle: string;
  benefits: Benefit[];
  faqTitle: string;
  faq: FaqItem[];
  footerCtaText: string;
  footerCtaEmail: string;
};

type FormState = {
  slug: string;
  status: FunnelStatus;
  cta_type: FunnelCtaType;
  cta_href: string;
  hero_image_url: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  content: Record<TabKey, LocaleContent>;
};

const EMPTY_LOCALE: LocaleContent = {
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  heroPrimaryCta: "",
  benefitsEyebrow: "",
  benefitsTitle: "",
  benefits: [],
  faqTitle: "",
  faq: [],
  footerCtaText: "",
  footerCtaEmail: "",
};

function toLocaleContent(c: Partial<FunnelContent> | null | undefined): LocaleContent {
  if (!c) return { ...EMPTY_LOCALE };
  return {
    heroEyebrow: c.hero?.eyebrow ?? "",
    heroTitle: c.hero?.title ?? "",
    heroSubtitle: c.hero?.subtitle ?? "",
    heroPrimaryCta: c.hero?.primaryCta ?? "",
    benefitsEyebrow: c.benefits?.eyebrow ?? "",
    benefitsTitle: c.benefits?.title ?? "",
    benefits: c.benefits?.items ? c.benefits.items.map((b) => ({ ...b })) : [],
    faqTitle: c.faq?.title ?? "",
    faq: c.faq?.items ? c.faq.items.map((f) => ({ ...f })) : [],
    footerCtaText: c.footerCta?.text ?? "",
    footerCtaEmail: c.footerCta?.email ?? "",
  };
}

function fromLocaleContent(l: LocaleContent): Partial<FunnelContent> {
  const out: Partial<FunnelContent> = {};
  if (l.heroTitle || l.heroEyebrow || l.heroSubtitle || l.heroPrimaryCta) {
    out.hero = {
      eyebrow: l.heroEyebrow || undefined,
      title: l.heroTitle,
      subtitle: l.heroSubtitle || undefined,
      primaryCta: l.heroPrimaryCta,
    };
  }
  const benefits = l.benefits.filter((b) => b.title.trim() || b.desc.trim());
  if (benefits.length > 0) {
    out.benefits = {
      eyebrow: l.benefitsEyebrow || undefined,
      title: l.benefitsTitle || undefined,
      items: benefits.map((b, i) => ({
        key: b.key || `b${i + 1}`,
        title: b.title,
        desc: b.desc,
      })),
    };
  }
  const faq = l.faq.filter((f) => f.q.trim() || f.a.trim());
  if (faq.length > 0) {
    out.faq = {
      title: l.faqTitle || "",
      items: faq,
    };
  }
  if (l.footerCtaText.trim() && l.footerCtaEmail.trim()) {
    out.footerCta = { text: l.footerCtaText, email: l.footerCtaEmail };
  }
  return out;
}

const T = {
  en: {
    saved: "Saved.",
    sectionBasics: "Basics",
    slug: "Slug",
    slugHelp: "URL-safe identifier. The funnel lives at /f/{slug}.",
    status: "Status",
    statusValues: { draft: "Draft", published: "Published", archived: "Archived" },
    ctaType: "CTA type",
    ctaTypeValues: {
      external_link: "External link (e.g. tickets page)",
      incubation_wizard: "Incubation application wizard",
      contact_form: "Contact form (lead capture)",
    },
    ctaHref: "CTA URL",
    ctaHrefHelp: "Where the primary CTA sends the visitor. Used only for External link.",
    heroImage: "Hero image",
    heroImageHelp: "Optional. Appears behind or beside the hero copy.",
    seo: "SEO",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    ogImage: "Social share image URL",
    contentHeading: "Content",
    contentHint: "EN is required. DE and FR fall back to EN if left empty.",
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    hero: "Hero",
    heroEyebrow: "Eyebrow",
    heroTitle: "Title",
    heroSubtitle: "Subtitle",
    heroPrimaryCta: "Primary CTA label",
    benefits: "Benefits",
    benefitsEyebrow: "Benefits eyebrow",
    benefitsTitle: "Benefits title",
    addBenefit: "Add benefit",
    benefitKey: "Key",
    benefitTitle: "Title",
    benefitDesc: "Description",
    faq: "FAQ",
    faqTitle: "FAQ title",
    addFaq: "Add question",
    faqQ: "Question",
    faqA: "Answer",
    footerCta: "Footer CTA",
    footerCtaText: "Footer text",
    footerCtaEmail: "Footer email",
    remove: "Remove",
    save: "Save",
    saving: "Saving…",
    upload: "Upload",
    uploading: "Uploading…",
    pasteUrl: "or paste URL",
    remove_short: "Clear",
  },
  de: {
    saved: "Gespeichert.",
    sectionBasics: "Grundlagen",
    slug: "Slug",
    slugHelp: "URL-Kennung. Der Funnel lebt unter /f/{slug}.",
    status: "Status",
    statusValues: { draft: "Entwurf", published: "Veröffentlicht", archived: "Archiviert" },
    ctaType: "CTA-Typ",
    ctaTypeValues: {
      external_link: "Externer Link (z. B. Tickets)",
      incubation_wizard: "Bewerbungs-Wizard",
      contact_form: "Kontaktformular",
    },
    ctaHref: "CTA-URL",
    ctaHrefHelp: "Ziel des Haupt-CTA. Nur für externen Link verwendet.",
    heroImage: "Hero-Bild",
    heroImageHelp: "Optional. Erscheint hinter oder neben dem Hero-Text.",
    seo: "SEO",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    ogImage: "Social-Share-Bild (URL)",
    contentHeading: "Inhalt",
    contentHint: "EN ist Pflicht. DE und FR greifen auf EN zurück, wenn leer.",
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    hero: "Hero",
    heroEyebrow: "Eyebrow",
    heroTitle: "Titel",
    heroSubtitle: "Untertitel",
    heroPrimaryCta: "CTA-Beschriftung",
    benefits: "Vorteile",
    benefitsEyebrow: "Vorteile-Eyebrow",
    benefitsTitle: "Vorteile-Titel",
    addBenefit: "Vorteil hinzufügen",
    benefitKey: "Key",
    benefitTitle: "Titel",
    benefitDesc: "Beschreibung",
    faq: "FAQ",
    faqTitle: "FAQ-Titel",
    addFaq: "Frage hinzufügen",
    faqQ: "Frage",
    faqA: "Antwort",
    footerCta: "Footer-CTA",
    footerCtaText: "Footer-Text",
    footerCtaEmail: "Footer-E-Mail",
    remove: "Entfernen",
    save: "Speichern",
    saving: "Wird gespeichert…",
    upload: "Hochladen",
    uploading: "Lädt…",
    pasteUrl: "oder URL einfügen",
    remove_short: "Leeren",
  },
  fr: {
    saved: "Enregistré.",
    sectionBasics: "Général",
    slug: "Slug",
    slugHelp: "Identifiant URL. Le funnel vit sur /f/{slug}.",
    status: "Statut",
    statusValues: { draft: "Brouillon", published: "Publié", archived: "Archivé" },
    ctaType: "Type de CTA",
    ctaTypeValues: {
      external_link: "Lien externe (p. ex. billetterie)",
      incubation_wizard: "Wizard de candidature",
      contact_form: "Formulaire de contact",
    },
    ctaHref: "URL du CTA",
    ctaHrefHelp: "Où le CTA envoie le visiteur. Uniquement pour Lien externe.",
    heroImage: "Image hero",
    heroImageHelp: "Optionnel. Apparaît derrière ou à côté du texte hero.",
    seo: "SEO",
    seoTitle: "Titre SEO",
    seoDescription: "Description SEO",
    ogImage: "Image de partage social (URL)",
    contentHeading: "Contenu",
    contentHint: "EN est obligatoire. DE et FR retombent sur EN si vides.",
    tabs: { en: "English", de: "Deutsch", fr: "Français" },
    hero: "Hero",
    heroEyebrow: "Eyebrow",
    heroTitle: "Titre",
    heroSubtitle: "Sous-titre",
    heroPrimaryCta: "Libellé du CTA",
    benefits: "Bénéfices",
    benefitsEyebrow: "Eyebrow bénéfices",
    benefitsTitle: "Titre bénéfices",
    addBenefit: "Ajouter un bénéfice",
    benefitKey: "Clé",
    benefitTitle: "Titre",
    benefitDesc: "Description",
    faq: "FAQ",
    faqTitle: "Titre FAQ",
    addFaq: "Ajouter une question",
    faqQ: "Question",
    faqA: "Réponse",
    footerCta: "CTA pied de page",
    footerCtaText: "Texte",
    footerCtaEmail: "E-mail",
    remove: "Retirer",
    save: "Enregistrer",
    saving: "Enregistrement…",
    upload: "Envoyer",
    uploading: "Envoi…",
    pasteUrl: "ou coller l’URL",
    remove_short: "Vider",
  },
} as const;

type FormProps =
  | {
      mode: "create";
      locale: string;
      initial?: undefined;
    }
  | {
      mode: "edit";
      locale: string;
      initial: FunnelRow;
    };

export function FunnelForm(props: FormProps) {
  const router = useRouter();
  const t = T[(props.locale === "de" || props.locale === "fr" ? props.locale : "en") as keyof typeof T];

  const [state, setState] = useState<FormState>(() => buildInitialState(props));
  const [activeTab, setActiveTab] = useState<TabKey>("en");
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function setBasics<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function patchContent(locale: TabKey, patch: Partial<LocaleContent>) {
    setState((s) => ({
      ...s,
      content: { ...s.content, [locale]: { ...s.content[locale], ...patch } },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const input: FunnelInput = {
      slug: state.slug,
      status: state.status,
      cta_type: state.cta_type,
      cta_href: state.cta_type === "external_link" ? state.cta_href.trim() || null : null,
      hero_image_url: state.hero_image_url.trim() || null,
      content_en: fromLocaleContent(state.content.en),
      content_de: fromLocaleContent(state.content.de),
      content_fr: fromLocaleContent(state.content.fr),
      seo_title: state.seo_title.trim() || null,
      seo_description: state.seo_description.trim() || null,
      og_image_url: state.og_image_url.trim() || null,
    };
    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await createFunnel(input)
          : await updateFunnel(props.initial.id, input);
      if ("error" in result && result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: t.saved });
      if (props.mode === "create" && "id" in result && result.id) {
        router.push(`/${props.locale}/funnels/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      {message && (
        <div
          className={`rounded-md p-4 text-sm ${
            message.kind === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Basics ── */}
      <Card padding="md" className="space-y-5">
        <h2 className="font-heading text-lg font-semibold">{t.sectionBasics}</h2>

        <Field label={t.slug} hint={t.slugHelp}>
          <Input
            value={state.slug}
            onChange={(e) => setBasics("slug", e.target.value)}
            className="font-mono"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t.status}>
            <Select
              value={state.status}
              onChange={(e) => setBasics("status", e.target.value as FunnelStatus)}
            >
              {FUNNEL_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {t.statusValues[s]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t.ctaType}>
            <Select
              value={state.cta_type}
              onChange={(e) => setBasics("cta_type", e.target.value as FunnelCtaType)}
            >
              {FUNNEL_CTA_TYPES.map((c) => (
                <option key={c} value={c}>
                  {t.ctaTypeValues[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {state.cta_type === "external_link" && (
          <Field label={t.ctaHref} hint={t.ctaHrefHelp}>
            <Input
              type="url"
              value={state.cta_href}
              placeholder="https://tickets.dbc-germany.com/…"
              onChange={(e) => setBasics("cta_href", e.target.value)}
            />
          </Field>
        )}

        <HeroImagePicker
          urlValue={state.hero_image_url}
          onChange={(v) => setBasics("hero_image_url", v)}
          label={t.heroImage}
          help={t.heroImageHelp}
          upload={t.upload}
          uploading={t.uploading}
          pasteUrl={t.pasteUrl}
          clearLabel={t.remove_short}
        />
      </Card>

      {/* ── SEO ── */}
      <Card padding="md" className="space-y-5">
        <h2 className="font-heading text-lg font-semibold">{t.seo}</h2>
        <Field label={t.seoTitle}>
          <Input
            value={state.seo_title}
            onChange={(e) => setBasics("seo_title", e.target.value)}
          />
        </Field>
        <Field label={t.seoDescription}>
          <Textarea
            rows={2}
            value={state.seo_description}
            onChange={(e) => setBasics("seo_description", e.target.value)}
          />
        </Field>
        <Field label={t.ogImage}>
          <Input
            type="url"
            value={state.og_image_url}
            onChange={(e) => setBasics("og_image_url", e.target.value)}
          />
        </Field>
      </Card>

      {/* ── Content ── */}
      <Card padding="md" className="space-y-5">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t.contentHeading}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t.contentHint}</p>
        </div>
        <div role="tablist" className="flex gap-2 border-b border-border">
          {(["en", "de", "fr"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={activeTab === k}
              onClick={() => setActiveTab(k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
            <LocaleTab
              locale={k}
              content={state.content[k]}
              required={k === "en"}
              patch={(p) => patchContent(k, p)}
              t={t}
            />
          </div>
        ))}
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? t.saving : t.save}
      </Button>
    </form>
  );
}

function buildInitialState(props: FormProps): FormState {
  if (props.mode === "edit") {
    const row = props.initial;
    return {
      slug: row.slug,
      status: row.status,
      cta_type: row.cta_type,
      cta_href: row.cta_href ?? "",
      hero_image_url: row.hero_image_url ?? "",
      seo_title: row.seo_title ?? "",
      seo_description: row.seo_description ?? "",
      og_image_url: row.og_image_url ?? "",
      content: {
        en: toLocaleContent(row.content_en),
        de: toLocaleContent(row.content_de),
        fr: toLocaleContent(row.content_fr),
      },
    };
  }
  return {
    slug: "",
    status: "draft",
    cta_type: "external_link",
    cta_href: "",
    hero_image_url: "",
    seo_title: "",
    seo_description: "",
    og_image_url: "",
    content: {
      en: { ...EMPTY_LOCALE },
      de: { ...EMPTY_LOCALE },
      fr: { ...EMPTY_LOCALE },
    },
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function HeroImagePicker({
  urlValue,
  onChange,
  label,
  help,
  upload,
  uploading,
  pasteUrl,
  clearLabel,
}: {
  urlValue: string;
  onChange: (v: string) => void;
  label: string;
  help: string;
  upload: string;
  uploading: string;
  pasteUrl: string;
  clearLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const result = await uploadFunnelHeroImage(fd);
      if (result.success) onChange(result.url);
      else setError(result.error ?? "Upload failed");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <Input
        type="url"
        value={urlValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pasteUrl}
      />
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={isUploading}
          aria-label={upload}
          className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
        />
        {isUploading && <span className="text-xs text-muted-foreground">{uploading}</span>}
        {urlValue && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-500 hover:text-red-700"
          >
            {clearLabel}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {urlValue && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlValue}
          alt=""
          className="h-36 w-auto rounded-md border border-border object-cover"
        />
      )}
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
}

type Tt = (typeof T)[keyof typeof T];

function LocaleTab({
  locale,
  content,
  required,
  patch,
  t,
}: {
  locale: TabKey;
  content: LocaleContent;
  required: boolean;
  patch: (p: Partial<LocaleContent>) => void;
  t: Tt;
}) {
  // Keep a stable reference to `patch` so nested lists don't trigger re-renders.
  // (Parent FunnelForm already stable-binds it to state slice.)
  return (
    <div className="space-y-6">
      {/* Hero */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">{t.hero}</legend>
        <Field label={t.heroEyebrow}>
          <Input
            value={content.heroEyebrow}
            onChange={(e) => patch({ heroEyebrow: e.target.value })}
          />
        </Field>
        <Field label={t.heroTitle}>
          <Input
            value={content.heroTitle}
            required={required}
            onChange={(e) => patch({ heroTitle: e.target.value })}
          />
        </Field>
        <Field label={t.heroSubtitle}>
          <Textarea
            rows={2}
            value={content.heroSubtitle}
            onChange={(e) => patch({ heroSubtitle: e.target.value })}
          />
        </Field>
        <Field label={t.heroPrimaryCta}>
          <Input
            value={content.heroPrimaryCta}
            required={required}
            onChange={(e) => patch({ heroPrimaryCta: e.target.value })}
          />
        </Field>
      </fieldset>

      {/* Benefits */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">{t.benefits}</legend>
        <Field label={t.benefitsEyebrow}>
          <Input
            value={content.benefitsEyebrow}
            onChange={(e) => patch({ benefitsEyebrow: e.target.value })}
          />
        </Field>
        <Field label={t.benefitsTitle}>
          <Input
            value={content.benefitsTitle}
            onChange={(e) => patch({ benefitsTitle: e.target.value })}
          />
        </Field>

        <div className="space-y-3">
          {content.benefits.map((b, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3 space-y-2"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr]">
                <Input
                  value={b.key}
                  placeholder={t.benefitKey}
                  onChange={(e) =>
                    patch({
                      benefits: content.benefits.map((x, j) =>
                        j === i ? { ...x, key: e.target.value } : x
                      ),
                    })
                  }
                />
                <Input
                  value={b.title}
                  placeholder={t.benefitTitle}
                  onChange={(e) =>
                    patch({
                      benefits: content.benefits.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x
                      ),
                    })
                  }
                />
              </div>
              <Textarea
                rows={2}
                value={b.desc}
                placeholder={t.benefitDesc}
                onChange={(e) =>
                  patch({
                    benefits: content.benefits.map((x, j) =>
                      j === i ? { ...x, desc: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({
                    benefits: content.benefits.filter((_, j) => j !== i),
                  })
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
                benefits: [
                  ...content.benefits,
                  { key: `b${content.benefits.length + 1}`, title: "", desc: "" },
                ],
              })
            }
          >
            {t.addBenefit}
          </Button>
        </div>
      </fieldset>

      {/* FAQ */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">{t.faq}</legend>
        <Field label={t.faqTitle}>
          <Input
            value={content.faqTitle}
            onChange={(e) => patch({ faqTitle: e.target.value })}
          />
        </Field>
        <div className="space-y-3">
          {content.faq.map((f, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3 space-y-2"
            >
              <Input
                value={f.q}
                placeholder={t.faqQ}
                onChange={(e) =>
                  patch({
                    faq: content.faq.map((x, j) =>
                      j === i ? { ...x, q: e.target.value } : x
                    ),
                  })
                }
              />
              <Textarea
                rows={3}
                value={f.a}
                placeholder={t.faqA}
                onChange={(e) =>
                  patch({
                    faq: content.faq.map((x, j) =>
                      j === i ? { ...x, a: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({ faq: content.faq.filter((_, j) => j !== i) })
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
              patch({ faq: [...content.faq, { q: "", a: "" }] })
            }
          >
            {t.addFaq}
          </Button>
        </div>
      </fieldset>

      {/* Footer CTA */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">{t.footerCta}</legend>
        <Field label={t.footerCtaText}>
          <Input
            value={content.footerCtaText}
            onChange={(e) => patch({ footerCtaText: e.target.value })}
          />
        </Field>
        <Field label={t.footerCtaEmail}>
          <Input
            type="email"
            value={content.footerCtaEmail}
            onChange={(e) => patch({ footerCtaEmail: e.target.value })}
          />
        </Field>
      </fieldset>

      <input type="hidden" value={locale} readOnly />
    </div>
  );
}
