"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { UserRole } from "@dbc/types";
import { Card } from "@dbc/ui";
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

  function handleRemove(staffId: string) {
    if (!confirm(t.removeConfirm)) return;
    startTransition(async () => {
      await removeStaff(staffId, locale);
    });
  }

  function handleResendInvite(staffId: string) {
    startTransition(async () => {
      const res = await resendStaffInvite(staffId, locale);
      if (res.error) toast.error(res.error);
      else toast.success(t.resendInvite);
    });
  }

  function handleRevokeInvite(staffId: string) {
    if (!confirm(t.revokeConfirm)) return;
    startTransition(async () => {
      const res = await revokeStaffInvite(staffId, locale);
      if (res.error) toast.error(res.error);
      else toast.success(t.revoke);
    });
  }

  const t = {
    en: {
      invite: "Invite staff",
      inviteEmail: "Email address",
      inviteName: "Display name (optional)",
      inviteRole: "Role",
      sendInvite: "Send invite",
      sending: "Sending…",
      inviteSuccess: "Invite sent. They’ll receive a branded email with a sign-in link.",
      cancel: "Cancel",
      email: "Email",
      role: "Role",
      events: "Assigned events",
      actions: "Actions",
      assignEvents: "Assign events",
      remove: "Remove",
      resendInvite: "Resend invite",
      revoke: "Revoke",
      revokeConfirm: "Revoke this pending invite? The user record will be deleted.",
      removeConfirm:
        "Remove this person from staff? They will be demoted to buyer role and unassigned from all events.",
      noStaff: "No staff members yet. Invite someone to get started.",
      noEvents: "No events to assign.",
      member: "member",
      members: "members",
      teamMember: "Team member",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super admin",
    },
    de: {
      invite: "Mitarbeiter einladen",
      inviteEmail: "E-Mail-Adresse",
      inviteName: "Anzeigename (optional)",
      inviteRole: "Rolle",
      sendInvite: "Einladung senden",
      sending: "Wird gesendet…",
      inviteSuccess: "Einladung gesendet. Die Person erhält eine gebrandete E-Mail mit Anmeldelink.",
      cancel: "Abbrechen",
      email: "E-Mail",
      role: "Rolle",
      events: "Zugewiesene Veranstaltungen",
      actions: "Aktionen",
      assignEvents: "Veranstaltungen zuweisen",
      remove: "Entfernen",
      resendInvite: "Einladung erneut senden",
      revoke: "Widerrufen",
      revokeConfirm:
        "Diese offene Einladung widerrufen? Der Benutzereintrag wird gelöscht.",
      removeConfirm:
        "Diese Person aus dem Team entfernen? Sie wird auf die Rolle „Käufer“ herabgestuft und allen Veranstaltungen entzogen.",
      noStaff: "Noch keine Mitarbeiter.",
      noEvents: "Keine Veranstaltungen zum Zuweisen.",
      member: "Mitglied",
      members: "Mitglieder",
      teamMember: "Teammitglied",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super Admin",
    },
    fr: {
      invite: "Inviter un membre",
      inviteEmail: "Adresse e-mail",
      inviteName: "Nom d’affichage (optionnel)",
      inviteRole: "Rôle",
      sendInvite: "Envoyer l’invitation",
      sending: "Envoi…",
      inviteSuccess:
        "Invitation envoyée. La personne recevra un e-mail personnalisé avec un lien de connexion.",
      cancel: "Annuler",
      email: "E-mail",
      role: "Rôle",
      events: "Événements attribués",
      actions: "Actions",
      assignEvents: "Attribuer des événements",
      remove: "Retirer",
      resendInvite: "Renvoyer l’invitation",
      revoke: "Révoquer",
      revokeConfirm:
        "Révoquer cette invitation en attente ? Le compte utilisateur sera supprimé.",
      removeConfirm:
        "Retirer cette personne de l’équipe ? Son rôle repassera à « acheteur » et elle sera désassignée de tous les événements.",
      noStaff: "Aucun membre pour le moment.",
      noEvents: "Aucun événement à attribuer.",
      member: "membre",
      members: "membres",
      teamMember: "Membre",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super admin",
    },
  }[locale] ?? {
    invite: "Invite staff", inviteEmail: "Email", inviteName: "Name", inviteRole: "Role", sendInvite: "Send", sending: "…", inviteSuccess: "Sent", cancel: "Cancel",
    email: "Email", role: "Role", events: "Events", actions: "Actions", assignEvents: "Assign", remove: "Remove",
    resendInvite: "Resend invite", revoke: "Revoke", revokeConfirm: "Revoke?", removeConfirm: "Remove?",
    noStaff: "No staff", noEvents: "No events", member: "member", members: "members",
    teamMember: "Team", manager: "Manager", admin: "Admin", super_admin: "Super admin",
  };

  const roleLabels: Record<UserRole, string> = {
    buyer: "Buyer",
    team_member: t.teamMember,
    manager: t.manager,
    admin: t.admin,
    super_admin: t.super_admin,
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {staff.length} {staff.length === 1 ? t.member : t.members}
        </p>
        <button
          onClick={() => setInviteOpen((o) => !o)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.invite}
        </button>
      </div>

      {inviteSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          &#x2713; {t.inviteSuccess}
        </div>
      )}

      {/* Invite form */}
      {inviteOpen && (
        <Card padding="md" className="mt-4 rounded-lg">
          <form action={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {inviteError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t.inviteEmail}
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
                {t.inviteName}
              </label>
              <input
                type="text"
                name="display_name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t.inviteRole}
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
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? t.sending : t.sendInvite}
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t.cancel}
            </button>
          </div>
          </form>
        </Card>
      )}

      {/* Staff list */}
      {staff.length === 0 ? (
        <EmptyState message={t.noStaff} className="mt-12" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.email}</th>
                <th className="px-4 py-3 text-left font-medium">{t.role}</th>
                <th className="px-4 py-3 text-left font-medium">{t.events}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t.actions}
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
                          {t.assignEvents}
                        </button>
                        {!s.lastSignInAt ? (
                          <>
                            <button
                              onClick={() => handleResendInvite(s.id)}
                              disabled={isPending}
                              className="text-xs text-amber-600 hover:text-amber-700"
                            >
                              {t.resendInvite}
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(s.id)}
                              disabled={isPending}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              {t.revoke}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRemove(s.id)}
                            disabled={isPending}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            {t.remove}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={4} className="px-4 py-4">
                          {events.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t.noEvents}
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
