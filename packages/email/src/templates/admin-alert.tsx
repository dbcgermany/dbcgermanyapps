import { Heading, Link, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_QUESTIONS,
  FOOTER_SIGNATURE,
} from "./_layout";

interface AdminAlertEmailProps {
  subject: string;
  headline: string;
  body: string;
  details?: Record<string, string>;
  dashboardUrl?: string;
  severity?: "info" | "warning" | "critical";
  locale: "en" | "de" | "fr";
}

const T = {
  en: { open: "Open dashboard", severityLabel: "Severity" },
  de: { open: "Dashboard \u00F6ffnen", severityLabel: "Dringlichkeit" },
  fr: { open: "Ouvrir le tableau de bord", severityLabel: "Priorit\u00E9" },
};

const SEVERITY_COLOR = {
  info: "#0ea5e9",
  warning: "#f59e0b",
  critical: "#c8102e",
} as const;

export function AdminAlertEmail(props: AdminAlertEmailProps) {
  const t = T[props.locale];
  const severity = props.severity ?? "info";
  const color = SEVERITY_COLOR[severity];

  return (
    <EmailLayout
      locale={props.locale}
      preview={props.subject}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text
          className="m-0 mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: color }}
        >
          {severity}
        </Text>
        <Heading className="m-0 mt-2 text-lg font-semibold text-neutral-900">
          {props.headline}
        </Heading>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {props.body}
        </Text>
      </Section>

      {props.details && Object.keys(props.details).length > 0 && (
        <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          {Object.entries(props.details).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 6 }}>
              <Text className="m-0 text-xs uppercase tracking-wide text-neutral-500">
                {key}
              </Text>
              <Text className="m-0 text-sm text-neutral-900">{value}</Text>
            </div>
          ))}
        </Section>
      )}

      {props.dashboardUrl && (
        <Section className="mt-6">
          <Link
            href={props.dashboardUrl}
            className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
          >
            {t.open}
          </Link>
        </Section>
      )}
    </EmailLayout>
  );
}
