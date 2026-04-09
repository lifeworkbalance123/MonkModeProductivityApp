import type { Metadata } from "next"
import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal-document-layout"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Privacy Policy | MonkMode",
  description:
    "How MonkMode collects, uses, and stores your data. Supabase, Stripe, and local storage practices.",
}

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated="April 2026">
      <LegalSection title="Introduction">
        <p>
          MonkMode (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the MonkMode
          productivity application and website. This Privacy Policy explains what information we
          collect, how we use it, and your choices. By using MonkMode, you agree to this policy.
        </p>
      </LegalSection>

      <LegalSection title="What data we collect">
        <p>We may collect and process the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information:</strong> When you sign up, we collect your email address
            and authentication identifiers managed through our auth provider (Supabase Auth).
          </li>
          <li>
            <strong>Productivity and app content:</strong> Habits, goals, planner entries, tasks,
            and related data you enter in the app. Depending on your plan, this may stay only on
            your device or be stored in our cloud database.
          </li>
          <li>
            <strong>Usage data:</strong> Basic technical and usage information such as device
            type, browser, approximate timestamps of activity, and error logs, to operate and
            improve the service.
          </li>
          <li>
            <strong>Payment information:</strong> Payments are processed by Stripe. We do not
            store full card numbers on our servers; Stripe provides us with limited billing
            metadata (for example customer and subscription identifiers) needed to manage your
            plan.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use your data">
        <p>We use the information above to:</p>
        <ul>
          <li>Provide, maintain, and improve MonkMode features you choose to use.</li>
          <li>
            Sync your data across devices when you use Pro or cloud-backed features (via Supabase).
          </li>
          <li>Process payments and manage subscriptions or one-time purchases.</li>
          <li>
            Send transactional or service-related messages (for example account verification,
            receipts, or important notices about the service).
          </li>
          <li>Protect security, prevent abuse, and comply with legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data storage and retention">
        <p>
          <strong>Free tier:</strong> Much of your habit, goal, and planner data may be stored
          locally in your browser (for example localStorage). That data remains under your control
          on your device and is not uploaded to our servers unless you use features that explicitly
          sync to the cloud.
        </p>
        <p>
          <strong>Pro tier and cloud features:</strong> When you use authenticated cloud sync or
          similar Pro capabilities, your data is stored on Supabase-managed infrastructure. We
          retain it while your account is active and as needed to provide the service or meet legal
          requirements.
        </p>
        <p>
          <strong>Payments:</strong> Payment card details and full payment credentials are handled
          by Stripe according to Stripe&apos;s policies. We do not store your full card data on
          MonkMode systems.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>We rely on trusted processors and infrastructure providers, including:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — authentication, database, and related backend services for
            accounts and cloud-stored data.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing for subscriptions and purchases.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and delivery of the web application.
          </li>
        </ul>
        <p>
          Each provider processes data according to their own terms and privacy policies. We
          recommend reviewing those documents if you need detail on their practices.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies and similar technologies">
        <p>
          We and our service providers may use cookies, local storage, and similar technologies to
          keep you signed in, remember preferences, measure basic usage, and secure the service.
          Essential cookies and storage are needed for the app to function (for example session
          tokens). Where required by law, we will obtain appropriate consent for non-essential
          analytics or marketing cookies if we add them in the future.
        </p>
        <p>
          You can control cookies through your browser settings; disabling some cookies may limit
          certain features (such as staying logged in).
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, export, or delete
          your personal data, and to object to or restrict certain processing. To exercise these
          rights or ask questions, contact us using the email below. We will respond in line with
          applicable law.
        </p>
        <p>
          You may delete your account or request deletion of cloud-held data where the product
          supports it; some records may be retained where we have a legitimate legal or security
          need.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy-related requests or questions, email{" "}
          <a href="mailto:privacy@monkmodeapp.com">privacy@monkmodeapp.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version on
          this page and update the &quot;Last updated&quot; date. Continued use of MonkMode after
          changes constitutes acceptance of the updated policy, where permitted by law.
        </p>
      </LegalSection>

      <p className="text-sm text-gray-500 border-t border-gray-700 pt-8">
        This policy is a practical starting point for MonkMode. Before launching paid tiers or
        operating at scale, you should have it reviewed by a qualified lawyer for compliance with
        GDPR, Australian privacy law, and other regulations that apply to your users.
      </p>
    </LegalDocumentLayout>
  )
}
