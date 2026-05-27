import { Section, Text, Link, Hr } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface AffiliateWelcomeEmailProps {
  recipientName: string;
  eventTitle: string;
  commissionPct: number;
  couponCode: string | null;
  goals?:
    | Array<{
        target_count: number;
        tier_name: string;
        reward_count: number;
        reward_tier_name: string;
      }>
    | null;
  referralUrl: string;
  dashboardUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Welcome to the {event} affiliate program",
    greeting: "Hi {name},",
    intro:
      "You're confirmed as an affiliate partner for {event}. Here are the two links you'll use during this campaign — please read carefully so you share the right one.",
    goalsTitle: "Free tickets you can earn",
    goalsLine:
      "Sell {target} × {tier} → get {rewardCount} × {reward} free for yourself",
    goalsNote:
      "We'll send you the free-ticket codes manually once you hit each target.",
    sharingTitle: "Your sharing link",
    sharingBody:
      "Share this anywhere — Instagram bio, WhatsApp, newsletters, business cards. Your audience gets your discount code automatically applied at checkout, and you get credit for every sale.",
    sharingCta: "Open your sharing link",
    privateTitle: "Your private dashboard",
    privateBody:
      "Bookmark this URL. Only you should have it. It shows your live conversions, earnings, and upcoming payouts. It auto-closes 20 days after the event ends.",
    privateCta: "Open your dashboard",
    detailsTitle: "Your details",
    commissionLabel: "Commission",
    codeLabel: "Your discount code",
    eventLabel: "Event",
    footer:
      "Payouts are by bank transfer after the event. Any questions, just reply to this email.",
    closing: "Welcome aboard,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Willkommen im Affiliate-Programm zu {event}",
    greeting: "Hallo {name},",
    intro:
      "Du bist als Affiliate-Partner für {event} bestätigt. Hier sind die zwei Links, die du in dieser Kampagne nutzt — bitte lies sie sorgfältig, damit du den richtigen teilst.",
    goalsTitle: "Gratis-Tickets, die du verdienen kannst",
    goalsLine:
      "Verkaufe {target} × {tier} → erhalte {rewardCount} × {reward} gratis für dich",
    goalsNote:
      "Sobald du ein Ziel erreichst, senden wir dir den Gratis-Ticket-Code manuell zu.",
    sharingTitle: "Dein Sharing-Link",
    sharingBody:
      "Teile diesen Link überall — Instagram-Bio, WhatsApp, Newsletter, Visitenkarten. Deine Zielgruppe bekommt deinen Rabattcode beim Checkout automatisch angewendet, und du erhältst Credit für jeden Verkauf.",
    sharingCta: "Sharing-Link öffnen",
    privateTitle: "Dein privates Dashboard",
    privateBody:
      "Bookmarke diese URL. Nur du solltest sie haben. Sie zeigt deine Live-Conversions, Einnahmen und ausstehenden Auszahlungen. Sie schließt automatisch 20 Tage nach Eventende.",
    privateCta: "Dashboard öffnen",
    detailsTitle: "Deine Details",
    commissionLabel: "Provision",
    codeLabel: "Dein Rabattcode",
    eventLabel: "Veranstaltung",
    footer:
      "Auszahlungen erfolgen per Banküberweisung nach dem Event. Bei Fragen einfach auf diese E-Mail antworten.",
    closing: "Herzlich willkommen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Bienvenue dans le programme d'affiliation pour {event}",
    greeting: "Bonjour {name},",
    intro:
      "Vous êtes confirmé comme partenaire affilié pour {event}. Voici les deux liens que vous utiliserez pendant cette campagne — lisez attentivement pour partager le bon.",
    goalsTitle: "Billets gratuits à débloquer",
    goalsLine:
      "Vendez {target} × {tier} → recevez {rewardCount} × {reward} gratuit(s) pour vous-même",
    goalsNote:
      "Dès qu'un objectif est atteint, nous vous enverrons le code manuellement.",
    sharingTitle: "Votre lien de partage",
    sharingBody:
      "Partagez ce lien partout — bio Instagram, WhatsApp, newsletters, cartes de visite. Votre audience reçoit votre code de réduction appliqué automatiquement au paiement, et vous obtenez le crédit pour chaque vente.",
    sharingCta: "Ouvrir le lien de partage",
    privateTitle: "Votre tableau de bord privé",
    privateBody:
      "Mettez cette URL dans vos favoris. Seul vous devriez l'avoir. Elle affiche vos conversions en direct, vos gains et vos paiements à venir. Elle se ferme automatiquement 20 jours après la fin de l'événement.",
    privateCta: "Ouvrir le tableau de bord",
    detailsTitle: "Vos informations",
    commissionLabel: "Commission",
    codeLabel: "Votre code de réduction",
    eventLabel: "Événement",
    footer:
      "Les paiements se font par virement bancaire après l'événement. Pour toute question, répondez simplement à cet e-mail.",
    closing: "Bienvenue à bord,",
    team: "L'équipe DBC Germany",
  },
} as const;

export function AffiliateWelcomeEmail(props: AffiliateWelcomeEmailProps) {
  const t = T[props.locale];
  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview.replace("{event}", props.eventTitle)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.recipientName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.intro.replace("{event}", props.eventTitle)}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-2 text-base font-semibold text-neutral-900">
          {t.sharingTitle}
        </Text>
        <Text className="m-0 mb-3 text-sm leading-6 text-neutral-700">
          {t.sharingBody}
        </Text>
        <Link
          href={props.referralUrl}
          className="inline-block rounded bg-[#c8102e] px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          {t.sharingCta}
        </Link>
        <Text className="m-0 mt-3 break-all font-mono text-xs text-neutral-600">
          {props.referralUrl}
        </Text>
      </Section>

      <Section className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-2 text-base font-semibold text-neutral-900">
          {t.privateTitle}
        </Text>
        <Text className="m-0 mb-3 text-sm leading-6 text-neutral-700">
          {t.privateBody}
        </Text>
        <Link
          href={props.dashboardUrl}
          className="inline-block rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 no-underline"
        >
          {t.privateCta}
        </Link>
        <Text className="m-0 mt-3 break-all font-mono text-xs text-neutral-600">
          {props.dashboardUrl}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 p-5">
        <Text className="m-0 mb-3 text-sm font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <Text className="m-0 my-1 text-sm text-neutral-700">
          <span className="text-neutral-500">{t.eventLabel}:</span>{" "}
          {props.eventTitle}
        </Text>
        {props.commissionPct > 0 && (
          <Text className="m-0 my-1 text-sm text-neutral-700">
            <span className="text-neutral-500">{t.commissionLabel}:</span>{" "}
            {props.commissionPct}%
          </Text>
        )}
        {props.couponCode && (
          <Text className="m-0 my-1 text-sm text-neutral-700">
            <span className="text-neutral-500">{t.codeLabel}:</span>{" "}
            <span className="font-mono">{props.couponCode}</span>
          </Text>
        )}
      </Section>

      {props.goals && props.goals.length > 0 && (
        <Section className="mt-4 rounded-lg border border-neutral-200 p-5">
          <Text className="m-0 mb-2 text-sm font-semibold text-neutral-900">
            {t.goalsTitle}
          </Text>
          {props.goals.map((g, i) => (
            <Text key={i} className="m-0 my-1 text-sm text-neutral-700">
              ·{" "}
              {t.goalsLine
                .replace("{target}", String(g.target_count))
                .replace("{tier}", g.tier_name)
                .replace("{rewardCount}", String(g.reward_count))
                .replace("{reward}", g.reward_tier_name)}
            </Text>
          ))}
          <Text className="mt-3 text-xs text-neutral-500">{t.goalsNote}</Text>
        </Section>
      )}

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-700">{t.footer}</Text>
      </Section>

      <Section className="mt-8">
        <Text className="m-0 text-sm text-neutral-800">{t.closing}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}
