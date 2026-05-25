"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AddressFields, BirthdayField, Button, EMPTY_ADDRESS, FormField, Input, NameFields, PhoneInput, Select, Textarea, TITLE_VALUES, TitleGenderFields, type Address, type Gender, type Title } from "@dbc/ui";
import {
  createContact,
  upsertContactUserState,
} from "@/actions/contacts";
import {
  EVENT_ROLE_FILTER_VALUES,
  CONTACT_FILTER_HIDDEN_CATEGORY_SLUGS,
  PIPELINE_STATUS_VALUES,
  BEST_CONTACT_METHODS,
  type EventRoleFilterValue,
  type PipelineStatus,
} from "@dbc/types";

type EventRow = { id: string; title_en: string; starts_at: string };

type CategoryRow = {
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
};

type FormState = { error?: string; id?: string } | null;

export function NewContactForm({
  locale,
  events,
  categories = [],
}: {
  locale: string;
  events: EventRow[];
  categories?: CategoryRow[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.contacts");
  const tPerson = useTranslations("person");
  const tRole = useTranslations("admin.contacts.roles");
  const tFilters = useTranslations("admin.contacts.filters");
  const tBusiness = useTranslations("admin.contacts.business");
  const tBcm = useTranslations("admin.contacts.business.bestContactMethods");
  const tPipeline = useTranslations("admin.contacts.pipeline");

  // Controlled state for every SSOT atom that needs it (either for
  // validation or for cross-field coupling). Simpler fields stay
  // uncontrolled and just ride FormData.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState<Title | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [initialPipeline, setInitialPipeline] = useState<PipelineStatus | "">("");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await createContact(formData);
      if ("error" in result) return { error: result.error };
      // If the operator picked an initial pipeline status, attach it to
      // their own state row immediately after the contact is created.
      if (initialPipeline) {
        await upsertContactUserState({
          contactId: result.id,
          pipelineStatus: initialPipeline,
        });
      }
      router.push(`/${locale}/contacts/${result.id}`);
      return { id: result.id };
    },
    null
  );

  const visibleCategories = categories.filter(
    (c) =>
      !(CONTACT_FILTER_HIDDEN_CATEGORY_SLUGS as readonly string[]).includes(
        c.slug
      )
  );

  const titleLabels = Object.fromEntries(
    TITLE_VALUES.map((v) => [
      v,
      tPerson(
        `title${v.charAt(0).toUpperCase() + v.slice(1)}` as
          | "titleMr"
          | "titleMs"
          | "titleMrs"
          | "titleMx"
          | "titleDr"
          | "titleProf"
          | "titleExcellency"
          | "titleHonourable"
          | "titleRev"
      ),
    ])
  ) as Record<Title, string>;
  const genderLabels: Record<Gender, string> = {
    female: tPerson("genderFemale"),
    male: tPerson("genderMale"),
    non_binary: tPerson("genderNonBinary"),
    prefer_not_to_say: tPerson("genderPreferNotToSay"),
  };

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      {/* Identity */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionIdentity")}
        </h2>
        <NameFields
          firstNameLabel={tPerson("firstName")}
          lastNameLabel={tPerson("lastName")}
          firstName={firstName}
          lastName={lastName}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          required
        />
        <TitleGenderFields
          title={title}
          gender={gender}
          onTitleChange={setTitle}
          onGenderChange={setGender}
          titleLabel={tPerson("title")}
          genderLabel={tPerson("gender")}
          titleOptionLabels={titleLabels}
          genderOptionLabels={genderLabels}
        />
        <BirthdayField
          value={birthday}
          onChange={(iso) => setBirthday(iso ?? "")}
          label={tPerson("birthday")}
        />
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionContact")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("email")} required>
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </FormField>
          <FormField label={t("phone")}>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder="+49…"
            />
            <input type="hidden" name="phone" value={phone} />
          </FormField>
        </div>
      </section>

      {/* Professional */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionProfessional")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("occupation")}>
            <Input type="text" name="occupation" />
          </FormField>
          <FormField label={t("organization")}>
            <Input type="text" name="organization" />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("linkedinUrl")}>
            <Input
              type="url"
              name="linkedin_url"
              placeholder="https://www.linkedin.com/in/…"
            />
          </FormField>
          <FormField
            label={t("fields.websiteUrl")}
            hint={t("fields.websiteUrlHint")}
          >
            <Input
              type="url"
              name="website_url"
              placeholder="https://…"
            />
          </FormField>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionAddress")}
        </h2>
        <AddressFields value={address} onChange={setAddress} locale={locale} />
        {/* Hidden inputs mirror the AddressFields state into FormData so the
            server action can read flat keys that map 1-to-1 with contacts
            table columns. */}
        <input type="hidden" name="address_line_1" value={address.line1} />
        <input type="hidden" name="address_line_2" value={address.line2} />
        <input type="hidden" name="postal_code" value={address.postal_code} />
        <input type="hidden" name="city" value={address.city} />
        <input type="hidden" name="state_region" value={address.state} />
        <input type="hidden" name="country" value={address.country} />
      </section>

      {/* Hidden mirrors for the identity atoms that don't emit form-inputs
          (TitleGenderFields + BirthdayField emit hidden inputs already;
          NameFields writes its own too — but we emit these for safety and
          future-proofing in case any atom turns fully controlled). */}
      <input type="hidden" name="first_name" value={firstName} />
      <input type="hidden" name="last_name" value={lastName} />
      <input type="hidden" name="birthday" value={birthday} />

      {/* Category — durable identity (Press, Partners, Founder, …) */}
      {visibleCategories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tFilters("categoryLabel")}
          </h2>
          <p className="text-sm text-muted-foreground">{tFilters("categoryHint")}</p>
          <Select
            name="category_slug"
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("allCategories")}</option>
            {visibleCategories.map((c) => {
              const label =
                (locale === "de" && c.name_de) ||
                (locale === "fr" && c.name_fr) ||
                c.name_en;
              return (
                <option key={c.slug} value={c.slug}>
                  {label}
                </option>
              );
            })}
          </Select>
        </section>
      )}

      {/* Event involvement — what they do at THIS event (Speaker, …) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionInvolvement")}
        </h2>
        <p className="text-sm text-muted-foreground">{tFilters("eventRoleHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            name="event_id"
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("selectEvent")}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title_en}
              </option>
            ))}
          </Select>
          <Select
            name="role"
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{tFilters("eventRoleAll")}</option>
            {(EVENT_ROLE_FILTER_VALUES as readonly EventRoleFilterValue[]).map(
              (r) => (
                <option key={r} value={r}>
                  {tRole(r)}
                </option>
              )
            )}
          </Select>
        </div>
      </section>

      {/* Business details — global to the contact, optional */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tBusiness("sectionLabel")}
        </h2>
        <p className="text-sm text-muted-foreground">{tBusiness("description")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={tBusiness("fields.tier")}>
            <Input
              type="text"
              name="tier"
              placeholder={tBusiness("fields.tierPlaceholder")}
            />
          </FormField>
          <FormField label={tBusiness("fields.sector")}>
            <Input
              type="text"
              name="sector"
              placeholder={tBusiness("fields.sectorPlaceholder")}
            />
          </FormField>
          <FormField label={tBusiness("fields.bestContactMethod")}>
            <Select
              name="best_contact_method"
              defaultValue=""
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">—</option>
              {BEST_CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {tBcm(m)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={tBusiness("fields.pitchTier")}>
            <Input
              type="text"
              name="pitch_tier"
              placeholder={tBusiness("fields.pitchTierPlaceholder")}
            />
          </FormField>
          <FormField label={tBusiness("fields.confidence")} hint={tBusiness("fields.confidenceHint")}>
            <Input
              type="number"
              name="confidence"
              min={0}
              max={100}
              step={1}
              placeholder="0–100"
            />
          </FormField>
          <FormField label={tBusiness("fields.hqCountry")} hint={tBusiness("fields.hqCountryHint")}>
            <Input
              type="text"
              name="hq_country"
              maxLength={2}
              placeholder={tBusiness("fields.hqCountryPlaceholder")}
              autoCapitalize="characters"
            />
          </FormField>
          <FormField label={tBusiness("fields.emailVerified")} hint={tBusiness("fields.emailVerifiedHint")}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="email_verified"
                className="size-4 rounded border-input"
              />
              <span>{tBusiness("fields.emailVerifiedToggle")}</span>
            </label>
          </FormField>
        </div>
      </section>

      {/* Pipeline (private to this user) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tPipeline("label")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("profile.private.caption")}</p>
        <Select
          value={initialPipeline}
          onChange={(e) =>
            setInitialPipeline((e.target.value || "") as PipelineStatus | "")
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
        >
          <option value="">{tPipeline("placeholder")}</option>
          {(PIPELINE_STATUS_VALUES as readonly PipelineStatus[]).map((s) => (
            <option key={s} value={s}>
              {tPipeline(`statuses.${s}`)}
            </option>
          ))}
        </Select>
      </section>

      {/* Internal */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionInternal")}
        </h2>
        <FormField label={t("adminNotes")} hint={t("adminNotesHint")}>
          <Textarea name="admin_notes" rows={3} />
        </FormField>
      </section>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
