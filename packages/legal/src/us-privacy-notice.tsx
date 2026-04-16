// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by counsel.
// Version: packages/legal/src/version.ts.

import type { PublicCompanyInfo } from "./company";
import { formatRegisteredAddress } from "./company";
import { LEGAL_LAST_UPDATED } from "./version";

export function UsPrivacyNotice({
  company,
  privacyUrl,
}: {
  company: PublicCompanyInfo | null;
  privacyUrl: string;
}) {
  const c = company;
  const privacyEmail = c?.privacy_email ?? c?.primary_email ?? "";

  return (
    <article>
      <h1>US Privacy Notice</h1>
      <p className="lead">
        Supplemental privacy notice for residents of the United States, including
        California, Virginia, Colorado, Connecticut, Utah, and other states with
        comprehensive privacy legislation.
      </p>

      <h2>Scope</h2>
      <p>
        This notice supplements our{" "}
        <a href={privacyUrl}>Privacy Policy</a> and applies to personal
        information collected from US residents through our websites and
        services.
      </p>

      <h2>Categories of personal information we collect</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>CCPA category</th>
              <th>Examples</th>
              <th>Source</th>
              <th>Business purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Identifiers</td>
              <td>Name, email, phone number, IP address</td>
              <td>Directly from you; automatically collected</td>
              <td>Account management, ticket fulfillment, customer support</td>
            </tr>
            <tr>
              <td>Customer records (Cal. Civ. Code § 1798.80(e))</td>
              <td>Name, address, phone, payment confirmation (no card numbers)</td>
              <td>Directly from you; payment processor (Stripe)</td>
              <td>Order processing, invoicing, tax compliance</td>
            </tr>
            <tr>
              <td>Commercial information</td>
              <td>Ticket purchases, order history, transaction amounts</td>
              <td>Generated from your use of services</td>
              <td>Service delivery, analytics, customer support</td>
            </tr>
            <tr>
              <td>Internet / electronic network activity</td>
              <td>Browser type, pages visited, timestamps</td>
              <td>Automatically collected (server logs)</td>
              <td>Security, debugging, service improvement</td>
            </tr>
            <tr>
              <td>Geolocation data</td>
              <td>Approximate location derived from IP address</td>
              <td>Automatically collected</td>
              <td>Locale/language detection, fraud prevention</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>We do not sell or share your personal information</h2>
      <p>
        <strong>
          We do not sell personal information. We do not share personal
          information for cross-context behavioral advertising.
        </strong>{" "}
        We have not sold or shared personal information in the preceding 12
        months. Accordingly, no opt-out mechanism for sale or sharing is
        required.
      </p>

      <h2>Your rights under US state privacy laws</h2>
      <p>
        Depending on your state of residence, you may have the following rights:
      </p>
      <ul>
        <li>
          <strong>Right to know / access</strong>: request disclosure of the
          categories and specific pieces of personal information we have
          collected about you.
        </li>
        <li>
          <strong>Right to delete</strong>: request deletion of your personal
          information, subject to certain legal exceptions (e.g., tax retention
          obligations).
        </li>
        <li>
          <strong>Right to correct</strong>: request correction of inaccurate
          personal information.
        </li>
        <li>
          <strong>Right to limit use of sensitive personal information</strong>:
          we do not use sensitive personal information beyond what is necessary
          to provide our services.
        </li>
        <li>
          <strong>Right to non-discrimination</strong>: we will not discriminate
          against you for exercising any of these rights.
        </li>
        <li>
          <strong>Right to opt out of sale/sharing</strong>: not applicable — we
          do not sell or share personal information.
        </li>
      </ul>

      <h2>How to submit a request</h2>
      <p>
        To submit a verifiable consumer request, you may:
      </p>
      <ul>
        <li>
          Email us at{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> with the
          subject line &quot;US Privacy Request&quot;.
        </li>
        <li>
          Use your account self-service settings to access, correct, or delete
          your data.
        </li>
      </ul>
      <p>
        We will verify your identity by matching the information in your request
        against data we already hold. You may designate an authorized agent to
        submit a request on your behalf; the agent must present a valid power of
        attorney or your signed written authorization.
      </p>

      <h2>Response timing</h2>
      <p>
        We will respond to verifiable consumer requests within 45 days of
        receipt. If additional time is needed, we will notify you of the reason
        and extension period (up to an additional 45 days).
      </p>

      <h2>Financial incentives</h2>
      <p>
        We do not offer financial incentives (including prices, rates, service
        levels, or quality) related to the collection, retention, sale, or
        deletion of personal information.
      </p>

      <h2>Sensitive personal information</h2>
      <p>
        We do not collect or process sensitive personal information as defined
        under the CCPA/CPRA for purposes beyond what is necessary to perform the
        services you have requested.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about this notice or to exercise your rights, contact:
      </p>
      {c && (
        <address className="not-italic whitespace-pre-line">
          {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
          {"\n"}{formatRegisteredAddress(c)}
          {"\n"}{privacyEmail}
        </address>
      )}

      <hr />
      <p className="text-xs text-muted-foreground">
        Last updated: {LEGAL_LAST_UPDATED.en}
      </p>
    </article>
  );
}
