import Link from "next/link";
import { getContact } from "@/actions/contacts";
import { ContactProfileTabs } from "./profile-tabs";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const data = await getContact(id);

  const displayName =
    [data.contact.first_name, data.contact.last_name]
      .filter(Boolean)
      .join(" ") || data.contact.email;

  const acquisitionBadges = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const o of data.orders as any[]) {
    if (o.acquisition_type === "invited" || o.acquisition_type === "assigned") {
      acquisitionBadges.add("Invited");
    } else if (o.acquisition_type === "door_sale") {
      acquisitionBadges.add("Door");
    } else {
      acquisitionBadges.add("Buyer");
    }
  }
  if (data.contact.marketing_consent && !data.contact.unsubscribed_at) {
    acquisitionBadges.add("Subscriber");
  }

  return (
    <div className="p-8">
      <Link
        href={`/${locale}/contacts`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Contacts
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.contact.email}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {[...acquisitionBadges].map((b) => (
              <span
                key={b}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ContactProfileTabs
        contact={data.contact}
        linkedCategories={data.linkedCategories}
        allCategories={data.allCategories}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orders={data.orders as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tickets={data.tickets as any[]}
      />
    </div>
  );
}
