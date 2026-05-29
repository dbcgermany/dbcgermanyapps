"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { UserRole } from "@dbc/types";
import { Button, Card, ConfirmDialog, Input, Select } from "@dbc/ui";
import {
  inviteStaff,
  updateStaffRole,
  assignStaffToEvent,
  unassignStaffFromEvent,
  removeStaff,
  resendStaffInvite,
  revokeStaffInvite,
  assignRoleAndResendInvite,
  createStaffWithoutInvite,
  pauseStaff,
  unpauseStaff,
} from "@/actions/staff";
import { EmptyState } from "@/components/empty-state";

interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedEventIds: string[];
  lastSignInAt: string | null;
  bannedUntil: string | null;
}

interface EventOption {
  id: string;
  title: string;
  startsAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  displayName: string;
  invitedAt: string | null;
  currentRole: UserRole;
  alreadySignedIn: boolean;
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
  pendingInvitations,
}: {
  locale: string;
  staff: StaffMember[];
  events: EventOption[];
  pendingInvitations: PendingInvitation[];
}) {
  const t = useTranslations("admin.staff.client");
  const router = useRouter();
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
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

  function handleCreate(formData: FormData) {
    setCreateError(null);
    startTransition(async () => {
      const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
      const res = await createStaffWithoutInvite(formData);
      if (res.error) {
        setCreateError(res.error);
      } else if (res.success && res.password) {
        setCreatedCredentials({ email, password: res.password });
        setCreateOpen(false);
      }
    });
  }

  function handleRoleChange(staffId: string, role: UserRole) {
    startTransition(async () => {
      const res = await updateStaffRole(staffId, role, locale);
      if (res.error) {
        toast.error(t("actionFailed", { error: res.error }));
        // Force a re-fetch so the dropdown reverts to the server's truth.
        router.refresh();
      } else {
        toast.success(t("roleUpdated"));
        router.refresh();
      }
    });
  }

  function toggleAssignment(
    staffId: string,
    eventId: string,
    currentlyAssigned: boolean
  ) {
    startTransition(async () => {
      const res = currentlyAssigned
        ? await unassignStaffFromEvent(staffId, eventId, locale)
        : await assignStaffToEvent(staffId, eventId, locale);
      if (res?.error) {
        toast.error(t("actionFailed", { error: res.error }));
        router.refresh();
      } else {
        toast.success(t("eventAssignmentSaved"));
        router.refresh();
      }
    });
  }

  function handleRemove(staffId: string) {
    startTransition(async () => {
      const res = await removeStaff(staffId, locale);
      if (res?.error) {
        toast.error(t("actionFailed", { error: res.error }));
      } else {
        toast.success(t("removed"));
        router.refresh();
      }
    });
  }

  function handleResendInvite(staffId: string) {
    startTransition(async () => {
      const res = await resendStaffInvite(staffId, locale);
      if (res.error) toast.error(res.error);
      else toast.success(t("resendInvite"));
    });
  }

  function handlePauseToggle(staffId: string, currentlyPaused: boolean) {
    startTransition(async () => {
      const res = currentlyPaused
        ? await unpauseStaff(staffId, locale)
        : await pauseStaff(staffId, locale);
      if (res.error) {
        toast.error(t("actionFailed", { error: res.error }));
        return;
      }
      toast.success(currentlyPaused ? t("unpaused") : t("paused"));
      router.refresh();
    });
  }

  // Per-pending-invite role draft (defaults to team_member); admin
  // changes it via the inline dropdown before clicking the resend button.
  const [pendingRoleDraft, setPendingRoleDraft] = useState<
    Record<string, UserRole>
  >(
    Object.fromEntries(
      pendingInvitations.map((p) => [p.id, "team_member" as UserRole])
    )
  );

  function handlePendingResend(userId: string) {
    const role = pendingRoleDraft[userId] ?? "team_member";
    startTransition(async () => {
      const res = await assignRoleAndResendInvite(userId, role, locale);
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setCreateOpen((o) => !o);
              setInviteOpen(false);
            }}
          >
            Create user
          </Button>
          <Button
            onClick={() => {
              setInviteOpen((o) => !o);
              setCreateOpen(false);
            }}
          >
            {t("invite")}
          </Button>
        </div>
      </div>

      {inviteSuccess && (
        <div className="mt-4 rounded-md bg-success-soft p-4 text-sm text-success">
          &#x2713; {t("inviteSuccess")}
        </div>
      )}

      {createdCredentials && (
        <Card padding="md" className="mt-4 rounded-lg border border-success-border bg-success-soft/40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-success">
                Account created — credentials below were emailed to the user
              </p>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              The user will be asked to set a new password on first login.
              Copy these now — they will not be shown again.
            </p>
            <div className="grid gap-2 rounded-md bg-background p-3 font-mono text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials.email);
                    toast.success(t("emailCopied"));
                  }}
                  className="text-foreground hover:text-primary"
                >
                  {createdCredentials.email}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Temp password</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials.password);
                    toast.success(t("passwordCopied"));
                  }}
                  className="text-foreground hover:text-primary"
                >
                  {createdCredentials.password}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Invite form (link-based) */}
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
              <Input
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
              <Input
                type="text"
                name="display_name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t("inviteRole")}
              </label>
              <Select
                name="role"
                defaultValue="team_member"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </Select>
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

      {/* Create-user (no invite link) — admin sets up the account directly
          with a generated password. The credentials are emailed to the user
          and displayed once above for the admin to share out-of-band. */}
      {createOpen && (
        <Card padding="md" className="mt-4 rounded-lg">
          <form action={handleCreate} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Create user without invite link</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Generates a temporary password, emails the user, and forces a
                password change on their first sign-in.
              </p>
            </div>
            {createError && (
              <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
                {createError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Role
                </label>
                <Select
                  name="role"
                  defaultValue="team_member"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  First name
                </label>
                <Input
                  type="text"
                  name="first_name"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Last name
                </label>
                <Input
                  type="text"
                  name="last_name"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Locale
                </label>
                <Select
                  name="locale"
                  defaultValue="de"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create user"}
              </Button>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending invitations — auth users invited via the Supabase
          dashboard or whose role was never promoted past 'buyer'. The
          existing staff list filters by staff role so they're invisible
          there. Each row carries a Set-role + Resend-invite combo so
          admins can finish the onboarding in one click. */}
      {pendingInvitations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            Pending invitations · {pendingInvitations.length}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Invited via the admin but stuck on the buyer role. Pick a role
            and click the action to promote them — a fresh invite link is
            sent if they haven&apos;t signed in yet.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-warning-border">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-border bg-warning-soft/40">
                  <th className="px-4 py-3 text-left font-medium">{t("email")}</th>
                  <th className="px-4 py-3 text-left font-medium">Invited</th>
                  <th className="px-4 py-3 text-left font-medium">Set role</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.displayName || p.email}</p>
                      {p.displayName && (
                        <p className="text-xs text-muted-foreground">
                          {p.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span>
                        {p.invitedAt
                          ? new Date(p.invitedAt).toLocaleDateString(locale, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                      {p.alreadySignedIn && (
                        <span className="ml-2 inline-flex items-center rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-foreground">
                          Signed in
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={pendingRoleDraft[p.id] ?? "team_member"}
                        onChange={(e) =>
                          setPendingRoleDraft((prev) => ({
                            ...prev,
                            [p.id]: e.target.value as UserRole,
                          }))
                        }
                        disabled={isPending}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handlePendingResend(p.id)}
                        disabled={isPending}
                        className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        {p.alreadySignedIn
                          ? "Set role"
                          : "Set role & resend invite"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                const isPaused = !!s.bannedUntil;

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
                        <div className="flex items-center gap-2">
                          <Select
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
                          </Select>
                          {isPaused && (
                            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                              Paused
                            </span>
                          )}
                        </div>
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
                        <Link
                          href={`/${locale}/staff/${s.id}`}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          Manage
                        </Link>
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
                          <>
                            <ConfirmDialog
                              trigger={
                                <button
                                  type="button"
                                  disabled={isPending}
                                  className="text-xs text-warning hover:opacity-80"
                                >
                                  {isPaused ? "Unpause" : "Pause"}
                                </button>
                              }
                              title={isPaused ? "Unpause account" : "Pause account"}
                              description={
                                isPaused
                                  ? "Restore the user's access. They will receive an email letting them know."
                                  : "Block sign-in and revoke any active sessions. The user will be emailed."
                              }
                              variant="danger"
                              confirmLabel={isPaused ? "Unpause" : "Pause"}
                              onConfirm={() => handlePauseToggle(s.id, isPaused)}
                            />
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
                                handleRemove(s.id)
                              }
                            />
                          </>
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
                                    <Input
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
