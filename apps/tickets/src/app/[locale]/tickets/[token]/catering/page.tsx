import { loadCateringContextForToken } from "@/actions/catering-selection";
import { CateringForm } from "./catering-form";

const T = {
  en: {
    title: "Pre-select your meal",
    intro:
      "Pick your dishes for the event. You can come back and update anytime up to the day before.",
    ticketNotFound: "We couldn't find that ticket. Double-check your link.",
    revoked: "This ticket has been revoked.",
    disabled: "Catering hasn't been set up for this event.",
    notEligible:
      "Catering isn't included with this ticket. Want catering? Upgrade your tier or contact us.",
    backToTicket: "← Back to your ticket",
  },
  de: {
    title: "Wähle dein Menü vor",
    intro:
      "Stelle dein Essen für die Veranstaltung zusammen. Du kannst deine Auswahl jederzeit bis zum Vortag ändern.",
    ticketNotFound:
      "Wir konnten dein Ticket nicht finden. Bitte prüfe den Link.",
    revoked: "Dieses Ticket wurde widerrufen.",
    disabled: "Catering ist für diese Veranstaltung nicht aktiviert.",
    notEligible:
      "Catering ist mit diesem Ticket nicht enthalten. Möchtest du Catering? Upgrade dein Ticket oder schreib uns.",
    backToTicket: "← Zurück zu deinem Ticket",
  },
  fr: {
    title: "Pré-sélectionnez votre repas",
    intro:
      "Choisissez vos plats pour l'événement. Vous pouvez revenir et modifier votre choix jusqu'à la veille.",
    ticketNotFound:
      "Nous n'avons pas trouvé ce billet. Vérifiez votre lien.",
    revoked: "Ce billet a été révoqué.",
    disabled: "La restauration n'est pas activée pour cet événement.",
    notEligible:
      "La restauration n'est pas incluse avec ce billet. Vous voulez l'inclure ? Upgradez votre billet ou contactez-nous.",
    backToTicket: "← Retour à votre billet",
  },
} as const;

export default async function CateringPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const lang = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = T[lang];

  const ctx = await loadCateringContextForToken(token);

  if (ctx.status === "ticket_not_found") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t.ticketNotFound}</p>
      </main>
    );
  }
  if (ctx.status === "ticket_revoked") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
        <p className="mt-4 text-sm text-danger">{t.revoked}</p>
      </main>
    );
  }
  if (ctx.status === "catering_disabled_for_event") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t.disabled}</p>
      </main>
    );
  }
  if (ctx.status === "not_eligible_for_this_ticket") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">
          {ctx.eventTitle ?? t.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ctx.attendeeName}
          {ctx.tierName ? ` · ${ctx.tierName}` : ""}
        </p>
        <p className="mt-6 rounded-md border border-muted bg-muted/20 p-4 text-sm">
          {t.notEligible}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        {t.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <strong>{ctx.eventTitle}</strong>
        {ctx.tierName ? ` · ${ctx.tierName}` : ""}
        {ctx.attendeeName ? ` · ${ctx.attendeeName}` : ""}
      </p>
      <p className="mt-4 text-sm leading-6">{t.intro}</p>

      <CateringForm
        locale={lang}
        token={token}
        menu={ctx.menu ?? []}
        initialSelectedIds={(ctx.currentSelections ?? []).map((s) => s.menu_item_id)}
        initialNotes={ctx.notesDefault ?? ""}
      />
    </main>
  );
}
