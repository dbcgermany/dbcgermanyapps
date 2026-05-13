"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Card, Input, Label, Select, Badge } from "@dbc/ui";
import {
  sendAllTemplatePreviews,
  type PreviewLocale,
  type PreviewResult,
} from "@/actions/email-previews";

export function EmailPreviewsClient({
  locale,
  defaultEmail,
}: {
  locale: string;
  defaultEmail: string;
}) {
  const t = useTranslations("admin.emailPreviews");
  const [email, setEmail] = useState(defaultEmail);
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>(
    (["en", "de", "fr"] as const).includes(locale as PreviewLocale)
      ? (locale as PreviewLocale)
      : "fr"
  );
  const [results, setResults] = useState<PreviewResult[] | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    sent: number;
    failed: number;
    eventTitle: string;
    eventSlug: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResults(null);
    setSummary(null);
    startTransition(async () => {
      const res = await sendAllTemplatePreviews({
        targetEmail: email,
        locale: previewLocale,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setResults(res.data.results);
      setSummary({
        total: res.data.results.length,
        sent: res.data.totalSent,
        failed: res.data.totalFailed,
        eventTitle: res.data.eventTitle,
        eventSlug: res.data.eventSlug,
      });
      if (res.data.totalFailed === 0) {
        toast.success(t("successToast"));
      } else {
        toast.error(t("failureToast"));
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <Card padding="md" className="rounded-lg">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <Label htmlFor="target_email">{t("targetEmail")}</Label>
            <Input
              id="target_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("targetEmailHint")}
            </p>
          </div>
          <div>
            <Label htmlFor="preview_locale">{t("locale")}</Label>
            <Select
              id="preview_locale"
              value={previewLocale}
              onChange={(e) => setPreviewLocale(e.target.value as PreviewLocale)}
            >
              <option value="fr">Français (fr)</option>
              <option value="de">Deutsch (de)</option>
              <option value="en">English (en)</option>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t("sending") : t("send")}
          </Button>
        </form>
      </Card>

      {summary && (
        <Card padding="md" className="rounded-lg">
          <p className="text-sm">
            {t("summary", {
              sent: summary.sent,
              total: summary.total,
              failed: summary.failed,
            })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("eventInUse", {
              title: summary.eventTitle,
              slug: summary.eventSlug,
            })}
          </p>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card padding="md" className="rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">{t("tableTemplate")}</th>
                  <th className="py-2 pr-3">{t("tableStatus")}</th>
                  <th className="py-2">{t("tableError")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.template} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-mono text-xs">{r.template}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.sent ? "success" : "error"}>
                        {r.sent ? t("statusSent") : t("statusFailed")}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {r.error ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
