"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Card, ConfirmDialog, Input, Label, Select } from "@dbc/ui";
import {
  issueTeamFriendCoupons,
  overrideTeamMemberQuota,
  overrideTeamMemberDiscount,
  updateEventTeamInviteDiscount,
  revokeTeamFriendCoupon,
  type TeamMemberInviteSummary,
} from "@/actions/team-friend-invites";

type DiscountType = "percent" | "fixed";

interface TierOption {
  id: string;
  label: string;
  priceCents: number;
}

export function TeamInvitesClient({
  eventId,
  defaultQuota,
  defaultDiscountType,
  defaultDiscountValue,
  defaultApplicableTierIds,
  tierOptions,
  summaries,
}: {
  eventId: string;
  defaultQuota: number;
  defaultDiscountType: DiscountType;
  defaultDiscountValue: number;
  defaultApplicableTierIds: string[];
  tierOptions: TierOption[];
  summaries: TeamMemberInviteSummary[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.teamInvites");
  const [isPending, startTransition] = useTransition();
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Event-level form state
  const [discountType, setDiscountType] = useState<DiscountType>(defaultDiscountType);
  const [discountValueRaw, setDiscountValueRaw] = useState<string>(
    defaultDiscountType === "fixed"
      ? (defaultDiscountValue / 100).toFixed(2)
      : String(defaultDiscountValue)
  );
  const [appliesToAll, setAppliesToAll] = useState<boolean>(
    defaultApplicableTierIds.length === 0
  );
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>(
    defaultApplicableTierIds
  );

  function parseDiscountValue(): number | null {
    const trimmed = discountValueRaw.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) return null;
    return discountType === "fixed" ? Math.round(num * 100) : Math.round(num);
  }

  function handleSaveEventDiscount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = parseDiscountValue();
    if (value === null) {
      toast.error(t("discountInvalid"));
      return;
    }
    if (discountType === "percent" && value > 100) {
      toast.error(t("discountPercentMax"));
      return;
    }
    startTransition(async () => {
      const res = await updateEventTeamInviteDiscount(eventId, {
        discountType,
        discountValue: value,
        applicableTierIds: appliesToAll ? [] : selectedTierIds,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      const synced = (res as { syncedCount?: number }).syncedCount ?? 0;
      const skipped = (res as { skippedUsedCount?: number }).skippedUsedCount ?? 0;
      toast.success(t("discountSavedToast", { synced, skipped }));
      router.refresh();
    });
  }

  function handleGenerate(profileId: string) {
    startTransition(async () => {
      const res = await issueTeamFriendCoupons(eventId, profileId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      const created = (res as { created?: number }).created ?? 0;
      const message = (res as { message?: string }).message;
      toast.success(
        created > 0
          ? t("generatedToast", { count: created })
          : message ?? t("upToDateToast")
      );
      router.refresh();
    });
  }

  function handleRevoke(couponId: string) {
    startTransition(async () => {
      const res = await revokeTeamFriendCoupon(couponId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("revokedToast"));
      router.refresh();
    });
  }

  function handleQuotaSubmit(profileId: string, formData: FormData) {
    const raw = (formData.get("quota") as string) || "";
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error(t("quotaMustBeNonNegative"));
      return;
    }
    startTransition(async () => {
      const res = await overrideTeamMemberQuota(eventId, profileId, parsed);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t("quotaUpdatedToast"));
        router.refresh();
      }
    });
  }

  function handleDiscountOverrideSubmit(
    profileId: string,
    formData: FormData
  ) {
    const typeRaw = (formData.get("override_type") as string) || "inherit";
    const valueRaw = ((formData.get("override_value") as string) || "").trim();
    let type: DiscountType | null;
    if (typeRaw === "inherit") type = null;
    else if (typeRaw === "percent" || typeRaw === "fixed") type = typeRaw;
    else {
      toast.error(t("discountInvalid"));
      return;
    }
    let value: number | null = null;
    if (valueRaw) {
      const num = Number(valueRaw);
      if (!Number.isFinite(num) || num < 0) {
        toast.error(t("discountInvalid"));
        return;
      }
      value = type === "fixed" ? Math.round(num * 100) : Math.round(num);
    }
    if (type === "percent" && value !== null && value > 100) {
      toast.error(t("discountPercentMax"));
      return;
    }
    startTransition(async () => {
      const res = await overrideTeamMemberDiscount(
        eventId,
        profileId,
        type,
        value
      );
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      const synced = (res as { syncedCount?: number }).syncedCount ?? 0;
      const skipped = (res as { skippedUsedCount?: number }).skippedUsedCount ?? 0;
      toast.success(t("discountSavedToast", { synced, skipped }));
      router.refresh();
    });
  }

  return (
    <>
      {/* Event-level discount config */}
      <Card padding="md" className="mt-6 rounded-lg">
        <p className="text-base font-semibold">{t("eventConfigTitle")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("eventConfigDescription")}
        </p>

        <form
          onSubmit={handleSaveEventDiscount}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <Label htmlFor="discount_type">{t("discountTypeLabel")}</Label>
            <Select
              id="discount_type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            >
              <option value="percent">{t("discountTypePercent")}</option>
              <option value="fixed">{t("discountTypeFixed")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="discount_value">
              {discountType === "percent"
                ? t("discountValuePercent")
                : t("discountValueEuro")}
            </Label>
            <Input
              id="discount_value"
              type="number"
              min={0}
              step={discountType === "fixed" ? 0.01 : 1}
              value={discountValueRaw}
              onChange={(e) => setDiscountValueRaw(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>{t("applicableTiersLabel")}</Label>
            <div className="mt-2 space-y-2 rounded-md border border-border p-3">
              <label className="flex items-center gap-2 text-sm">
                <Input
                  type="radio"
                  name="applies_to"
                  checked={appliesToAll}
                  onChange={() => {
                    setAppliesToAll(true);
                    setSelectedTierIds([]);
                  }}
                />
                {t("applicableAllPublicTiers")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Input
                  type="radio"
                  name="applies_to"
                  checked={!appliesToAll}
                  onChange={() => setAppliesToAll(false)}
                />
                {t("applicableSpecificTiers")}
              </label>
              {!appliesToAll && (
                <div className="ml-6 mt-2 grid gap-1.5">
                  {tierOptions.map((tier) => (
                    <label
                      key={tier.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Input
                        type="checkbox"
                        checked={selectedTierIds.includes(tier.id)}
                        onChange={(e) => {
                          setSelectedTierIds((prev) =>
                            e.target.checked
                              ? [...prev, tier.id]
                              : prev.filter((id) => id !== tier.id)
                          );
                        }}
                      />
                      <span>
                        {tier.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          €{(tier.priceCents / 100).toFixed(0)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("saveEventConfig")}
            </Button>
          </div>
        </form>
      </Card>

      {/* Per-team-member matrix */}
      {summaries.length === 0 ? (
        <Card padding="md" className="mt-6 rounded-lg">
          <p className="text-sm text-muted-foreground">{t("noStaff")}</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("columns.teamMember")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("columns.role")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("columns.quota")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("columns.discount")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("columns.issued")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("columns.used")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const isExpanded = expandedProfileId === s.profileId;
                const discountLabel =
                  s.discountValue <= 0
                    ? "—"
                    : s.discountType === "percent"
                      ? `${s.discountValue}%`
                      : `€${(s.discountValue / 100).toFixed(0)}`;
                return (
                  <Fragment key={s.profileId}>
                    <tr className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{s.displayName}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.role}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{s.quota}</span>
                        {s.isQuotaOverride && (
                          <span className="ml-1 rounded-full bg-accent/30 px-1.5 py-0.5 text-[10px] font-medium">
                            {t("overrideBadge")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{discountLabel}</span>
                        {s.isDiscountOverride && (
                          <span className="ml-1 rounded-full bg-accent/30 px-1.5 py-0.5 text-[10px] font-medium">
                            {t("overrideBadge")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{s.issued}</td>
                      <td className="px-4 py-3">{s.used}</td>
                      <td className="px-4 py-3 text-right space-x-3">
                        {s.remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => handleGenerate(s.profileId)}
                            disabled={isPending}
                            className="text-xs text-primary hover:opacity-80"
                          >
                            {t("generate", { count: s.remaining })}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedProfileId(
                              isExpanded ? null : s.profileId
                            )
                          }
                          className="text-xs text-primary hover:opacity-80"
                        >
                          {isExpanded ? t("hide") : t("details")}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            {/* Issued codes */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("codes")}
                              </p>
                              {s.coupons.length === 0 ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {t("noneIssued")}
                                </p>
                              ) : (
                                <ul className="mt-2 space-y-1">
                                  {s.coupons.map((c) => (
                                    <li
                                      key={c.id}
                                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                                    >
                                      <span className="font-mono text-xs">
                                        {c.code}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground">
                                        {!c.isActive
                                          ? t("codeStatus.revoked")
                                          : c.timesUsed > 0
                                            ? t("codeStatus.used")
                                            : t("codeStatus.unused")}
                                      </span>
                                      {c.isActive && c.timesUsed === 0 && (
                                        <ConfirmDialog
                                          trigger={
                                            <button
                                              type="button"
                                              className="text-[11px] text-danger hover:opacity-80"
                                            >
                                              {t("revoke")}
                                            </button>
                                          }
                                          title={t("revokeConfirmTitle")}
                                          description={t("revokeConfirmDescription")}
                                          variant="danger"
                                          confirmLabel={t("revoke")}
                                          onConfirm={() => handleRevoke(c.id)}
                                        />
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Quota override */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("overrideQuota")}
                              </p>
                              <form
                                action={(fd) =>
                                  handleQuotaSubmit(s.profileId, fd)
                                }
                                className="mt-2 flex items-center gap-2"
                              >
                                <Input
                                  type="number"
                                  name="quota"
                                  min={0}
                                  defaultValue={s.quota}
                                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                                <Button type="submit" disabled={isPending}>
                                  {t("save")}
                                </Button>
                              </form>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {t("eventDefault", { defaultQuota })}
                              </p>
                            </div>

                            {/* Discount override */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("overrideDiscount")}
                              </p>
                              <form
                                action={(fd) =>
                                  handleDiscountOverrideSubmit(s.profileId, fd)
                                }
                                className="mt-2 flex items-center gap-2"
                              >
                                <Select
                                  name="override_type"
                                  defaultValue={
                                    s.isDiscountOverride ? s.discountType : "inherit"
                                  }
                                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                                >
                                  <option value="inherit">
                                    {t("inherit")}
                                  </option>
                                  <option value="percent">
                                    {t("discountTypePercent")}
                                  </option>
                                  <option value="fixed">
                                    {t("discountTypeFixed")}
                                  </option>
                                </Select>
                                <Input
                                  type="number"
                                  name="override_value"
                                  min={0}
                                  step={
                                    s.discountType === "fixed" ? 0.01 : 1
                                  }
                                  defaultValue={
                                    s.isDiscountOverride
                                      ? s.discountType === "fixed"
                                        ? (s.discountValue / 100).toFixed(2)
                                        : String(s.discountValue)
                                      : ""
                                  }
                                  placeholder={t("inherit")}
                                  className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                                <Button type="submit" disabled={isPending}>
                                  {t("save")}
                                </Button>
                              </form>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
