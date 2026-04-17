"use client";

import { useState, useTransition } from "react";
import { renderEmailPreview } from "@/actions/email-preview";

type Locale = "en" | "de" | "fr";
type Template = "ticket" | "invitation";

export function EmailPreviewClient({
  eventId,
  initialLocale,
  initialTicketHtml,
  initialInvitationHtml,
}: {
  eventId: string;
  initialLocale: Locale;
  initialTicketHtml: string;
  initialInvitationHtml: string;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [template, setTemplate] = useState<Template>("ticket");
  const [ticketHtml, setTicketHtml] = useState(initialTicketHtml);
  const [invitationHtml, setInvitationHtml] = useState(initialInvitationHtml);
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: Locale) {
    setLocale(newLocale);
    startTransition(async () => {
      const result = await renderEmailPreview(eventId, newLocale);
      setTicketHtml(result.ticketHtml);
      setInvitationHtml(result.invitationHtml);
    });
  }

  const html = template === "ticket" ? ticketHtml : invitationHtml;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        {/* Template tabs */}
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(
            [
              ["ticket", "Ticket delivery"],
              ["invitation", "Formal invitation"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTemplate(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                template === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Locale tabs */}
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["en", "de", "fr"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLocale(l)}
              disabled={isPending}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                locale === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {isPending && (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
      </div>

      {/* Email preview iframe */}
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-white">
        <iframe
          srcDoc={html}
          sandbox=""
          title="Email preview"
          className="h-[700px] w-full"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
}
