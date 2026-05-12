"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, ConfirmDialog } from "@dbc/ui";
import {
  issueTeamFriendCoupons,
  overrideTeamMemberQuota,
  revokeTeamFriendCoupon,
  type TeamMemberInviteSummary,
} from "@/actions/team-friend-invites";

export function TeamInvitesClient({
  eventId,
  defaultQuota,
  summaries,
}: {
  eventId: string;
  defaultQuota: number;
  summaries: TeamMemberInviteSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  function handleGenerate(profileId: string) {
    startTransition(async () => {
      const res = await issueTeamFriendCoupons(eventId, profileId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          res.created
            ? `${res.created} code${res.created === 1 ? "" : "s"} generated`
            : res.message ?? "Up to date"
        );
        router.refresh();
      }
    });
  }

  function handleRevoke(couponId: string) {
    startTransition(async () => {
      const res = await revokeTeamFriendCoupon(couponId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Code revoked");
        router.refresh();
      }
    });
  }

  function handleQuotaSubmit(profileId: string, formData: FormData) {
    const raw = (formData.get("quota") as string) || "";
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Quota must be a non-negative integer");
      return;
    }
    startTransition(async () => {
      const res = await overrideTeamMemberQuota(eventId, profileId, parsed);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Quota updated");
        router.refresh();
      }
    });
  }

  if (summaries.length === 0) {
    return (
      <Card padding="md" className="mt-6 rounded-lg">
        <p className="text-sm text-muted-foreground">
          No staff profiles found.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Team member</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Quota</th>
            <th className="px-4 py-3 text-left font-medium">Issued</th>
            <th className="px-4 py-3 text-left font-medium">Used</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => {
            const isExpanded = expandedProfileId === s.profileId;
            return (
              <>
                <tr
                  key={s.profileId}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.displayName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.role}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.quota}</span>
                    {s.isOverride && (
                      <span className="ml-1 rounded-full bg-accent/30 px-1.5 py-0.5 text-[10px] font-medium">
                        override
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
                        Generate {s.remaining}
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
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-muted/20">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Codes
                          </p>
                          {s.coupons.length === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              None issued yet.
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
                                      ? "Revoked"
                                      : c.timesUsed > 0
                                        ? "Used"
                                        : "Unused"}
                                  </span>
                                  {c.isActive && c.timesUsed === 0 && (
                                    <ConfirmDialog
                                      trigger={
                                        <button
                                          type="button"
                                          className="text-[11px] text-danger hover:opacity-80"
                                        >
                                          Revoke
                                        </button>
                                      }
                                      title="Revoke code"
                                      description="The code will stop working immediately."
                                      variant="danger"
                                      confirmLabel="Revoke"
                                      onConfirm={() => handleRevoke(c.id)}
                                    />
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Override quota
                          </p>
                          <form
                            action={(fd) => handleQuotaSubmit(s.profileId, fd)}
                            className="mt-2 flex items-center gap-2"
                          >
                            <input
                              type="number"
                              name="quota"
                              min={0}
                              defaultValue={s.quota}
                              className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                            />
                            <Button type="submit" disabled={isPending}>
                              Save
                            </Button>
                            <span className="text-[11px] text-muted-foreground">
                              Event default: {defaultQuota}
                            </span>
                          </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
