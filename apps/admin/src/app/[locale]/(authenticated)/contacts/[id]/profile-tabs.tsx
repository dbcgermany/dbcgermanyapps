"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge, Button, ConfirmDialog, CountrySelect, GENDER_VALUES, PhoneInput, Textarea, TITLE_VALUES, type Gender } from "@dbc/ui";
import {
  addInvolvement,
  removeInvolvement,
  updateContactProfile,
  updateContactBusinessProfile,
  toggleContactCategory,
  type Contact,
  type ContactCategory,
  type ContactUserState,
} from "@/actions/contacts";
import {
  INVOLVEMENT_ROLES,
  type InvolvementRole,
  type InvolvementRow,
} from "@/lib/involvements";
import { BEST_CONTACT_METHODS } from "@dbc/types";
import { resendTicketPdf, manualCheckIn } from "@/actions/tickets";
import { useTranslations } from "next-intl";
import { PrivateNotesCard } from "@/components/private-notes-card";

// Gender enum labels are sourced from the shared i18n `person.*` namespace
// (already populated for the checkout form). Keeping a local mapping object
// here would re-introduce hardcoded English strings — Rule 21.
function useGenderLabels(): Record<Gender, string> {
  const tPerson = useTranslations("person");
  return {
    female: tPerson("genderFemale"),
    male: tPerson("genderMale"),
    non_binary: tPerson("genderNonBinary"),
    prefer_not_to_say: tPerson("genderPreferNotToSay"),
  };
}

type Tab =
  | "profile"
  | "categories"
  | "involvements"
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
  involvements = [],
  eventsList = [],
  userState = null,
  locale,
}: {
  contact: Contact;
  linkedCategories: ContactCategory[];
  allCategories: ContactCategory[];
  orders: OrderRow[];
  tickets: TicketRow[];
  sponsorships?: SponsorshipRow[];
  applications?: ApplicationRow[];
  involvements?: InvolvementRow[];
  eventsList?: Array<{ id: string; title_en: string; starts_at: string }>;
  userState?: ContactUserState | null;
  locale: string;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const tInv = useTranslations("admin.contacts");

  const tabs: Array<[Tab, string]> = [
    ["profile", "Profile"],
    ["categories", `Categories (${linkedCategories.length})`],
    ["involvements", `${tInv("involvementsTitle")} (${involvements.length})`],
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
        {tab === "profile" && (
          <div className="space-y-6">
            <ProfileForm contact={contact} locale={locale} />
            <PrivateNotesCard
              contactId={contact.id}
              initialNotes={userState?.private_notes ?? null}
            />
          </div>
        )}
        {tab === "categories" && (
          <CategoriesPicker
            contactId={contact.id}
            linked={linkedCategories}
            all={allCategories}
          />
        )}
        {tab === "involvements" && (
          <InvolvementsList
            contactId={contact.id}
            involvements={involvements}
            eventsList={eventsList}
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

function InvolvementsList({
  contactId,
  involvements,
  eventsList,
}: {
  contactId: string;
  involvements: InvolvementRow[];
  eventsList: Array<{ id: string; title_en: string; starts_at: string }>;
}) {
  const tInv = useTranslations("admin.contacts");
  const tRole = useTranslations("admin.contacts.roles");
  const [isPending, startTransition] = useTransition();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<InvolvementRole>("sponsor");

  function handleAdd() {
    if (!selectedEventId) return;
    startTransition(async () => {
      const result = await addInvolvement({
        contactId,
        eventId: selectedEventId,
        role: selectedRole,
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(tInv("addInvolvement"));
        setSelectedEventId("");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeInvolvement(id, contactId);
      if ("error" in result) toast.error(result.error);
    });
  }

  const input =
    "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-50 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {tInv("eventFilter")}
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className={`${input} w-full`}
          >
            <option value="">{tInv("selectEvent")}</option>
            {eventsList.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title_en}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            {tInv("roleFilter")}
          </span>
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as InvolvementRole)
            }
            className={input}
          >
            {(INVOLVEMENT_ROLES as readonly InvolvementRole[]).map((r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            ))}
          </select>
        </label>
        <Button type="button"
          disabled={!selectedEventId || isPending}
          onClick={handleAdd}>
          {tInv("addInvolvement")}
        </Button>
      </div>

      {involvements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tInv("involvementsEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {involvements.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {i.event?.title_en ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tRole(i.role)}
                  {i.event?.starts_at
                    ? ` · ${new Date(i.event.starts_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i.id)}
                disabled={isPending}
                className="text-xs text-danger hover:opacity-80 disabled:opacity-50"
              >
                {tInv("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
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
            <Badge className="capitalize">{a.status}</Badge>
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
  const [isBusinessPending, startBusinessTransition] = useTransition();
  const [phone, setPhone] = useState(contact.phone ?? "");
  const genderLabels = useGenderLabels();
  const tCommon = useTranslations("admin.common");
  const tFields = useTranslations("admin.contacts");
  const tProfile = useTranslations("admin.contacts.profile");
  const tBusiness = useTranslations("admin.contacts.business");
  const tBcm = useTranslations("admin.contacts.business.bestContactMethods");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateContactProfile(contact.id, fd);
      if ("error" in result) toast.error(result.error);
      else toast.success(tCommon("savedToast"));
    });
  }

  function onSubmitBusiness(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startBusinessTransition(async () => {
      const result = await updateContactBusinessProfile(contact.id, fd);
      if ("error" in result) toast.error(result.error);
      else toast.success(tCommon("savedToast"));
    });
  }

  const input =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {/* Identity */}
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tFields("sectionIdentity")}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.title")}</span>
            <select
              name="title"
              defaultValue={contact.title ?? ""}
              className={input}
            >
              <option value="">—</option>
              {TITLE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.firstName")}</span>
            <input
              name="first_name"
              defaultValue={contact.first_name ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.lastName")}</span>
            <input
              name="last_name"
              defaultValue={contact.last_name ?? ""}
              className={input}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.birthday")}</span>
            <input
              name="birthday"
              type="date"
              defaultValue={contact.birthday ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.gender")}</span>
            <select
              name="gender"
              defaultValue={contact.gender ?? ""}
              className={input}
            >
              <option value="">—</option>
              {GENDER_VALUES.map((v) => (
                <option key={v} value={v}>
                  {genderLabels[v]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {/* Contact channels */}
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tFields("sectionContact")}
        </legend>
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-sm font-medium">
            <span>{tFields("fields.email")}</span>
            {contact.email_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                <span aria-hidden>✓</span>
                {tFields("fields.emailVerifiedBadge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tFields("fields.emailUnverifiedBadge")}
              </span>
            )}
          </span>
          <input
            name="email"
            type="email"
            defaultValue={contact.email}
            className={input}
            required
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {tFields("fields.emailHint")}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="email_verified"
            defaultChecked={contact.email_verified}
            className="size-4 rounded border-input"
          />
          <input type="hidden" name="email_verified_present" value="1" />
          <span>{tFields("fields.emailVerifiedToggle")}</span>
        </label>
        <div className="block">
          <span className="mb-1 block text-sm font-medium">{tFields("fields.phone")}</span>
          <PhoneInput
            name="phone"
            value={phone}
            onChange={setPhone}
            size="sm"
            className="h-auto! py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("linkedinUrl")}</span>
            <input
              name="linkedin_url"
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              defaultValue={contact.linkedin_url ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.websiteUrl")}</span>
            <input
              name="website_url"
              type="url"
              placeholder="https://…"
              defaultValue={contact.website_url ?? ""}
              className={input}
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {tFields("fields.websiteUrlHint")}
            </span>
          </label>
        </div>
      </fieldset>

      {/* Professional */}
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tFields("sectionProfessional")}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("organization")}</span>
            <input
              name="organization"
              defaultValue={contact.organization ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.occupation")}</span>
            <input
              name="occupation"
              defaultValue={contact.occupation ?? ""}
              className={input}
            />
          </label>
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tFields("sectionAddress")}
        </legend>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tFields("fields.addressLine1")}</span>
          <input
            name="address_line_1"
            defaultValue={contact.address_line_1 ?? ""}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tFields("fields.addressLine2")}</span>
          <input
            name="address_line_2"
            defaultValue={contact.address_line_2 ?? ""}
            className={input}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.postalCode")}</span>
            <input
              name="postal_code"
              defaultValue={contact.postal_code ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.city")}</span>
            <input
              name="city"
              defaultValue={contact.city ?? ""}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("fields.stateRegion")}</span>
            <input
              name="state_region"
              defaultValue={contact.state_region ?? ""}
              className={input}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="block">
            <span className="mb-1 block text-sm font-medium">{tFields("country")}</span>
            <CountrySelect
              name="country"
              defaultValue={contact.country ?? ""}
              locale={locale}
              placeholder="—"
              size="sm"
              className="h-auto! py-2 text-sm"
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tBusiness("fields.hqCountry")}</span>
            <input
              name="hq_country"
              defaultValue={contact.hq_country ?? ""}
              maxLength={2}
              placeholder={tBusiness("fields.hqCountryPlaceholder")}
              className={input}
              style={{ textTransform: "uppercase" }}
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {tBusiness("fields.hqCountryHint")}
            </span>
          </label>
        </div>
      </fieldset>

      {/* Internal (shared with all team members) */}
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tProfile("sections.sharedNotes")}
        </legend>
        <p className="text-xs text-muted-foreground">{tProfile("shared.caption")}</p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tFields("fields.adminNotes")}</span>
          <Textarea
            name="admin_notes"
            defaultValue={contact.admin_notes ?? ""}
            rows={4}
            placeholder={tFields("fields.adminNotesPlaceholder")}
          />
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit"
          disabled={isPending}>
          {isPending ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>

    {/* Business profile — global fields, separate save action */}
    <form onSubmit={onSubmitBusiness} className="max-w-2xl space-y-4">
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-xs font-semibold uppercase text-muted-foreground">
          {tBusiness("sectionLabel")}
        </legend>
        <p className="text-xs text-muted-foreground">{tBusiness("description")}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tBusiness("fields.tier")}</span>
            <input
              name="tier"
              defaultValue={contact.tier ?? ""}
              className={input}
              placeholder={tBusiness("fields.tierPlaceholder")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tBusiness("fields.sector")}</span>
            <input
              name="sector"
              defaultValue={contact.sector ?? ""}
              className={input}
              placeholder={tBusiness("fields.sectorPlaceholder")}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tBusiness("fields.bestContactMethod")}</span>
            <select
              name="best_contact_method"
              defaultValue={contact.best_contact_method ?? ""}
              className={input}
            >
              <option value="">—</option>
              {BEST_CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {tBcm(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{tBusiness("fields.pitchTier")}</span>
            <input
              name="pitch_tier"
              defaultValue={contact.pitch_tier ?? ""}
              className={input}
              placeholder={tBusiness("fields.pitchTierPlaceholder")}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {tBusiness("fields.confidence")}
          </span>
          <input
            name="confidence"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={contact.confidence ?? ""}
            className={input}
            placeholder="0–100"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {tBusiness("fields.confidenceHint")}
          </span>
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isBusinessPending}>
          {isBusinessPending ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
    </div>
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
            <p className="text-xs font-medium text-success">
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
          className="flex-1 min-w-50 rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        />
        {!ticket.checked_in_at && (
          <Button type="button"
            onClick={handleCheckIn}
            disabled={checkInPending}>
            {checkInPending ? "Checking in…" : "Manual check-in"}
          </Button>
        )}
      </div>
    </div>
  );
}
