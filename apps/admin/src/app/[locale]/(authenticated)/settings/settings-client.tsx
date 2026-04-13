"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@dbc/types";
import {
  lookupBuyer,
  deleteBuyerPII,
  type WebhookLogRow,
  type BuyerLookupRow,
} from "@/actions/settings";

export function SettingsClient({
  locale,
  role,
  webhooks,
  ratePerEmail,
  turnstileEnabled,
  supabaseRegion,
}: {
  locale: string;
  role: UserRole;
  webhooks: WebhookLogRow[];
  ratePerEmail: number;
  turnstileEnabled: boolean;
  supabaseRegion: string;
}) {
  const t = {
    en: {
      system: "System",
      gdpr: "GDPR / Data deletion",
      webhooks: "Recent webhooks",
      ratePerEmail: "Max orders per email per event",
      turnstile: "Cloudflare Turnstile",
      enabled: "Enabled",
      disabled: "Disabled (no site key configured)",
      region: "Supabase region",
      auditRetention: "Audit log retention",
      auditRetentionValue: "2 years (SSOT rule 70)",
      lookupEmail: "Buyer email to look up",
      lookupBtn: "Look up",
      lookingUp: "Looking up\u2026",
      deleteBtn: "Delete all PII for this buyer",
      confirmDelete:
        "Permanently anonymise this buyer's orders and tickets, and delete their auth account. This cannot be undone. Continue?",
      deleted: "Buyer data anonymised.",
      notSuperAdmin:
        "GDPR deletion is restricted to Super Admins. Ask a Super Admin to perform this action.",
      orders: "orders",
      tickets: "tickets",
      noWebhooks: "No webhook events processed yet.",
      eventId: "Stripe event ID",
      source: "Source",
      processedAt: "Processed at",
    },
    de: {
      system: "System",
      gdpr: "DSGVO / Datenl\u00f6schung",
      webhooks: "Letzte Webhooks",
      ratePerEmail: "Max. Bestellungen pro E-Mail pro Veranstaltung",
      turnstile: "Cloudflare Turnstile",
      enabled: "Aktiviert",
      disabled: "Deaktiviert (kein Site-Key konfiguriert)",
      region: "Supabase-Region",
      auditRetention: "Audit-Log-Aufbewahrung",
      auditRetentionValue: "2 Jahre (SSOT-Regel 70)",
      lookupEmail: "E-Mail des K\u00e4ufers nachschlagen",
      lookupBtn: "Nachschlagen",
      lookingUp: "Nachschlagen\u2026",
      deleteBtn: "Alle personenbezogenen Daten l\u00f6schen",
      confirmDelete:
        "Bestellungen und Tickets dauerhaft anonymisieren und Auth-Konto l\u00f6schen. Kann nicht r\u00fcckg\u00e4ngig gemacht werden. Fortfahren?",
      deleted: "K\u00e4uferdaten anonymisiert.",
      notSuperAdmin:
        "DSGVO-L\u00f6schung ist auf Super Admins beschr\u00e4nkt.",
      orders: "Bestellungen",
      tickets: "Tickets",
      noWebhooks: "Noch keine Webhooks verarbeitet.",
      eventId: "Stripe-Event-ID",
      source: "Quelle",
      processedAt: "Verarbeitet am",
    },
    fr: {
      system: "Syst\u00e8me",
      gdpr: "RGPD / Suppression des donn\u00e9es",
      webhooks: "Webhooks r\u00e9cents",
      ratePerEmail: "Max. de commandes par e-mail par \u00e9v\u00e9nement",
      turnstile: "Cloudflare Turnstile",
      enabled: "Activ\u00e9",
      disabled: "D\u00e9sactiv\u00e9 (aucune cl\u00e9 configur\u00e9e)",
      region: "R\u00e9gion Supabase",
      auditRetention: "Conservation du journal d\u2019audit",
      auditRetentionValue: "2 ans (r\u00e8gle SSOT 70)",
      lookupEmail: "E-mail de l\u2019acheteur",
      lookupBtn: "Rechercher",
      lookingUp: "Recherche\u2026",
      deleteBtn: "Supprimer toutes les donn\u00e9es personnelles",
      confirmDelete:
        "Anonymiser d\u00e9finitivement les commandes et billets, et supprimer le compte. Action irr\u00e9versible. Continuer ?",
      deleted: "Donn\u00e9es anonymis\u00e9es.",
      notSuperAdmin:
        "La suppression RGPD est r\u00e9serv\u00e9e aux Super Admins.",
      orders: "commandes",
      tickets: "billets",
      noWebhooks: "Aucun webhook trait\u00e9.",
      eventId: "ID d\u2019\u00e9v\u00e9nement Stripe",
      source: "Source",
      processedAt: "Trait\u00e9 le",
    },
  }[locale] ?? {
    system: "System", gdpr: "GDPR", webhooks: "Webhooks",
    ratePerEmail: "Max orders", turnstile: "Turnstile", enabled: "Enabled",
    disabled: "Disabled", region: "Region", auditRetention: "Audit retention",
    auditRetentionValue: "2 years", lookupEmail: "Email", lookupBtn: "Look up",
    lookingUp: "\u2026", deleteBtn: "Delete", confirmDelete: "Continue?",
    deleted: "Deleted", notSuperAdmin: "Super admin only", orders: "orders",
    tickets: "tickets", noWebhooks: "None", eventId: "Event ID",
    source: "Source", processedAt: "Processed at",
  };

  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<BuyerLookupRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSuperAdmin = role === "super_admin";

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLookup(null);
    startTransition(async () => {
      const res = await lookupBuyer(email);
      if ("error" in res) setError(res.error);
      else setLookup(res);
    });
  }

  function handleDelete() {
    if (!lookup) return;
    if (!confirm(t.confirmDelete)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBuyerPII(lookup.email);
      if (res.error) setError(res.error);
      else {
        setSuccess(t.deleted);
        setLookup(null);
        setEmail("");
      }
    });
  }

  return (
    <div className="mt-8 space-y-10">
      {/* System info */}
      <section>
        <h2 className="font-heading text-lg font-semibold">{t.system}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow label={t.ratePerEmail} value={String(ratePerEmail)} />
          <InfoRow
            label={t.turnstile}
            value={turnstileEnabled ? t.enabled : t.disabled}
            status={turnstileEnabled ? "ok" : "warn"}
          />
          <InfoRow label={t.region} value={supabaseRegion} />
          <InfoRow label={t.auditRetention} value={t.auditRetentionValue} />
        </dl>
      </section>

      {/* Webhooks */}
      <section>
        <h2 className="font-heading text-lg font-semibold">{t.webhooks}</h2>
        {webhooks.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.noWebhooks}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    {t.eventId}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t.source}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t.processedAt}
                  </th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{w.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{w.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(w.processedAt).toLocaleString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* GDPR */}
      <section>
        <h2 className="font-heading text-lg font-semibold">{t.gdpr}</h2>

        {!isSuperAdmin ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-200">
            {t.notSuperAdmin}
          </p>
        ) : (
          <>
            <form
              onSubmit={handleLookup}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <label className="flex-1 min-w-[240px]">
                <span className="block text-xs text-muted-foreground mb-1">
                  {t.lookupEmail}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                {isPending ? t.lookingUp : t.lookupBtn}
              </button>
            </form>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </p>
            )}

            {lookup && (
              <div className="mt-4 rounded-lg border border-border p-4">
                <p className="text-sm">
                  <strong>{lookup.email}</strong>
                  {lookup.displayName && (
                    <span className="text-muted-foreground">
                      {" \u00b7 "}
                      {lookup.displayName}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lookup.orderCount} {t.orders} {" \u00b7 "}
                  {lookup.ticketCount} {t.tickets}
                </p>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="mt-3 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {t.deleteBtn}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 font-heading text-base font-semibold ${
          status === "warn"
            ? "text-amber-700 dark:text-amber-400"
            : status === "ok"
              ? "text-green-700 dark:text-green-400"
              : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
