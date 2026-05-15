import { getTranslations } from "next-intl/server";
import { Badge, PageBack } from "@dbc/ui";
import { Mail } from "lucide-react";
import { getContact } from "@/actions/contacts";
import { listContactMessages } from "@/actions/contact-messages";
import { listOutreachTemplates } from "@/actions/outreach-templates";
import { ContactProfileTabs } from "./profile-tabs";
import { ComposeDialog } from "./compose-dialog";
import { DeleteContactButton } from "./delete-contact-button";
import { PipelineSelect } from "@/components/pipeline-select";
import { EmptyState } from "@/components/empty-state";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "admin.contacts.detail" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [data, messages, outreachTemplates] = await Promise.all([
    getContact(id),
    listContactMessages(id),
    listOutreachTemplates(),
  ]);

  const displayName =
    [data.contact.first_name, data.contact.last_name]
      .filter(Boolean)
      .join(" ") || data.contact.email;

  const acquisitionBadges = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of data.orders as any[]) {
    if (o.acquisition_type === "invited" || o.acquisition_type === "assigned") {
      acquisitionBadges.add(t("invited"));
    } else if (o.acquisition_type === "door_sale") {
      acquisitionBadges.add(t("door"));
    } else {
      acquisitionBadges.add(t("buyer"));
    }
  }
  if (data.contact.marketing_consent && !data.contact.unsubscribed_at) {
    acquisitionBadges.add(t("subscriber"));
  }

  return (
    <div>
      <PageBack href={`/${locale}/contacts`} label={tBack("contacts")} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.contact.email}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[...acquisitionBadges].map((b) => (
              <Badge key={b} variant="accent">
                {b}
              </Badge>
            ))}
            <PipelineSelect
              contactId={data.contact.id}
              initialStatus={data.userState?.pipeline_status ?? null}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComposeDialog
            contactId={data.contact.id}
            contactEmail={data.contact.email}
            defaultLocale={locale}
            templates={outreachTemplates}
          />
          <DeleteContactButton
            contactId={data.contact.id}
            contactEmail={data.contact.email}
            locale={locale}
          />
        </div>
      </div>

      {/* Email history surfaces the contact_messages SSOT. Rendered above the
          profile tabs because "did my last email actually go out?" is the
          most frequent post-send question. Always visible — empty state when
          nothing has been sent yet, so the operator can trust the page. */}
      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold">{t("messageHistory")}</h2>
        {messages.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Mail} message={t("noMessagesYet")} />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-border p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.subject}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("sentBy")} {m.senderName}
                      {m.template_slug ? ` · ${m.template_slug}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.sent_at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                  {m.body_md}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ContactProfileTabs
        contact={data.contact}
        linkedCategories={data.linkedCategories}
        allCategories={data.allCategories}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orders={data.orders as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tickets={data.tickets as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sponsorships={data.sponsorships as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applications={data.applications as any[]}
        involvements={data.involvements}
        eventsList={data.eventsList}
        userState={data.userState}
        locale={locale}
      />
    </div>
  );
}
