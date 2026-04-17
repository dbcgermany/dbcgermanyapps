import { getTranslations } from "next-intl/server";
import { Card as SharedCard } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@dbc/supabase/server";
import {
  Building2,
  Briefcase,
  Globe,
  Layers,
  Mail,
  ExternalLink,
} from "lucide-react";

const NARIKIA_WEBSITE_URL = "https://narikia.com";
const NARIKIA_CONTACT_EMAIL = "contact@narikia.com";

export default async function DevInfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("super_admin");
  const t = await getTranslations({ locale, namespace: "admin.devInfo" });

  const services = t.raw("services.items") as string[];
  const stackItems = t.raw("stack.items") as string[];
  const legalName = t("about.legalName");

  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <PageHeader title={t("pageTitle")} description={t("pageSub")} className="mt-2" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DevCard icon={Building2} title={t("about.title")}>
          <p>
            {t("about.intro", { name: legalName })}
          </p>
          <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t("about.foundersLabel")}</dt>
            <dd>
              {t("about.founderGeraldName")} &middot;{" "}
              {t("about.founderGeraldRole")}
              <br />
              {t("about.founderFannyName")} &middot;{" "}
              {t("about.founderFannyRole")}
            </dd>
            <dt className="text-muted-foreground">{t("about.hqLabel")}</dt>
            <dd>{t("about.hqValue")}</dd>
            <dt className="text-muted-foreground">{t("about.foundedLabel")}</dt>
            <dd>{t("about.foundedValue")}</dd>
            <dt className="text-muted-foreground">{t("about.hrbLabel")}</dt>
            <dd>{t("about.hrbValue")}</dd>
          </dl>
          <p className="mt-4 text-sm italic text-muted-foreground">
            {t("about.mission")}
          </p>
        </DevCard>

        <DevCard icon={Briefcase} title={t("services.title")}>
          <ul className="grid gap-2 text-sm">
            {services.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </DevCard>

        <DevCard icon={Mail} title={t("contact.title")}>
          <div className="space-y-3 text-sm">
            <p>
              <a
                href={NARIKIA_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                {t("contact.website")}
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("contact.emailLabel")}:{" "}
              </span>
              <a
                href={`mailto:${NARIKIA_CONTACT_EMAIL}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {NARIKIA_CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-muted-foreground">{t("contact.note")}</p>
          </div>
        </DevCard>

        <DevCard icon={Layers} title={t("stack.title")}>
          <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            {stackItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("stack.deploymentNote")}
          </p>
        </DevCard>
      </div>

      <SharedCard padding="sm" className="mt-8 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Globe className="h-4 w-4" strokeWidth={1.75} />
          <span>
            {t("footer")}{" "}
            <a
              href={NARIKIA_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary"
            >
              Narikia UG
            </a>
            .
          </span>
        </p>
      </SharedCard>
    </div>
  );
}

function DevCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SharedCard padding="md">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 className="font-heading text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-4 text-sm text-foreground/90">{children}</div>
    </SharedCard>
  );
}
