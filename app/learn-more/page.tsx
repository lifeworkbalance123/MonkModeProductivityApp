import type { ReactNode } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'

const contactEmail = 'hello@monkmode.app'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-border pb-12 last:border-0">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">{children}</div>
    </section>
  )
}

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <p className="text-sm text-muted-foreground mb-10">
          <Link href="/" className="text-accent hover:underline">
            ← Home
          </Link>
          <span className="mx-2">·</span>
          <Link href="/dashboard" className="text-accent hover:underline">
            Open app
          </Link>
        </p>

        <h1 className="text-2xl font-bold mb-2">About MONKMODE</h1>
        <p className="text-muted-foreground text-sm mb-12">
          MVP reference pages for footer links. Full marketing and legal copy will expand in later
          releases.
        </p>

        <div className="space-y-12">
          <Section id="about" title="About">
            <p>
              MONKMODE is a deep-focus productivity workspace: weekly planner, habits, daily goals,
              and reflections — with your data stored locally in the browser for this MVP.
            </p>
          </Section>

          <Section id="blog" title="Blog">
            <p>Product updates and essays are not published yet. Use the roadmap on the home page for what ships next.</p>
          </Section>

          <Section id="careers" title="Careers">
            <p>We are not hiring at this stage. This page exists so footer navigation does not 404.</p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Email{' '}
              <a href={`mailto:${contactEmail}`} className="text-accent hover:underline">
                {contactEmail}
              </a>
              .
            </p>
          </Section>

          <Section id="documentation" title="Documentation">
            <p>
              In-app help is coming later. For now, explore{' '}
              <Link href="/dashboard" className="text-accent hover:underline">
                the dashboard
              </Link>{' '}
              and{' '}
              <Link href="/planner" className="text-accent hover:underline">
                weekly planner
              </Link>
              .
            </p>
          </Section>

          <Section id="community" title="Community">
            <p>
              A public community space is on the roadmap. See{' '}
              <Link href="/#roadmap" className="text-accent hover:underline">
                Roadmap
              </Link>{' '}
              on the home page.
            </p>
          </Section>

          <Section id="support" title="Support">
            <p>
              For questions about the MVP, email{' '}
              <a href={`mailto:${contactEmail}`} className="text-accent hover:underline">
                {contactEmail}
              </a>
              .
            </p>
          </Section>

          <Section id="api" title="API">
            <p>There is no public API in the MVP. This section will document integrations when they exist.</p>
          </Section>

          <Section id="privacy" title="Privacy">
            <p>
              This MVP stores data in your browser (localStorage). We do not operate accounts or sync
              servers yet. Use a device you trust. A full privacy policy will ship before any cloud
              features.
            </p>
          </Section>

          <Section id="terms" title="Terms">
            <p>
              MONKMODE is provided as-is for personal productivity. No warranty; use at your own risk.
              Formal terms will be published before paid plans.
            </p>
          </Section>

          <Section id="cookies" title="Cookies">
            <p>
              The web app may use essential cookies or local storage for preferences. Analytics (e.g.
              Vercel) may use cookies per their policies. You can control cookies in your browser
              settings.
            </p>
          </Section>

          <Section id="connect" title="Social">
            <p>
              Official social profiles are not linked yet. Watch the{' '}
              <Link href="/#roadmap" className="text-accent hover:underline">
                roadmap
              </Link>{' '}
              for announcements.
            </p>
          </Section>
        </div>
      </main>
    </div>
  )
}
