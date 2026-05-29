"use client";

import { useActionState, useEffect, useRef, useState, use } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DEFAULTS,
  EVENT_BRANCH_VALUES,
  EVENT_TYPE_VALUES,
  type EventBranch,
  type EventType,
} from "@dbc/types";
import { Button, FormField, Input, Textarea } from "@dbc/ui";
import { createEvent } from "@/actions/events";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { PageHeader } from "@/components/page-header";
import { PaymentMethodsSelect } from "@/components/payment-methods-select";

// createEvent ends with redirect() on success — only error surfaces here.
type ActionResult = { error?: string } | null;

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

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return createEvent(formData);
    },
    null
  );

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div>
      <PageHeader
        title={t("pageTitle")}
        back={{ href: `/${locale}/events`, label: tBack("events") }}
      />

      <form action={formAction} className="mt-8 max-w-3xl space-y-6">
        {/* Branch (DBC Germany vs Other) */}
        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-2 text-sm font-medium">
            {tBranch("label")}
          </legend>
          <div className="flex flex-wrap gap-4">
            {EVENT_BRANCH_VALUES.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <Input
                  type="radio"
                  name="event_branch"
                  value={value}
                  checked={branch === value}
                  onChange={() => setBranch(value)}
                />
                {tBranch(`values.${value}`)}
              </label>
            ))}
          </div>
          {isExternal && (
            <div className="mt-4">
              <FormField label={tExternal("label")} required hint={tExternal("hint")}>
                <Input
                  name="external_url"
                  type="url"
                  required={isExternal}
                  placeholder="https://"
                />
              </FormField>
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
                  <Input
                    type="radio"
                    name="event_type"
                    value={value}
                    defaultChecked={i === 0}
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
          <FormField label={t("english")} required>
            <Input name="title_en" required />
          </FormField>
          <FormField label={t("deutsch")}>
            <Input name="title_de" />
          </FormField>
          <FormField label={t("francais")}>
            <Input name="title_fr" />
          </FormField>
        </div>

        {/* Descriptions (trilingual) */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">
            {t("description")} <span className="text-muted-foreground">{t("trilingual")}</span>
          </h2>
          <FormField label={t("english")}>
            <Textarea name="description_en" rows={3} />
          </FormField>
          <FormField label={t("deutsch")}>
            <Textarea name="description_de" rows={3} />
          </FormField>
          <FormField label={t("francais")}>
            <Textarea name="description_fr" rows={3} />
          </FormField>
        </div>

        {/* Venue */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("venueName")}>
            <Input name="venue_name" />
          </FormField>
          <FormField label={t("city")}>
            <Input name="city" defaultValue="Essen" />
          </FormField>
        </div>

        <FormField label={t("venueAddress")}>
          <Input name="venue_address" />
        </FormField>

        {/* Date & Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("startDate")} required>
            <Input name="starts_at" type="datetime-local" required />
          </FormField>
          <FormField label={t("endDate")} required>
            <Input name="ends_at" type="datetime-local" required />
          </FormField>
        </div>

        {/* Max tickets per order + payment methods — DBC Germany events only.
            External events don't run through our checkout. */}
        {!isExternal && (
          <>
            <FormField label={t("maxPerOrder")}>
              <Input
                name="max_tickets_per_order"
                type="number"
                min="1"
                defaultValue={String(DEFAULTS.MAX_TICKETS_PER_ORDER)}
              />
            </FormField>

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
