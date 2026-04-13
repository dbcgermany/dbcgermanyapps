import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.contact" });

  const topicOptions = [
    { value: "general", label: t("topicOptions.general") },
    { value: "incubation", label: t("topicOptions.incubation") },
    { value: "investment", label: t("topicOptions.investment") },
    { value: "mentorship", label: t("topicOptions.mentorship") },
    { value: "partnership", label: t("topicOptions.partnership") },
    { value: "press", label: t("topicOptions.press") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="grid gap-12 md:grid-cols-[2fr_3fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t("subtitle")}
          </p>

          <div className="mt-10 space-y-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("office")}
              </p>
              <p className="mt-1 text-base">
                DBC Germany
                <br />
                Speditionstraße 15a
                <br />
                40221 Düsseldorf
                <br />
                Deutschland
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === "de" ? "Telefon" : locale === "fr" ? "Téléphone" : "Phone"}
              </p>
              <a
                href="tel:+4916314895470"
                className="mt-1 inline-block text-base text-primary hover:text-primary/80"
              >
                +49 163 148 95 47
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <a
                href="mailto:info@dbc-germany.com"
                className="mt-1 inline-block text-base text-primary hover:text-primary/80"
              >
                info@dbc-germany.com
              </a>
            </div>
          </div>
        </div>

        <div>
          <ContactForm
            locale={locale}
            labels={{
              name: t("nameLabel"),
              email: t("emailLabel"),
              topic: t("topicLabel"),
              message: t("messageLabel"),
              submit: t("submit"),
              submitting: t("submitting"),
              success: t("success"),
              error: t("error"),
              emailDirect: t("emailDirect"),
            }}
            topicOptions={topicOptions}
          />
        </div>
      </div>
    </div>
  );
}
