import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function WelcomeEmail({
  firstName,
  appUrl,
  recipientEmail,
}: {
  firstName?: string
  appUrl: string
  recipientEmail: string
}) {
  const name = (firstName ?? '').trim() || 'there'
  const dashboardUrl = `${appUrl.replace(/\/$/, '')}/dashboard`

  return (
    <EmailLayout
      previewText="Welcome to MonkMode"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>🔥 Welcome to MonkMode</H2>

      <P>Hey {name},</P>
      <P>You just made a great decision.</P>
      <Muted>
        Your 14-day Pro trial is now active. You have access to every Pro feature,
        completely free, for the next 14 days.
      </Muted>

      <div style={{ margin: '16px 0 18px', textAlign: 'center' }}>
        <PrimaryButton href={dashboardUrl}>Open MonkMode →</PrimaryButton>
      </div>

      <P>
        <strong>Here&apos;s how to get the most out of day 1:</strong>
      </P>
      <ul style={{ margin: '0 0 14px 18px', padding: 0, color: '#FFFFFF' }}>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Add your first 3 habits
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Set your top 5 goals for today
        </li>
        <li style={{ marginBottom: 0, fontSize: 14, lineHeight: '22px' }}>
          Schedule your first deep work block
        </li>
      </ul>

      <P>
        Enter monk mode. The focused version of you is waiting.
      </P>
      <P>The MonkMode Team</P>

      <Muted>
        <strong>PS:</strong> Your trial ends in 14 days. No card needed until you
        decide to upgrade.
      </Muted>
    </EmailLayout>
  )
}

