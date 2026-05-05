"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@dbc/ui";
import type { AdminModule, UserRole } from "@dbc/types";
import { canDo } from "@dbc/types";
import {
  updateStaffRole,
  assignStaffToEvent,
  unassignStaffFromEvent,
} from "@/actions/staff";

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  locale: string | null;
  created_at: string;
}

interface EventAssignment {
  id: string;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  starts_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
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

export function StaffDetailClient({
  profile,
  assignments,
  auditLog,
  allEvents,
  locale,
}: {
  profile: Profile;
  assignments: EventAssignment[];
  auditLog: AuditEntry[];
  allEvents: EventOption[];
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const assignedIds = new Set(assignments.map((a) => a.id));

  const t = {
    en: {
      profile: "Profile",
      email: "Email",
      role: "Role",
      locale: "Locale",
      memberSince: "Member since",
      eventAssignments: "Event assignments",
      recentActivity: "Recent activity",
      noActivity: "No recent activity.",
      scanner: "Scanner",
      doorSales: "Door sales",
      teamMember: "Team member",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super admin",
    },
    de: {
      profile: "Profil",
      email: "E-Mail",
      role: "Rolle",
      locale: "Sprache",
      memberSince: "Mitglied seit",
      eventAssignments: "Veranstaltungszuweisungen",
      recentActivity: "Letzte Aktivit\u00E4t",
      noActivity: "Keine Aktivit\u00E4t.",
      scanner: "Scanner",
      doorSales: "Kassenpersonal",
      teamMember: "Teammitglied",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super Admin",
    },
    fr: {
      profile: "Profil",
      email: "E-mail",
      role: "R\u00F4le",
      locale: "Langue",
      memberSince: "Membre depuis",
      eventAssignments: "Affectations",
      recentActivity: "Activit\u00E9 r\u00E9cente",
      noActivity: "Aucune activit\u00E9.",
      scanner: "Scanner",
      doorSales: "Caisse",
      teamMember: "Membre",
      manager: "Manager",
      admin: "Admin",
      super_admin: "Super admin",
    },
  }[locale] ?? {
    profile: "Profile", email: "Email", role: "Role", locale: "Locale",
    memberSince: "Member since", eventAssignments: "Events", recentActivity: "Activity",
    noActivity: "No activity.", scanner: "Scanner", doorSales: "Door sales",
    teamMember: "Team", manager: "Manager", admin: "Admin", super_admin: "Super admin",
  };

  const roleLabels: Record<UserRole, string> = {
    buyer: "Buyer",
    scanner: t.scanner,
    door_sales: t.doorSales,
    team_member: t.teamMember,
    manager: t.manager,
    admin: t.admin,
    super_admin: t.super_admin,
  };

  function handleRoleChange(role: UserRole) {
    startTransition(async () => {
      const res = await updateStaffRole(profile.id, role, locale);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleToggleEvent(eventId: string, assigned: boolean) {
    startTransition(async () => {
      if (assigned) {
        await unassignStaffFromEvent(profile.id, eventId, locale);
      } else {
        await assignStaffToEvent(profile.id, eventId, locale);
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Profile card */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.profile}
        </h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.email}</dt>
            <dd className="font-medium">{profile.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t.role}</dt>
            <dd>
              <select
                value={profile.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                disabled={isPending}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          {profile.locale && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.locale}</dt>
              <dd className="font-medium">{profile.locale.toUpperCase()}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.memberSince}</dt>
            <dd className="font-medium">
              {new Date(profile.created_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>
        <RoleCapabilitiesPanel role={profile.role} locale={locale} />
      </section>

      {/* Event assignments */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.eventAssignments}
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {allEvents.map((ev) => {
            const assigned = assignedIds.has(ev.id);
            return (
              <label
                key={ev.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={assigned}
                  disabled={isPending}
                  onChange={() => handleToggleEvent(ev.id, assigned)}
                  className="accent-primary"
                />
                <span>{ev.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(ev.startsAt).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Audit log */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.recentActivity}
        </h2>
        {auditLog.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.noActivity}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {entry.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.entity_type}
                    {entry.entity_id
                      ? ` #${entry.entity_id.slice(0, 8).toUpperCase()}`
                      : ""}
                  </p>
                </div>
                <Badge variant="default">
                  {new Date(entry.created_at).toLocaleString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Renders a checklist of modules the given role can read. Drives the
// "what this role can do" hint shown next to the role dropdown so the
// assigner can see the permission spread before saving.
const CAPABILITY_MODULES: { mod: AdminModule; key: string; label: { en: string; de: string; fr: string } }[] = [
  { mod: "scan",         key: "scan",         label: { en: "Scan tickets at the door",       de: "Tickets am Einlass scannen",          fr: "Scanner les billets à l'entrée" } },
  { mod: "doorSale",     key: "doorSale",     label: { en: "Sell walk-in tickets at the door", de: "Walk-In-Tickets am Einlass verkaufen", fr: "Vendre des billets à l'entrée" } },
  { mod: "events",       key: "events",       label: { en: "View events",                    de: "Events einsehen",                     fr: "Consulter les événements" } },
  { mod: "orders",       key: "orders",       label: { en: "View orders",                    de: "Bestellungen einsehen",               fr: "Consulter les commandes" } },
  { mod: "news",         key: "news",         label: { en: "Manage news + content",          de: "News & Inhalte verwalten",            fr: "Gérer les actualités & contenus" } },
  { mod: "newsletters",  key: "newsletters",  label: { en: "Send newsletters",               de: "Newsletter versenden",                fr: "Envoyer des newsletters" } },
  { mod: "contacts",     key: "contacts",     label: { en: "Manage CRM contacts",            de: "CRM-Kontakte verwalten",              fr: "Gérer les contacts CRM" } },
  { mod: "applications", key: "applications", label: { en: "Review applications",            de: "Bewerbungen sichten",                 fr: "Examiner les candidatures" } },
  { mod: "reports.marketing", key: "reportsMarketing", label: { en: "View marketing reports", de: "Marketing-Reports einsehen",         fr: "Consulter les rapports marketing" } },
  { mod: "reports.finance",   key: "reportsFinance",   label: { en: "View finance reports",   de: "Finanz-Reports einsehen",            fr: "Consulter les rapports finance" } },
  { mod: "jobOffers",    key: "jobOffers",    label: { en: "Post job offers",                de: "Stellenangebote veröffentlichen",     fr: "Publier des offres d'emploi" } },
  { mod: "staff",        key: "staff",        label: { en: "Manage staff",                   de: "Mitarbeiter verwalten",               fr: "Gérer le personnel" } },
  { mod: "companyInfo",  key: "companyInfo",  label: { en: "Edit company info",              de: "Unternehmensinfo bearbeiten",         fr: "Modifier les infos société" } },
  { mod: "legalPages",   key: "legalPages",   label: { en: "Edit legal pages",               de: "Rechtsseiten bearbeiten",             fr: "Modifier les pages légales" } },
  { mod: "settings",     key: "settings",     label: { en: "Edit app settings",              de: "App-Einstellungen bearbeiten",        fr: "Modifier les paramètres" } },
  { mod: "ads",          key: "ads",          label: { en: "Manage dashboard ads",           de: "Dashboard-Ads verwalten",             fr: "Gérer les annonces dashboard" } },
  { mod: "auditLog",     key: "auditLog",     label: { en: "View audit log",                 de: "Audit-Log einsehen",                  fr: "Consulter l'audit log" } },
];

function RoleCapabilitiesPanel({
  role,
  locale,
}: {
  role: UserRole;
  locale: string;
}) {
  const lang = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const heading = { en: "What this role can do", de: "Was diese Rolle kann", fr: "Ce que ce rôle peut faire" }[lang];

  return (
    <div className="mt-5 rounded-md border border-dashed border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      <ul className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
        {CAPABILITY_MODULES.map((cap) => {
          const allowed = canDo(role, cap.mod, "read");
          return (
            <li
              key={cap.key}
              className={`flex items-center gap-2 ${
                allowed ? "text-foreground" : "text-muted-foreground/60 line-through"
              }`}
            >
              <span aria-hidden className={allowed ? "text-primary" : "opacity-50"}>
                {allowed ? "✓" : "✗"}
              </span>
              <span>{cap.label[lang]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
