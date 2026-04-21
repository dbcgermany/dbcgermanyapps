"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AddressFields,
  BirthdayField,
  Button,
  EMPTY_ADDRESS,
  FormField,
  Input,
  NameFields,
  PhoneInput,
  TITLE_VALUES,
  Textarea,
  TitleGenderFields,
  type Address,
  type Gender,
  type Title,
} from "@dbc/ui";
import { createContact } from "@/actions/contacts";
import {
  INVOLVEMENT_ROLES,
  type InvolvementRole,
} from "@/lib/involvements";

type EventRow = { id: string; title_en: string; starts_at: string };

type FormState = { error?: string; id?: string } | null;

export function NewContactForm({
  locale,
  events,
}: {
  locale: string;
  events: EventRow[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.contacts");
  const tPerson = useTranslations("person");
  const tRole = useTranslations("admin.contacts.roles");

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

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await createContact(formData);
      if ("error" in result) return { error: result.error };
      router.push(`/${locale}/contacts/${result.id}`);
      return { id: result.id };
    },
    null
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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
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
        <FormField label={t("linkedinUrl")}>
          <Input
            type="url"
            name="linkedin_url"
            placeholder="https://www.linkedin.com/in/…"
          />
        </FormField>
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

      {/* Event involvement */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionInvolvement")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("linkToEvent")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            name="event_id"
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("selectEvent")}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title_en}
              </option>
            ))}
          </select>
          <select
            name="role"
            defaultValue="sponsor"
            className="w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {(INVOLVEMENT_ROLES as readonly InvolvementRole[]).map((r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            ))}
          </select>
        </div>
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
