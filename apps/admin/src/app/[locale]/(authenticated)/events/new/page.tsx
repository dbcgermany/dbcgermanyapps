"use client";

import { useActionState, useState, use } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULTS,
  EVENT_BRANCH_VALUES,
  EVENT_TYPE_VALUES,
  type EventBranch,
  type EventType,
} from "@dbc/types";
import { Button } from "@dbc/ui";
import { createEvent } from "@/actions/events";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PageHeader } from "@/components/page-header";
import { PaymentMethodsSelect } from "@/components/payment-methods-select";

export default function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("admin.events.new");
  const tBranch = useTranslations("admin.events.branch");
  const tExternal = useTranslations("admin.events.externalUrl");
  const tBack = useTranslations("admin.back");

  const [branch, setBranch] = useState<EventBranch>("dbc_germany");
  const isExternal = branch === "other";

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      return createEvent(formData);
    },
    null
  );

  return (
    <div>
      <PageHeader
        title={t("pageTitle")}
        back={{ href: `/${locale}/events`, label: tBack("events") }}
      />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {state?.error && (
          <div className="rounded-md bg-danger-soft p-4 text-sm text-danger">
            {state.error}
          </div>
        )}

        {/* Branch (DBC Germany vs Other) */}
        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-2 text-sm font-medium">
            {tBranch("label")}
          </legend>
          <div className="flex flex-wrap gap-4">
            {EVENT_BRANCH_VALUES.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="event_branch"
                  value={value}
                  checked={branch === value}
                  onChange={() => setBranch(value)}
                  className="accent-primary"
                />
                {tBranch(`values.${value}`)}
              </label>
            ))}
          </div>
          {isExternal && (
            <div className="mt-4 space-y-2">
              <label
                htmlFor="external_url"
                className="block text-sm font-medium"
              >
                {tExternal("label")}
              </label>
              <input
                id="external_url"
                name="external_url"
                type="url"
                required={isExternal}
                placeholder="https://"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {tExternal("hint")}
              </p>
            </div>
          )}
        </fieldset>

        {/* Event Type (DBC Germany events only) */}
        {!isExternal && (
        <fieldset>
          <legend className="text-sm font-medium mb-2">{t("eventType")}</legend>
          <div className="flex gap-4">
            {EVENT_TYPE_VALUES.map((value, i) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="event_type"
                  value={value}
                  defaultChecked={i === 0}
                  className="accent-primary"
                />
                {t(value as EventType)}
              </label>
            ))}
          </div>
        </fieldset>
        )}

        {/* Titles (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            {t("title")} <span className="text-muted-foreground">{t("trilingual")}</span>
          </h2>
          {[
            { name: "title_en", label: t("english"), required: true },
            { name: "title_de", label: t("deutsch") },
            { name: "title_fr", label: t("francais") },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                required={field.required}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Descriptions (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            {t("description")} <span className="text-muted-foreground">{t("trilingual")}</span>
          </h2>
          {[
            { name: "description_en", label: t("english") },
            { name: "description_de", label: t("deutsch") },
            { name: "description_fr", label: t("francais") },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-xs text-muted-foreground mb-1">
                {field.label}
              </label>
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="venue_name" className="block text-sm font-medium mb-1">
              {t("venueName")}
            </label>
            <input
              id="venue_name"
              name="venue_name"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              {t("city")}
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue="Essen"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="venue_address" className="block text-sm font-medium mb-1">
            {t("venueAddress")}
          </label>
          <input
            id="venue_address"
            name="venue_address"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="starts_at" className="block text-sm font-medium mb-1">
              {t("startDate")}
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="ends_at" className="block text-sm font-medium mb-1">
              {t("endDate")}
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Max tickets per order + payment methods — DBC Germany events only.
            External events don't run through our checkout. */}
        {!isExternal && (
          <>
            <div>
              <label htmlFor="max_tickets_per_order" className="block text-sm font-medium mb-1">
                {t("maxPerOrder")}
              </label>
              <input
                id="max_tickets_per_order"
                name="max_tickets_per_order"
                type="number"
                min="1"
                defaultValue={String(DEFAULTS.MAX_TICKETS_PER_ORDER)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <PaymentMethodsSelect locale={locale} initialValues={[]} />
          </>
        )}

        <CoverImageUpload />

        <input type="hidden" name="timezone" value="Europe/Berlin" />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("creating") : t("createEvent")}
          </Button>
        </div>
      </form>
    </div>
  );
}
