import { requireRole } from "@dbc/supabase/server";
import {
  Building2,
  Briefcase,
  Globe,
  Layers,
  Mail,
  ExternalLink,
} from "lucide-react";

export default async function DevInfoPage() {
  await requireRole("super_admin");

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Dev Info
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          About Narikia UG
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The studio that designed and built the DBC Germany platform — this
          page is visible to super-admins only.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card icon={Building2} title="About Narikia UG">
          <p>
            <strong>Narikia UG (i.G.)</strong> is a software studio building
            event technology, ticketing platforms, and admin systems for
            African-rooted organizations operating in Europe.
          </p>
          <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Founders</dt>
            <dd>
              Gerald Ngongo Kalala &middot; Geschäftsführer und Gründer
              <br />
              Fanny Kananga Kumande &middot; Geschäftsführerin und Gründerin
            </dd>
            <dt className="text-muted-foreground">Headquarters</dt>
            <dd>Düsseldorf, Germany</dd>
            <dt className="text-muted-foreground">Founded</dt>
            <dd>2026</dd>
            <dt className="text-muted-foreground">Handelsregister</dt>
            <dd>In Gründung — HRB to be published once issued</dd>
          </dl>
          <p className="mt-4 text-sm italic text-muted-foreground">
            We build the software platforms that event companies and
            community-driven organizations actually need to operate at a
            premium standard.
          </p>
        </Card>

        <Card icon={Briefcase} title="What Narikia builds">
          <ul className="grid gap-2 text-sm">
            <li>Event ticketing platforms (with Stripe, multilingual, atomic inventory)</li>
            <li>Admin dashboards with real-time KPIs and reports</li>
            <li>AI-powered automations for content, newsletters, and CRM</li>
            <li>Multilingual marketing sites (EN / DE / FR and beyond)</li>
            <li>Internal operations tooling (scan apps, door-sale, team CRM)</li>
            <li>Legal-compliant web infrastructure (Impressum, GDPR, DSGVO)</li>
          </ul>
        </Card>

        <Card icon={Mail} title="Contact & website">
          <div className="space-y-3 text-sm">
            <p>
              <a
                href="https://narikia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                narikia.com
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              <a
                href="mailto:contact@narikia.com"
                className="font-medium text-foreground hover:text-primary"
              >
                contact@narikia.com
              </a>
            </p>
            <p className="text-muted-foreground">
              For anything involving this platform — bugs, feature requests,
              or engagement — reach Narikia directly.
            </p>
          </div>
        </Card>

        <Card icon={Layers} title="Tech stack powering DBC Germany">
          <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            <li>Next.js 16 (App Router) + React 19</li>
            <li>TypeScript</li>
            <li>Supabase (Postgres + Auth + Storage + RLS)</li>
            <li>Stripe Checkout + webhooks</li>
            <li>Resend (transactional email)</li>
            <li>next-intl (EN / DE / FR)</li>
            <li>Tailwind CSS 4</li>
            <li>lucide-react (icons)</li>
            <li>Vercel (hosting + cron)</li>
            <li>Cloudflare Turnstile</li>
            <li>@react-pdf/renderer (ticket PDFs)</li>
            <li>Recharts (analytics)</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Three apps deployed: <code>admin.dbc-germany.com</code>,{" "}
            <code>tickets.dbc-germany.com</code>, <code>dbc-germany.com</code>.
            Shared packages under <code>packages/</code>.
          </p>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Globe className="h-4 w-4" strokeWidth={1.75} />
          <span>
            Built and maintained by{" "}
            <a
              href="https://narikia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary"
            >
              Narikia UG
            </a>
            .
          </span>
        </p>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 className="font-heading text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-4 text-sm text-foreground/90">{children}</div>
    </div>
  );
}
