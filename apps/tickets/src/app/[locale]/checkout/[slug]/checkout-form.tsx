"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";
import {
  AttendeeIdentityFields,
  TITLE_VALUES,
  GENDER_VALUES,
  type AttendeeIdentity,
  type AttendeeIdentityLabels,
  type Gender,
  type Title,
} from "@dbc/ui";
import { createCheckoutSession, previewCoupon } from "@/actions/purchase";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
}

interface Attendee {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  tierId: string;
  title: Title | "";
  gender: Gender | "";
  birthday: string;
  // Optional voluntary fields — left empty on the contract. We use these
  // for community insight (where attendees are from, what fields they
  // work in). Lawful basis: explicit consent (the attendee chooses to
  // fill them in; nothing is required to complete the purchase).
  occupation: string;
  address_line_1: string;
  address_line_2: string;
  postal_code: string;
  city: string;
  showOptional: boolean;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        selector: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function emptyAttendee(tierId: string): Attendee {
  return {
    first_name: "",
    last_name: "",
    email: "",
    country: "",
    tierId,
    title: "",
    gender: "",
    birthday: "",
    occupation: "",
    address_line_1: "",
    address_line_2: "",
    postal_code: "",
    city: "",
    showOptional: false,
  };
}

export function CheckoutForm({
  eventSlug,
  locale,
  tiers,
  maxPerOrder,
  turnstileSiteKey,
  source,
  funnelSlug,
  initialTierId,
  initialCouponCode,
}: {
  eventSlug: string;
  locale: string;
  tiers: Tier[];
  maxPerOrder: number;
  turnstileSiteKey: string | null;
  source?: string | null;
  funnelSlug?: string | null;
  initialTierId?: string | null;
  initialCouponCode?: string | null;
}) {
  const tPerson = useTranslations("person");
  const tCheckout = useTranslations("tickets.checkout");
  // Start with NO tier pre-picked unless the visitor deep-linked from a funnel
  // CTA that carried `?tier=<id>`. Forces a deliberate "Which ticket?" choice;
  // the submit button stays disabled until the operator picks one.
  const [attendees, setAttendees] = useState<Attendee[]>([
    emptyAttendee(initialTierId ?? ""),
  ]);
  const [couponCode, setCouponCode] = useState(initialCouponCode ?? "");
  // P2.2 — live coupon preview (debounced 400ms)
  const [couponPreview, setCouponPreview] = useState<
    { state: "idle" | "checking" } | { state: "valid"; label: string } | { state: "invalid"; error: string }
  >({ state: "idle" });
  const [revocationWaived, setRevocationWaived] = useState(false);
  // P1.4 — opt-in only, GDPR/PECR-compliant. Default unchecked.
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

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
  // Reference GENDER_VALUES to keep the enum SSOT bundled and tree-shake-proof.
  void GENDER_VALUES;

  // Labels for the SSOT AttendeeIdentityFields molecule — all sourced from
  // packages/i18n JSON. Same `person.*` set the admin door-sale form passes,
  // so the two surfaces render identical labels in every locale.
  const identityLabels: AttendeeIdentityLabels = {
    firstName: tPerson("firstName"),
    lastName: tPerson("lastName"),
    email: tPerson("email"),
    country: tPerson("country"),
    countryPlaceholder: tPerson("country"),
    addOptional: `+ ${tPerson("moreDetails")}`,
    hideOptional: `− ${tPerson("hideDetails")}`,
    optionalCaption: tPerson("optionalCaption"),
    title: tPerson("title"),
    gender: tPerson("gender"),
    birthday: tPerson("birthday"),
    occupation: tPerson("occupation"),
    streetAddress: tPerson("streetAddress"),
    addressLine2: tPerson("addressLine2"),
    postalCode: tPerson("postalCode"),
    city: tPerson("city"),
    titleOptions: titleLabels,
    genderOptions: genderLabels,
  };

  // Per-attendee setter that swaps in the molecule's full `AttendeeIdentity`
  // payload while preserving the checkout-only fields (tierId + showOptional).
  function setAttendeeIdentity(index: number, next: AttendeeIdentity) {
    setAttendees(
      attendees.map((a, i) =>
        i === index
          ? {
              ...a,
              first_name: next.first_name,
              last_name: next.last_name,
              email: next.email,
              country: next.country,
              title: next.title,
              gender: next.gender,
              birthday: next.birthday,
              occupation: next.occupation,
              address_line_1: next.address_line_1,
              address_line_2: next.address_line_2,
              postal_code: next.postal_code,
              city: next.city,
            }
          : a
      )
    );
  }

  // P2.2 — debounced coupon preview. Fires after 400ms of idle typing so
  // users see "invalid" / discount label before submitting the whole form.
  useEffect(() => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponPreview({ state: "idle" });
      return;
    }
    setCouponPreview({ state: "checking" });
    const tierIds = Array.from(new Set(attendees.map((a) => a.tierId).filter(Boolean)));
    const timer = setTimeout(async () => {
      const res = await previewCoupon({
        eventSlug,
        code,
        tierIds,
      });
      if (res.valid) {
        setCouponPreview({ state: "valid", label: res.label });
      } else {
        setCouponPreview({ state: "invalid", error: res.error });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, eventSlug]);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (!turnstileRef.current) return;

    function renderWidget() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileRef.current,
        {
          sitekey: turnstileSiteKey!,
          callback: (token: string) => setTurnstileToken(token),
          "error-callback": () => setTurnstileToken(null),
          "expired-callback": () => setTurnstileToken(null),
          theme: "auto",
        }
      );
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [turnstileSiteKey]);

  const [state, formAction, isPending] = useActionState(
    async () => {
      for (let i = 0; i < attendees.length; i++) {
        const a = attendees[i];
        if (
          !a.first_name.trim() ||
          !a.last_name.trim() ||
          !a.email.trim() ||
          !a.country
        ) {
          return {
            error:
              locale === "de"
                ? `Bitte f\u00fcllen Sie Vorname, Nachname, E-Mail und Land f\u00fcr Ticket ${i + 1} aus.`
                : locale === "fr"
                  ? `Veuillez renseigner le pr\u00e9nom, le nom, l'e-mail et le pays pour le billet ${i + 1}.`
                  : `Please fill in first name, last name, email and country for ticket ${i + 1}.`,
          };
        }
      }

      if (turnstileSiteKey && !turnstileToken) {
        return {
          error:
            locale === "de"
              ? "Bitte best\u00e4tigen Sie, dass Sie kein Bot sind."
              : locale === "fr"
                ? "Veuillez confirmer que vous n'\u00eates pas un robot."
                : "Please complete the bot check.",
        };
      }

      const result = await createCheckoutSession({
        eventSlug,
        attendees: attendees.map((a) => ({
          first_name: a.first_name.trim(),
          last_name: a.last_name.trim(),
          email: a.email.trim(),
          country: a.country,
          tierId: a.tierId,
          title: a.title || undefined,
          gender: a.gender || undefined,
          birthday: a.birthday || null,
          occupation: a.occupation.trim() || null,
          address_line_1: a.address_line_1.trim() || null,
          address_line_2: a.address_line_2.trim() || null,
          postal_code: a.postal_code.trim() || null,
          city: a.city.trim() || null,
        })),
        couponCode: couponCode.trim() || undefined,
        locale,
        turnstileToken: turnstileToken ?? undefined,
        source: source ?? undefined,
        funnelSlug: funnelSlug ?? undefined,
        revocationWaived,
        marketingConsent,
      });

      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        setTurnstileToken(null);
      }

      return result;
    },
    null
  );

  function addAttendee() {
    if (attendees.length >= maxPerOrder) return;
    setAttendees([...attendees, emptyAttendee(tiers[0]?.id ?? "")]);
  }

  function removeAttendee(index: number) {
    if (attendees.length <= 1) return;
    setAttendees(attendees.filter((_, i) => i !== index));
  }

  function updateAttendee<K extends keyof Attendee>(
    index: number,
    field: K,
    value: Attendee[K]
  ) {
    setAttendees(
      attendees.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  const subtotalCents = attendees.reduce((sum, a) => {
    const tier = tierMap.get(a.tierId);
    return sum + (tier?.priceCents ?? 0);
  }, 0);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {state?.error && (
        <div className="rounded-md bg-danger-soft p-4 text-sm text-danger">
          {state.error}
        </div>
      )}

      {/* Attendees */}
      <div className="space-y-6">
        {attendees.map((attendee, index) => {
          const identity: AttendeeIdentity = {
            first_name: attendee.first_name,
            last_name: attendee.last_name,
            email: attendee.email,
            country: attendee.country,
            title: attendee.title,
            gender: attendee.gender,
            birthday: attendee.birthday,
            occupation: attendee.occupation,
            address_line_1: attendee.address_line_1,
            address_line_2: attendee.address_line_2,
            postal_code: attendee.postal_code,
            city: attendee.city,
          };
          const lc = attendee.email.trim().toLowerCase();
          const dupeCount = lc
            ? attendees.filter(
                (a, i) => i !== index && a.email.trim().toLowerCase() === lc
              ).length
            : 0;
          return (
            <div key={index} className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {tCheckout("ticketNumber", {
                    number: index + 1,
                    total: attendees.length,
                  })}
                </h3>
                {attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(index)}
                    className="text-xs text-danger hover:text-danger/80"
                  >
                    {tCheckout("removeAttendee")}
                  </button>
                )}
              </div>

              {/* Ticket-tier picker — checkout-specific, stays out of the
                  identity molecule (which is identity-only + shared with
                  the admin door-sale form). */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {tCheckout("ticketType")}
                </label>
                <select
                  value={attendee.tierId}
                  required
                  onChange={(e) =>
                    updateAttendee(index, "tierId", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>
                    {tCheckout("selectTierPlaceholder")}
                  </option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} &mdash;{" "}
                      {tier.priceCents === 0
                        ? tCheckout("free")
                        : `€${(tier.priceCents / 100).toFixed(2)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* SSOT identity block — the same AttendeeIdentityFields molecule
                  the admin door-sale form uses. Same atoms, same field order,
                  same labels per locale, same hidden-input names — so an
                  online purchase and a manual sale produce byte-identical
                  contacts + tickets.attendee_* rows. */}
              <AttendeeIdentityFields
                value={identity}
                onChange={(next) => setAttendeeIdentity(index, next)}
                locale={locale}
                showOptional={attendee.showOptional}
                onShowOptionalChange={(next) =>
                  updateAttendee(index, "showOptional", next)
                }
                labels={identityLabels}
              />

              {/* Duplicate-email warning — non-blocking; some attendees share
                  a household address. Lives outside the molecule because it
                  needs cross-attendee context. */}
              {dupeCount > 0 && (
                <p className="text-[11px] text-warning">
                  {tCheckout("duplicateEmail")}
                </p>
              )}
            </div>
          );
        })}

        {attendees.length < maxPerOrder && (
          <button
            type="button"
            onClick={addAttendee}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            + {tCheckout("addAnotherTicket")}
          </button>
        )}
      </div>

      {/* Coupon */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {tCheckout("couponCode")}
        </label>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder={
            locale === "de"
              ? "Gutscheincode eingeben"
              : locale === "fr"
                ? "Entrer le code promo"
                : "Enter coupon code"
          }
          className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {/* P2.2 — coupon live preview */}
        {couponPreview.state === "checking" && (
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === "de" ? "Wird geprüft…" : locale === "fr" ? "Vérification…" : "Checking…"}
          </p>
        )}
        {couponPreview.state === "valid" && (
          <p className="mt-1 text-xs text-success">
            ✓ {couponPreview.label}
          </p>
        )}
        {couponPreview.state === "invalid" && (
          <p className="mt-1 text-xs text-danger">{couponPreview.error}</p>
        )}
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-heading text-lg font-semibold">
          {tCheckout("summary")}
        </h3>
        <div className="mt-4 space-y-2 text-sm">
          {attendees.map((a, i) => {
            const tier = tierMap.get(a.tierId);
            const fullName = [a.first_name, a.last_name]
              .map((s) => s.trim())
              .filter(Boolean)
              .join(" ");
            return (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {tier?.name} {fullName && `\u2014 ${fullName}`}
                </span>
                <span>
                  {tier
                    ? tier.priceCents === 0
                      ? tCheckout("free")
                      : `\u20AC${(tier.priceCents / 100).toFixed(2)}`
                    : ""}
                </span>
              </div>
            );
          })}
          <div className="border-t border-border pt-2 flex justify-between font-medium text-base">
            <span>Total</span>
            <span>
              {subtotalCents === 0
                ? tCheckout("free")
                : `\u20AC${(subtotalCents / 100).toFixed(2)}`}
            </span>
          </div>
          {couponCode.trim() && (
            <p className="text-xs text-muted-foreground">
              {locale === "de"
                ? "Gutschein wird beim Bezahlen angewendet"
                : locale === "fr"
                  ? "Le coupon sera appliqu\u00e9 au paiement"
                  : "Coupon will be applied at payment"}
            </p>
          )}
        </div>
      </div>

      {/* Turnstile */}
      {turnstileSiteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div ref={turnstileRef} className="flex justify-center" />
        </>
      )}

      {/* P1.4 — Marketing consent. Opt-in only, default unchecked. Lawful
          basis: explicit consent (GDPR Art. 6(1)(a) / PECR for electronic
          marketing). The checkbox stamp flows into contacts.marketing_consent
          on the upsert. */}
      <label className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {locale === "de"
            ? "Ja, ich möchte gelegentlich Updates zu kommenden Veranstaltungen und Möglichkeiten von DBC Germany erhalten. Ich kann mich jederzeit über den Link in jeder E-Mail abmelden."
            : locale === "fr"
              ? "Oui, je souhaite recevoir occasionnellement des nouvelles sur les prochains événements et opportunités de DBC Germany. Je peux me désabonner à tout moment via le lien dans chaque e-mail."
              : "Yes, I'd like occasional updates on upcoming DBC Germany events and opportunities. I can unsubscribe at any time via the link in every email."}
        </span>
      </label>

      {/* P2.3 — Privacy + Terms links. TMG §5 / GDPR Article 13 require
          the policy to be linked at the point of personal-data submission.
          Pages live on the marketing site (dbc-germany.com), not the
          ticketing app, so the URLs are absolute. */}
      <p className="text-xs text-muted-foreground">
        {locale === "de"
          ? "Mit dem Absenden akzeptieren Sie unsere "
          : locale === "fr"
            ? "En soumettant, vous acceptez nos "
            : "By submitting, you accept our "}
        <a
          href={`https://dbc-germany.com/${locale}/terms`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          {locale === "de"
            ? "Allgemeinen Geschäftsbedingungen"
            : locale === "fr"
              ? "conditions générales"
              : "Terms"}
        </a>
        {locale === "de"
          ? " und unsere "
          : locale === "fr"
            ? " et notre "
            : " and our "}
        <a
          href={`https://dbc-germany.com/${locale}/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          {locale === "de"
            ? "Datenschutzerklärung"
            : locale === "fr"
              ? "politique de confidentialité"
              : "Privacy Policy"}
        </a>
        .
      </p>

      {/* German Widerrufsrecht (BGB §312g, §355) waiver. Required for digital
          event tickets so the buyer can't claim a 14-day refund post-event. */}
      <label className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
        <input
          type="checkbox"
          required
          checked={revocationWaived}
          onChange={(e) => setRevocationWaived(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {locale === "de"
            ? "Ich stimme zu, dass DBC Germany mit der Erbringung der Leistung (Bereitstellung des Tickets und Eintritt zum Event) sofort beginnt, und bin mir bewusst, dass ich mein Widerrufsrecht damit verliere, sobald die Leistung vollständig erbracht wurde (§ 356 Abs. 4 BGB)."
            : locale === "fr"
              ? "J'accepte que DBC Germany commence immédiatement l'exécution du service (émission du billet et accès à l'événement) et reconnais perdre mon droit de rétractation dès l'exécution complète."
              : "I agree that DBC Germany may begin performing the service (issuing my ticket and granting event access) immediately, and I acknowledge that my right of revocation lapses once the service has been fully performed."}
        </span>
      </label>

      {/* Submit — blocked until every attendee has explicitly picked a tier
          (no more "Starter €49.00" auto-pick masking a missing choice). */}
      <button
        type="submit"
        disabled={
          isPending ||
          !revocationWaived ||
          attendees.some((a) => !a.tierId) ||
          (Boolean(turnstileSiteKey) && !turnstileToken)
        }
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {/* \u00A7 312j(3) BGB requires the order button to be labelled with an
            unambiguous payment-obligation phrase. "zahlungspflichtig bestellen"
            is the safe-harbour wording; equivalents like "kostenpflichtig
            kaufen" / "Order with obligation to pay" / "Commander avec
            obligation de paiement" are accepted under the same rule. */}
        {isPending
          ? locale === "de"
            ? "Verarbeitung..."
            : locale === "fr"
              ? "Traitement..."
              : "Processing..."
          : subtotalCents === 0
            ? locale === "de"
              ? "Jetzt verbindlich bestellen"
              : locale === "fr"
                ? "Commander de mani\u00E8re contraignante"
                : "Place binding order"
            : locale === "de"
              ? `Zahlungspflichtig bestellen \u2014 \u20AC${(subtotalCents / 100).toFixed(2)}`
              : locale === "fr"
                ? `Commander avec obligation de paiement \u2014 \u20AC${(subtotalCents / 100).toFixed(2)}`
                : `Order with obligation to pay \u2014 \u20AC${(subtotalCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
