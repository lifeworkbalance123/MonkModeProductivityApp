import type { Metadata } from "next"
import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal-document-layout"

export const metadata: Metadata = {
  title: "Terms of Service | MonkMode",
  description:
    "Terms governing use of the MonkMode productivity app, Free vs Pro plans, and payments.",
}

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="April 2026">
      <LegalSection title="Acceptance of terms">
        <p>
          By accessing or using MonkMode (the &quot;Service&quot;), you agree to these Terms of
          Service. If you do not agree, do not use the Service. We may update these terms from time
          to time; the &quot;Last updated&quot; date above will change, and your continued use after
          changes become effective constitutes acceptance where allowed by law.
        </p>
      </LegalSection>

      <LegalSection title="Description of service">
        <p>
          MonkMode is a productivity and personal organization application. It is provided for
          general information and self-management purposes only.{" "}
          <strong>
            MonkMode is not a medical, mental health, or therapeutic service and does not provide
            clinical advice, diagnosis, or treatment.
          </strong>{" "}
          If you need professional support, consult a qualified provider.
        </p>
      </LegalSection>

      <LegalSection title="Free vs Pro plans">
        <p>
          <strong>Free tier:</strong> Includes core MonkMode features as described in the app or
          on our website at the time you use them. Some data may be stored locally in your browser
          rather than in the cloud.
        </p>
        <p>
          <strong>Pro tier:</strong> Includes additional features such as cloud sync, advanced
          modules, or other capabilities we designate as Pro. Exact features may evolve; we will
          use reasonable efforts to communicate material changes (for example via the app,
          website, or email).
        </p>
        <p>
          We may modify, add, or remove features with notice where appropriate. If a change
          materially reduces what you paid for, your remedies may be governed by applicable consumer
          law in addition to these terms.
        </p>
      </LegalSection>

      <LegalSection title="Payment terms">
        <p>
          Paid plans and one-time purchases are processed by our payment provider (Stripe). Prices
          and billing periods are shown at checkout. You authorize us and Stripe to charge your
          chosen payment method.
        </p>
        <p>
          <strong>Subscriptions:</strong> You may cancel your subscription at any time through the
          mechanisms we provide (for example account or billing settings). Cancellation typically
          stops renewal; access may continue until the end of the current paid period unless stated
          otherwise.
        </p>
        <p>
          <strong>One-time purchases:</strong> Except where required by applicable law, one-time
          purchases are <strong>non-refundable after 14 days</strong> from the date of purchase.
          If you believe you are entitled to a refund under Australian Consumer Law or other
          mandatory rules, contact us and we will assess your request in good faith.
        </p>
      </LegalSection>

      <LegalSection title="Prohibited uses">
        <p>You agree not to:</p>
        <ul>
          <li>Scrape, crawl, or harvest data from the Service without our written permission.</li>
          <li>Resell, sublicense, or redistribute the Service or access to it.</li>
          <li>Reverse engineer, decompile, or attempt to extract source code except where law forbids this restriction.</li>
          <li>Use the Service to violate law, infringe others&apos; rights, or distribute malware.</li>
          <li>Interfere with or overload the Service or other users&apos; use of it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties">
        <p>
          The Service is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>{" "}
          without warranties of any kind, whether express or implied, including merchantability,
          fitness for a particular purpose, and non-infringement, to the fullest extent permitted by
          law.
        </p>
        <p>
          We do not guarantee uninterrupted operation, error-free behaviour, or that the Service
          will meet your specific goals. Outages, maintenance, and third-party failures may affect
          availability.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, MonkMode and its operators will not
          be liable for any indirect, incidental, special, consequential, or punitive damages, or
          loss of profits, data, or goodwill, arising from your use of the Service.
        </p>
        <p>
          Our total liability for claims arising from the Service in any twelve-month period is
          limited to the greater of (a) the amount you paid us for the Service in that period or
          (b) one hundred Australian dollars (AUD $100), except where liability cannot be limited
          under applicable law (including under the Australian Consumer Law).
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of{" "}
          <strong>New South Wales, Australia</strong>, without regard to conflict-of-law rules.
          You submit to the non-exclusive jurisdiction of the courts of New South Wales for
          disputes arising from these terms, subject to any mandatory rights you have in your place
          of residence.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For legal notices or questions about these terms, email{" "}
          <a href="mailto:legal@monkmodeapp.com">legal@monkmodeapp.com</a>.
        </p>
      </LegalSection>

      <p className="text-sm text-gray-500 border-t border-gray-700 pt-8">
        These terms are a starting point for MonkMode. Have them reviewed by a qualified lawyer
        before launching paid tiers, especially for GDPR, Australian Consumer Law, and
        industry-specific obligations.
      </p>
    </LegalDocumentLayout>
  )
}
