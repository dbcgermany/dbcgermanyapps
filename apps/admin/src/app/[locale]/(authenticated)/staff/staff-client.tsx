"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { UserRole } from "@dbc/types";
import { Button, Card, ConfirmDialog } from "@dbc/ui";
import {
  inviteStaff,
  updateStaffRole,
  assignStaffToEvent,
  unassignStaffFromEvent,
  removeStaff,
  resendStaffInvite,
  revokeStaffInvite,
} from "@/actions/staff";
import { EmptyState } from "@/components/empty-state";

interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedEventIds: string[];
  lastSignInAt: string | null;
}

interface EventOption {
  id: string;
  title: string;
  startsAt: string;
}

const ROLE_OPTIONS: UserRole[] = [
  "scanner",
  "door_sales",
  "team_member",
  "manager",
  "admin",
  "super_admin",
];

export function StaffClient({
  locale,
  staff,
  events,
}: {
  locale: string;
  staff: StaffMember[];
  events: EventOption[];
}) {
  const t = useTranslations("admin.staff.client");
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await inviteStaff(formData);
      if (res.error) setInviteError(res.error);
      else {
        setInviteSuccess(true);
        setInviteOpen(false);
      }
    });
  }

  function handleRoleChange(staffId: string, role: UserRole) {
    startTransition(async () => {
      await updateStaffRole(staffId, role, locale);
    });
  }

  function toggleAssignment(
    staffId: string,
    eventId: string,
    currentlyAssigned: boolean
  ) {
    startTransition(async () => {
      if (currentlyAssigned) {
        await unassignStaffFromEvent(staffId, eventId, locale);
      } else {
        await assignStaffToEvent(staffId, eventId, locale);
      }
    });
  }

  async function runRemove(staffId: string) {
    await removeStaff(staffId, locale);
  }

  function handleResendInvite(staffId: string) {
    startTransition(async () => {
      const res = await resendStaffInvite(staffId, locale);
      if (res.error) toast.error(res.error);
      else toast.success(t("resendInvite"));
    });
  }

  async function runRevokeInvite(staffId: string) {
    const res = await revokeStaffInvite(staffId, locale);
    if (res.error) toast.error(res.error);
    else toast.success(t("revoke"));
  }

  const roleLabels: Record<UserRole, string> = {
    buyer: "Buyer",
    scanner: t("scanner"),
    door_sales: t("doorSales"),
    team_member: t("teamMember"),
    manager: t("manager"),
    admin: t("admin"),
    super_admin: t("super_admin"),
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {staff.length} {staff.length === 1 ? t("member") : t("members")}
        </p>
        <Button onClick={() => setInviteOpen((o) => !o)}>
          {t("invite")}
        </Button>
      </div>

      {inviteSuccess && (
        <div className="mt-4 rounded-md bg-success-soft p-4 text-sm text-success">
          &#x2713; {t("inviteSuccess")}
        </div>
      )}

      {/* Invite form */}
      {inviteOpen && (
        <Card padding="md" className="mt-4 rounded-lg">
          <form action={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
              {inviteError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("inviteEmail")}
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("inviteName")}
              </label>
              <input
                type="text"
                name="display_name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("inviteRole")}
              </label>
              <select
                name="role"
                defaultValue="team_member"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit"
              disabled={isPending}>
              {isPending ? t("sending") : t("sendInvite")}
            </Button>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t("cancel")}
            </button>
          </div>
          </form>
        </Card>
      )}

      {/* Staff list */}
      {staff.length === 0 ? (
        <EmptyState message={t("noStaff")} className="mt-12" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("email")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("role")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("events")}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const isExpanded = expandedStaffId === s.id;

                return (
                  <Fragment key={s.id}>
                    <tr
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/${locale}/staff/${s.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {s.displayName || s.email}
                        </Link>
                        {s.displayName && (
                          <p className="text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={s.role}
                          onChange={(e) =>
                            handleRoleChange(s.id, e.target.value as UserRole)
                          }
                          disabled={isPending}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {roleLabels[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.assignedEventIds.length}
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() =>
                            setExpandedStaffId(isExpanded ? null : s.id)
                          }
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          {t("assignEvents")}
                        </button>
                        {!s.lastSignInAt ? (
                          <>
                            <button
                              onClick={() => handleResendInvite(s.id)}
                              disabled={isPending}
                              className="text-xs text-warning hover:opacity-80"
                            >
                              {t("resendInvite")}
                            </button>
                            <ConfirmDialog
                              trigger={
                                <button
                                  type="button"
                                  disabled={isPending}
                                  className="text-xs text-danger hover:opacity-80"
                                >
                                  {t("revoke")}
                                </button>
                              }
                              title={t("revoke")}
                              description={t("revokeConfirm")}
                              variant="danger"
                              confirmLabel={t("revoke")}
                              onConfirm={() =>
                                startTransition(() => runRevokeInvite(s.id))
                              }
                            />
                          </>
                        ) : (
                          <ConfirmDialog
                            trigger={
                              <button
                                type="button"
                                disabled={isPending}
                                className="text-xs text-danger hover:opacity-80"
                              >
                                {t("remove")}
                              </button>
                            }
                            title={t("remove")}
                            description={t("removeConfirm")}
                            variant="danger"
                            confirmLabel={t("remove")}
                            onConfirm={() =>
                              startTransition(() => runRemove(s.id))
                            }
                          />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={4} className="px-4 py-4">
                          {events.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t("noEvents")}
                            </p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {events.map((ev) => {
                                const assigned = s.assignedEventIds.includes(
                                  ev.id
                                );
                                return (
                                  <label
                                    key={ev.id}
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={assigned}
                                      disabled={isPending}
                                      onChange={() =>
                                        toggleAssignment(
                                          s.id,
                                          ev.id,
                                          assigned
                                        )
                                      }
                                      className="accent-primary"
                                    />
                                    <span>{ev.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(
                                        ev.startsAt
                                      ).toLocaleDateString(locale, {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
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
    </div>
  );
}
