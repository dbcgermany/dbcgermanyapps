import { getTranslations } from "next-intl/server";
import { Badge, PageBack } from "@dbc/ui";
import { getContact } from "@/actions/contacts";
import { listContactMessages } from "@/actions/contact-messages";
import { ContactProfileTabs } from "./profile-tabs";
import { ComposeDialog } from "./compose-dialog";

const T = {
  en: {
    invited: "Invited", door: "Door", buyer: "Buyer", subscriber: "Subscriber",
    messageHistory: "Message history",
  },
  de: {
    invited: "Eingeladen", door: "Abendkasse", buyer: "Käufer:in", subscriber: "Abonnent:in",
    messageHistory: "Nachrichtenverlauf",
  },
  fr: {
    invited: "Invité", door: "Entrée", buyer: "Acheteur", subscriber: "Abonné",
    messageHistory: "Historique des messages",
  },
} as const;

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const data = await getContact(id);
  const messages = await listContactMessages(id);

  const displayName =
    [data.contact.first_name, data.contact.last_name]
      .filter(Boolean)
      .join(" ") || data.contact.email;

  const acquisitionBadges = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of data.orders as any[]) {
    if (o.acquisition_type === "invited" || o.acquisition_type === "assigned") {
      acquisitionBadges.add(t.invited);
    } else if (o.acquisition_type === "door_sale") {
      acquisitionBadges.add(t.door);
    } else {
      acquisitionBadges.add(t.buyer);
    }
  }
  if (data.contact.marketing_consent && !data.contact.unsubscribed_at) {
    acquisitionBadges.add(t.subscriber);
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
          <div className="mt-2 flex flex-wrap gap-1">
            {[...acquisitionBadges].map((b) => (
              <Badge key={b} variant="accent">
                {b}
              </Badge>
            ))}
          </div>
        </div>
        <ComposeDialog
          contactId={data.contact.id}
          contactEmail={data.contact.email}
          defaultLocale={locale}
        />
      </div>

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
        locale={locale}
      />

      {messages.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-bold">{t.messageHistory}</h2>
          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-border p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{m.subject}</p>
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
        </section>
      )}
    </div>
  );
}
