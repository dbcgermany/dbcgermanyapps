import { requireRole } from "@dbc/supabase/server";
import { getRecentWebhooks, getSiteSettings } from "@/actions/settings";
import { SettingsClient } from "./settings-client";
import { SiteSettingsForm } from "./site-settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole("admin");
  const [webhooks, siteSettings] = await Promise.all([
    getRecentWebhooks(50),
    getSiteSettings(),
  ]);

  return (
    <div className="p-8 space-y-10">
      <h1 className="font-heading text-2xl font-bold">
        {locale === "de"
          ? "Einstellungen"
          : locale === "fr"
            ? "Param\u00e8tres"
            : "Settings"}
      </h1>

      {siteSettings && (
        <SiteSettingsForm locale={locale} initial={siteSettings} />
      )}

      <SettingsClient
        locale={locale}
        role={user.role}
        webhooks={webhooks}
        ratePerEmail={parseInt(
          process.env.MAX_ORDERS_PER_EMAIL_PER_EVENT ?? "3",
          10
        )}
        turnstileEnabled={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
        supabaseRegion={process.env.SUPABASE_REGION ?? "eu-central-1"}
      />
    </div>
  );
}
