"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge, Button, ConfirmDialog, Input, Textarea } from "@dbc/ui";
import {
  createDashboardAd,
  updateDashboardAd,
  toggleDashboardAdActive,
  deleteDashboardAd,
  type DashboardAd,
} from "@/actions/dashboard-ads";
import { DashboardAdCarousel } from "@/components/dashboard-ad-carousel";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function AdsClient({
  locale,
  initialAds,
}: {
  locale: string;
  initialAds: DashboardAd[];
}) {
  const t = useTranslations("admin.ads.client");
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewAds = initialAds.filter((a) => a.is_active);

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleDashboardAdActive(id);
      if ("error" in res) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteDashboardAd(id);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success(t("deleted"));
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-8 space-y-10">
      {/* Live preview */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("preview")}
          </h2>
        </div>
        {previewAds.length > 0 ? (
          <DashboardAdCarousel ads={previewAds} locale={locale} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t("previewHint")}
          </p>
        )}
      </section>

      {/* Create form (collapsed by default) */}
      <section>
        {!creating ? (
          <Button type="button" onClick={() => setCreating(true)}>
            + {t("newAd")}
          </Button>
        ) : (
          <AdForm
            mode="create"
            isPending={isPending}
            onCancel={() => setCreating(false)}
            onSubmit={(formData) =>
              startTransition(async () => {
                const res = await createDashboardAd(formData);
                if ("error" in res && res.error) {
                  toast.error(res.error);
                  return;
                }
                toast.success(t("created"));
                setCreating(false);
                router.refresh();
              })
            }
          />
        )}
      </section>

      {/* List */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("allAds")}
        </h2>
        {initialAds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {t("noAds")}
          </p>
        ) : (
          <ul className="space-y-3">
            {initialAds.map((ad) =>
              editingId === ad.id ? (
                <li key={ad.id}>
                  <AdForm
                    mode="edit"
                    initial={ad}
                    isPending={isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(formData) =>
                      startTransition(async () => {
                        const res = await updateDashboardAd(ad.id, formData);
                        if ("error" in res && res.error) {
                          toast.error(res.error);
                          return;
                        }
                        toast.success(t("saved"));
                        setEditingId(null);
                        router.refresh();
                      })
                    }
                  />
                </li>
              ) : (
                <li
                  key={ad.id}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div
                    className="h-12 w-20 shrink-0 rounded-md bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${ad.image_url})` }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{ad.title_en}</p>
                      <Badge variant={ad.is_active ? "success" : "default"}>
                        {ad.is_active ? t("active") : "—"}
                      </Badge>
                    </div>
                    {ad.subtitle_en && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {ad.subtitle_en}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {ad.sort_order}
                      {ad.starts_at && ` · ${new Date(ad.starts_at).toLocaleDateString(locale)}+`}
                      {ad.ends_at && ` → ${new Date(ad.ends_at).toLocaleDateString(locale)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingId(ad.id)}
                      className="rounded-md px-2 py-1 font-semibold text-primary hover:bg-primary/10"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(ad.id)}
                      disabled={isPending}
                      className="rounded-md px-2 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {ad.is_active ? t("deactivate") : t("activate")}
                    </button>
                    <ConfirmDialog
                      trigger={
                        <button
                          type="button"
                          disabled={isPending}
                          className="rounded-md px-2 py-1 font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"
                        >
                          {t("delete")}
                        </button>
                      }
                      title={t("deleteConfirm")}
                      description={ad.title_en}
                      confirmLabel={t("delete")}
                      cancelLabel={t("cancel")}
                      variant="danger"
                      onConfirm={() => handleDelete(ad.id)}
                    />
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form — create + edit share the same fields
// ---------------------------------------------------------------------------
function AdForm({
  mode,
  initial,
  isPending,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: DashboardAd;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const t = useTranslations("admin.ads.client");
  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <Field
        label={t("imageUrl")}
        hint={t("imageHint")}
        name="image_url"
        type="url"
        required
        defaultValue={initial?.image_url ?? ""}
        placeholder="https://images.example.com/banner.webp"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("titleRequired")} name="title_en" required defaultValue={initial?.title_en ?? ""} />
        <Field label={t("titleDe")} name="title_de" defaultValue={initial?.title_de ?? ""} />
        <Field label={t("titleFr")} name="title_fr" defaultValue={initial?.title_fr ?? ""} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("subtitleEn")} name="subtitle_en" defaultValue={initial?.subtitle_en ?? ""} textarea rows={2} />
        <Field label={t("subtitleDe")} name="subtitle_de" defaultValue={initial?.subtitle_de ?? ""} textarea rows={2} />
        <Field label={t("subtitleFr")} name="subtitle_fr" defaultValue={initial?.subtitle_fr ?? ""} textarea rows={2} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("ctaEn")} name="cta_label_en" defaultValue={initial?.cta_label_en ?? ""} />
        <Field label={t("ctaDe")} name="cta_label_de" defaultValue={initial?.cta_label_de ?? ""} />
        <Field label={t("ctaFr")} name="cta_label_fr" defaultValue={initial?.cta_label_fr ?? ""} />
      </div>

      <Field
        label={t("ctaUrl")}
        name="cta_url"
        type="url"
        defaultValue={initial?.cta_url ?? ""}
        placeholder="https://…"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label={t("accent")}
          name="accent_color"
          defaultValue={initial?.accent_color ?? ""}
          placeholder="#b81838"
        />
        <Field
          label={t("sortOrder")}
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order?.toString() ?? "0"}
        />
        <label className="flex items-end gap-2 text-sm font-medium">
          <Input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="h-4 w-4 accent-primary"
          />
          {t("active")}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("startsAt")}
          name="starts_at"
          type="datetime-local"
          defaultValue={toDatetimeLocal(initial?.starts_at ?? null)}
        />
        <Field
          label={t("endsAt")}
          name="ends_at"
          type="datetime-local"
          defaultValue={toDatetimeLocal(initial?.ends_at ?? null)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit"
          disabled={isPending}>
          {isPending
            ? mode === "create"
              ? t("creating")
              : t("saving")
            : mode === "create"
              ? t("create")
              : t("save")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
  required,
  placeholder,
  hint,
  textarea,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {textarea ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 3}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type ?? "text"}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
