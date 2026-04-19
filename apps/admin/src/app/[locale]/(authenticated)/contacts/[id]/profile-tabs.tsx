"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  PhoneInput,
  CountrySelect,
  GENDER_VALUES,
  type Gender,
} from "@dbc/ui";

const GENDER_LABELS: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};
import {
  updateContactProfile,
  toggleContactCategory,
  type Contact,
  type ContactCategory,
} from "@/actions/contacts";
import { resendTicketPdf, manualCheckIn } from "@/actions/tickets";

type Tab =
  | "profile"
  | "categories"
  | "orders"
  | "tickets"
  | "sponsorships"
  | "applications";

interface SponsorshipRow {
  id: string;
  company_name: string;
  tier: string;
  status: string;
  deal_value_cents: number | null;
  currency: string;
  created_at: string;
  event?: { id: string; title_en: string; starts_at: string } | null;
}

interface ApplicationRow {
  id: string;
  founder_name: string;
  company_name: string | null;
  company_stage: string | null;
  status: string;
  created_at: string;
  pitch: string;
  funding_needed_cents: number | null;
}

interface TicketRow {
  id: string;
  ticket_token: string;
  attendee_name: string;
  attendee_email: string;
  checked_in_at: string | null;
  event?: { id: string; title_en: string; starts_at: string };
  tier?: { name_en: string };
  order?: { acquisition_type: string; status: string };
  checked_in_by_profile?: { display_name: string | null };
}

interface OrderRow {
  id: string;
  status: string;
  acquisition_type: string;
  payment_method: string | null;
  total_cents: number;
  currency: string;
  created_at: string;
  event?: { id: string; title_en: string; starts_at: string };
}

export function ContactProfileTabs({
  contact,
  linkedCategories,
  allCategories,
  orders,
  tickets,
  sponsorships = [],
  applications = [],
  locale,
}: {
  contact: Contact;
  linkedCategories: ContactCategory[];
  allCategories: ContactCategory[];
  orders: OrderRow[];
  tickets: TicketRow[];
  sponsorships?: SponsorshipRow[];
  applications?: ApplicationRow[];
  locale: string;
}) {
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: Array<[Tab, string]> = [
    ["profile", "Profile"],
    ["categories", `Categories (${linkedCategories.length})`],
    ["orders", `Orders (${orders.length})`],
    ["tickets", `Tickets (${tickets.length})`],
  ];
  if (sponsorships.length > 0)
    tabs.push(["sponsorships", `Sponsorships (${sponsorships.length})`]);
  if (applications.length > 0)
    tabs.push(["applications", `Applications (${applications.length})`]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "profile" && <ProfileForm contact={contact} locale={locale} />}
        {tab === "categories" && (
          <CategoriesPicker
            contactId={contact.id}
            linked={linkedCategories}
            all={allCategories}
          />
        )}
        {tab === "orders" && <OrdersList orders={orders} />}
        {tab === "tickets" && <TicketsList tickets={tickets} />}
        {tab === "sponsorships" && (
          <SponsorshipsList sponsorships={sponsorships} locale={locale} />
        )}
        {tab === "applications" && (
          <ApplicationsList applications={applications} locale={locale} />
        )}
      </div>
    </div>
  );
}

function SponsorshipsList({
  sponsorships,
  locale,
}: {
  sponsorships: SponsorshipRow[];
  locale: string;
}) {
  if (sponsorships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No sponsorships recorded.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Event</th>
            <th className="px-3 py-2 text-left">Company</th>
            <th className="px-3 py-2 text-left">Tier</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-right">Deal value</th>
          </tr>
        </thead>
        <tbody>
          {sponsorships.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-3 py-2">{s.event?.title_en ?? "—"}</td>
              <td className="px-3 py-2 font-medium">{s.company_name}</td>
              <td className="px-3 py-2 capitalize">{s.tier}</td>
              <td className="px-3 py-2 capitalize">{s.status}</td>
              <td className="px-3 py-2 text-right">
                {s.deal_value_cents != null
                  ? (s.deal_value_cents / 100).toLocaleString(locale, {
                      style: "currency",
                      currency: s.currency || "EUR",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationsList({
  applications,
  locale,
}: {
  applications: ApplicationRow[];
  locale: string;
}) {
  if (applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No applications recorded.</p>
    );
  }
  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <div
          key={a.id}
          className="rounded-lg border border-border p-4 text-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {a.company_name ?? a.founder_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.company_stage ?? "—"} ·{" "}
                {new Date(a.created_at).toLocaleDateString(locale)}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
              {a.status}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {a.pitch.length > 240 ? `${a.pitch.slice(0, 240)}…` : a.pitch}
          </p>
          {a.funding_needed_cents != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Funding sought:{" "}
              {(a.funding_needed_cents / 100).toLocaleString(locale, {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfileForm({ contact, locale }: { contact: Contact; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState(contact.phone ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateContactProfile(contact.id, fd);
      if ("error" in result) toast.error(result.error);
      else toast.success("Saved.");
    });
  }

  const input =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">First name</span>
          <input
            name="first_name"
            defaultValue={contact.first_name ?? ""}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Last name</span>
          <input
            name="last_name"
            defaultValue={contact.last_name ?? ""}
            className={input}
          />
        </label>
      </div>
      <div className="block">
        <span className="mb-1 block text-sm font-medium">Country</span>
        <CountrySelect
          name="country"
          defaultValue={contact.country ?? ""}
          locale={locale}
          placeholder="—"
          size="sm"
          className="h-auto! py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Birthday</span>
          <input
            name="birthday"
            type="date"
            defaultValue={contact.birthday ?? ""}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Gender</span>
          <select
            name="gender"
            defaultValue={contact.gender ?? ""}
            className={input}
          >
            <option value="">—</option>
            {GENDER_VALUES.map((v) => (
              <option key={v} value={v}>
                {GENDER_LABELS[v]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Occupation</span>
        <input
          name="occupation"
          defaultValue={contact.occupation ?? ""}
          className={input}
        />
      </label>
      <div className="block">
        <span className="mb-1 block text-sm font-medium">Phone</span>
        <PhoneInput
          name="phone"
          value={phone}
          onChange={setPhone}
          size="sm"
          className="h-auto! py-2 text-sm"
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Admin notes</span>
        <textarea
          name="admin_notes"
          defaultValue={contact.admin_notes ?? ""}
          rows={3}
          className={input}
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function CategoriesPicker({
  contactId,
  linked,
  all,
}: {
  contactId: string;
  linked: ContactCategory[];
  all: ContactCategory[];
}) {
  const [active, setActive] = useState(new Set(linked.map((c) => c.id)));
  const [isPending, startTransition] = useTransition();

  function handleToggle(cat: ContactCategory) {
    const wasLinked = active.has(cat.id);
    const next = new Set(active);
    if (wasLinked) next.delete(cat.id);
    else next.add(cat.id);
    setActive(next);

    startTransition(async () => {
      const result = await toggleContactCategory(contactId, cat.id, wasLinked);
      if ("error" in result) {
        toast.error(result.error);
        setActive(active); // rollback
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((cat) => {
        const on = active.has(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleToggle(cat)}
            disabled={isPending}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              on
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            style={
              on && cat.color
                ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + "15" }
                : undefined
            }
          >
            {cat.name_en}
            {cat.is_system && (
              <span className="ml-1 text-[10px] opacity-60">•</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function OrdersList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No orders yet.</p>
    );
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
        >
          <div>
            <p className="font-medium">{o.event?.title_en ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {o.acquisition_type} · {o.status}
              {o.payment_method ? ` · ${o.payment_method}` : ""} ·{" "}
              {new Date(o.created_at).toLocaleDateString()}
            </p>
          </div>
          <p className="font-heading font-bold">
            {(o.total_cents / 100).toLocaleString(undefined, {
              style: "currency",
              currency: o.currency || "EUR",
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

function TicketsList({ tickets }: { tickets: TicketRow[] }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No tickets yet.</p>;
  }
  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <TicketRowView key={t.id} ticket={t} />
      ))}
    </div>
  );
}

function TicketRowView({ ticket }: { ticket: TicketRow }) {
  const [resendPending, startResend] = useTransition();
  const [checkInPending, startCheckIn] = useTransition();
  const [overrideEmail, setOverrideEmail] = useState("");

  const acquisitionLabel =
    ticket.order?.acquisition_type === "invited" ||
    ticket.order?.acquisition_type === "assigned"
      ? "Invited"
      : ticket.order?.acquisition_type === "door_sale"
        ? "Door"
        : "Paid";

  function handleResend(email?: string) {
    startResend(async () => {
      const result = await resendTicketPdf(ticket.id, email);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Ticket sent to ${email || ticket.attendee_email}.`);
    });
  }

  function handleCheckIn() {
    if (!ticket.event) return;
    startCheckIn(async () => {
      const result = await manualCheckIn(ticket.ticket_token, ticket.event!.id);
      if ("error" in result) {
        toast.error(
          `${result.error}${
            result.alreadyAt
              ? ` at ${new Date(result.alreadyAt).toLocaleTimeString()}`
              : ""
          }`
        );
      } else {
        toast.success(`Checked in: ${result.attendee_name}`);
      }
    });
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{ticket.event?.title_en ?? "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ticket.tier?.name_en ?? "Ticket"} · {acquisitionLabel} · #
            {ticket.ticket_token.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ticket.attendee_name} · {ticket.attendee_email}
          </p>
        </div>
        <div className="text-right">
          {ticket.checked_in_at ? (
            <p className="text-xs font-medium text-green-600">
              Checked in {new Date(ticket.checked_in_at).toLocaleString()}
              {ticket.checked_in_by_profile?.display_name
                ? ` · ${ticket.checked_in_by_profile.display_name}`
                : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Not checked in</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ConfirmDialog
          title="Resend ticket"
          description={`Resend the ticket PDF to ${
            overrideEmail || ticket.attendee_email
          }?`}
          confirmLabel="Send"
          variant="neutral"
          onConfirm={() => handleResend(overrideEmail || undefined)}
          trigger={
            <button
              type="button"
              disabled={resendPending}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {resendPending ? "Sending…" : "Resend PDF"}
            </button>
          }
        />
        <input
          type="email"
          value={overrideEmail}
          onChange={(e) => setOverrideEmail(e.target.value)}
          placeholder="Send to a different email (optional)"
          className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        />
        {!ticket.checked_in_at && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={checkInPending}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {checkInPending ? "Checking in…" : "Manual check-in"}
          </button>
        )}
      </div>
    </div>
  );
}
