import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import { ContactForm } from "./contact-form";
import { getCompanyInfo, formatOfficeAddress } from "@dbc/legal";

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
  const company = await getCompanyInfo();
  const officeAddress = formatOfficeAddress(company);
  const brandName = company?.brand_name ?? "DBC Germany";
  const phoneLabel = locale === "de" ? "Telefon" : locale === "fr" ? "Téléphone" : "Phone";
  const hoursLabel = locale === "de" ? "Öffnungszeiten" : locale === "fr" ? "Horaires" : "Office hours";
  const supportLabel = locale === "de" ? "Support" : locale === "fr" ? "Support" : "Support";
  const pressLabel = locale === "de" ? "Presse" : "Press";

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
        <Reveal>
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
            {officeAddress && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("office")}
                </p>
                <p className="mt-1 whitespace-pre-line text-base">
                  {brandName}
                  {"\n"}
                  {officeAddress}
                </p>
              </div>
            )}
            {company?.office_hours && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {hoursLabel}
                </p>
                <p className="mt-1 text-base">{company.office_hours}</p>
              </div>
            )}
            {company?.phone && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {phoneLabel}
                </p>
                <a
                  href={`tel:${company.phone.replace(/\s/g, "")}`}
                  className="mt-1 inline-block text-base text-primary hover:text-primary/80"
                >
                  {company.phone}
                </a>
              </div>
            )}
            {company?.primary_email && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </p>
                <a
                  href={`mailto:${company.primary_email}`}
                  className="mt-1 inline-block text-base text-primary hover:text-primary/80"
                >
                  {company.primary_email}
                </a>
              </div>
            )}
            {company?.support_email &&
              company.support_email !== company.primary_email && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {supportLabel}
                  </p>
                  <a
                    href={`mailto:${company.support_email}`}
                    className="mt-1 inline-block text-base text-primary hover:text-primary/80"
                  >
                    {company.support_email}
                  </a>
                </div>
              )}
            {company?.press_email && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pressLabel}
                </p>
                <a
                  href={`mailto:${company.press_email}`}
                  className="mt-1 inline-block text-base text-primary hover:text-primary/80"
                >
                  {company.press_email}
                </a>
              </div>
            )}
          </div>
        </div>
        </Reveal>

        <Reveal delay={80}>
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
        </Reveal>
      </div>
    </div>
  );
}
