import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function TrialExpiredEmail({
  firstName,
  appUrl,
  recipientEmail,
}: {
  firstName?: string
  appUrl: string
  recipientEmail: string
}) {
  const name = (firstName ?? '').trim() || 'there'
  const upgradeUrl = `${appUrl.replace(/\/$/, '')}/upgrade`

  return (
    <EmailLayout
      previewText="Trial expired"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>Your monkcubed Pro trial has ended</H2>

      <P>Hey {name},</P>
      <P>
        Your 14-day Pro trial has ended and you&apos;re now on the Free plan.
      </P>
      <Muted>
        Everything you created — your habits, goals, journal entries — is still
        there.
      </Muted>
      <Muted>Upgrade anytime to get full access back instantly.</Muted>

      <P>
        <strong>Options:</strong>
      </P>
      <ul style={{ margin: '0 0 14px 18px', padding: 0, color: '#FFFFFF' }}>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Pro Monthly: $9.99/mo → <span style={{ color: '#9CA3AF' }}>Upgrade now</span>
        </li>
        <li style={{ marginBottom: 0, fontSize: 14, lineHeight: '22px' }}>
          Lifetime: $149 → <span style={{ color: '#9CA3AF' }}>Own it forever</span>
        </li>
      </ul>

      <div style={{ margin: '16px 0 12px', textAlign: 'center' }}>
        <PrimaryButton href={upgradeUrl}>
          Upgrade and pick up where you left off →
        </PrimaryButton>
      </div>

      <Muted>
        No pressure. You can upgrade anytime from inside the app.
      </Muted>
    </EmailLayout>
  )
}

