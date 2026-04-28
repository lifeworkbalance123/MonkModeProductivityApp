import type { Metadata } from "next"
import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal-document-layout"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Terms of Service | monkcubed",
  description:
    "Terms governing use of the monkcubed productivity app, Free vs Pro plans, and payments.",
}

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="April 27, 2026">
      <LegalSection title="Acceptance of terms">
        <p>
          By accessing or using monkcubed (the &quot;Service&quot;), you agree to these Terms of
          Service. If you do not agree, do not use the Service. We may update these terms from time
          to time; the &quot;Last updated&quot; date above will change, and your continued use after
          changes become effective constitutes acceptance where allowed by law.
        </p>
      </LegalSection>

      <LegalSection title="Description of service">
        <p>
          monkcubed is a productivity and personal organization application. It is provided for
          general information and self-management purposes only.{" "}
          <strong>
            monkcubed is not a medical, mental health, or therapeutic service and does not provide
            clinical advice, diagnosis, or treatment.
          </strong>{" "}
          If you need professional support, consult a qualified provider.
        </p>
      </LegalSection>

      <LegalSection title="Free vs Pro plans">
        <p>
          <strong>Free tier:</strong> Includes core monkcubed features with limits as described on
          our{" "}
          <a href="/pricing" className="text-accent underline hover:no-underline">
            Pricing
          </a>{" "}
          page and in the app. Some data may be stored locally in your browser rather than in the
          cloud. Additional terms on modification, notice, and discontinuation of the Free tier
          appear under <strong>Free tier availability</strong> below.
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

      <LegalSection title="Data export and portability">
        <p>
          Where the Service provides export or download tools (for example CSV or PDF export from
          account or settings screens), you may use them to retrieve your content. Availability and
          format of exports may vary by feature and plan. If we discontinue the Free tier, we will
          give eligible users reasonable opportunity to export their data before the effective date,
          as described under <strong>Free tier availability</strong> below.
        </p>
      </LegalSection>

      <LegalSection id="free-tier" title="Free tier availability">
        <p>
          monkcubed offers a Free tier of the Service with limited features as described on our{" "}
          <a href="/pricing" className="text-accent underline hover:no-underline">
            Pricing
          </a>{" "}
          page.
        </p>
        <p>
          <strong>Modification or discontinuation:</strong> monkcubed reserves the right to
          modify, suspend, or discontinue the Free tier at its sole discretion.
        </p>
        <p>
          <strong>Notice period:</strong> If we discontinue the Free tier entirely, we will provide
          existing free users with at least thirty (30) days&apos; prior notice via the email
          address associated with their account.
        </p>
        <p>
          <strong>No liability:</strong> monkcubed shall not be liable to any user or third party
          for any modification, suspension, or discontinuation of the Free tier, except that users
          will be given the opportunity to export their data in accordance with the section titled{" "}
          <strong>Data export and portability</strong> above prior to the effective date of
          discontinuation.
        </p>
        <p>
          <strong>Data retention:</strong> Following the discontinuation of the Free tier, monkcubed
          has no obligation to retain Customer Data associated with Free tier accounts.
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
          purchases may have different refund windows depending on the product. Refund terms for
          guided Programs (Sprint, Monk Mode, Transform) are described under{' '}
          <a href="#refund-policy">Program refund policy</a> below. If you believe you are entitled
          to a refund under Australian Consumer Law or other mandatory rules, contact us and we will
          assess your request in good faith.
        </p>
      </LegalSection>

      <LegalSection id="refund-policy" title="Program refund policy">
        <p>
          <strong>7-day money-back guarantee (Programs only):</strong> If you are not satisfied with
          a guided Program (Sprint, Monk Mode, Transform) for any reason, you may request a full
          refund within <strong>7 calendar days</strong> of your purchase date.
        </p>
        <p>
          <strong>How to request:</strong> Email{' '}
          <a href="mailto:support@monkcubed.com">support@monkcubed.com</a> from the email address
          used for purchase. Include your account email and the Program name.
        </p>
        <p>
          <strong>After refund:</strong> Program access will be revoked. Any included Pro access
          granted by that Program may be downgraded back to Free. Separate Pro subscriptions are
          not refunded for unused time unless required by law.
        </p>
        <p>
          <strong>Conditions:</strong> This guarantee applies to first-time Program purchases only.
          After 7 days, Program sales are final except where required by law.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="Refunds and cancellations">
        <p>
          <strong>Pro Plan subscriptions:</strong> Monthly and annual Pro Plan subscriptions are
          non-refundable once the billing period has commenced. You may cancel your subscription at
          any time via your account settings or the Stripe Customer Portal. Cancellation takes
          effect at the end of the current billing period. No partial refunds or credits for unused
          time.
        </p>
        <p>
          <strong>Programs (Sprint, Monk Mode, Transform) — 7-day money-back guarantee:</strong> If
          you are not satisfied with any Program for any reason, you may request a full refund
          within 7 calendar days of purchase. Details appear in{' '}
          <a href="#refund-policy">Program refund policy</a>.
        </p>
        <p>
          <strong>Abuse prevention:</strong> monkcubed reserves the right to deny refund requests
          from users who repeatedly purchase and request refunds.
        </p>
        <p>
          <strong>Bonus features:</strong> Bonus features (Cloud Sync, CSV Export, Training Hub) are
          provided &quot;as-is&quot; and &quot;as available.&quot; No refunds are provided for
          temporary unavailability or interruptions.
        </p>
        <p>
          <strong>Free tier:</strong> monkcubed may modify, suspend, or discontinue the Free tier at
          its sole discretion. If discontinued entirely, free users will receive 30 days&apos; prior
          notice via email.
        </p>
        <p>
          <strong>Chargebacks and disputes:</strong> If a customer initiates a chargeback or dispute,
          monkcubed may suspend or terminate access to all services pending resolution.
        </p>
      </LegalSection>

      <LegalSection id="bug-disclaimer" title="As-is / bug disclaimer (initial release)">
        <div className="bug-disclaimer-note">
          <strong>📢 Note on Initial Release:</strong> Minor bugs may be present. These do not
          qualify for refunds unless they substantially block core features.{' '}
          <a href="#bug-disclaimer">Read more →</a>
        </div>
        <p>
          <strong>Initial release &amp; minor bugs:</strong> monkcubed is committed to delivering a
          high-quality productivity experience. However, as with any software, the initial release
          may contain minor bugs, visual inconsistencies, or performance issues that do not
          substantially impair core functionality.
        </p>
        <p>
          <strong>Refund limitation:</strong> The presence of minor bugs, non-critical issues, or
          missing non-core features does not entitle you to a refund. Refunds are governed by the
          policies in <a href="#refunds">Refunds and cancellations</a> above.
        </p>
        <p>
          <strong>Substantial breach exception:</strong> If a bug or issue substantially prevents you
          from using core features (habit tracking, timeboxing, Pomodoro timer) for an extended
          period, please contact{' '}
          <a href="mailto:support@monkcubed.com">support@monkcubed.com</a> and we will work to resolve
          the issue or, at our discretion, offer a pro-rated refund.
        </p>
        <p>
          <strong>Ongoing improvements:</strong> We actively monitor and fix reported issues. By
          using monkcubed, you acknowledge that software may have imperfections and agree to report
          issues constructively rather than demanding refunds for minor problems.
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
          To the maximum extent permitted by applicable law, monkcubed and its operators will not
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
          <a href="mailto:support@monkcubed.com">support@monkcubed.com</a>.
        </p>
      </LegalSection>

      <p className="text-sm text-gray-500 border-t border-gray-700 pt-8">
        These terms are a starting point for monkcubed. Have them reviewed by a qualified lawyer
        before launching paid tiers, especially for GDPR, Australian Consumer Law, and
        industry-specific obligations.
      </p>
    </LegalDocumentLayout>
  )
}
