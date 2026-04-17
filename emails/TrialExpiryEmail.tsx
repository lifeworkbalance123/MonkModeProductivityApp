import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function TrialExpiryEmail({
  firstName,
  appUrl,
  recipientEmail,
  planOptions,
}: {
  firstName?: string
  appUrl: string
  recipientEmail: string
  planOptions: {
    monthly: string
    annual: string
    lifetime: string
  }
}) {
  const name = (firstName ?? '').trim() || 'there'
  const upgradeUrl = `${appUrl.replace(/\/$/, '')}/upgrade`

  return (
    <EmailLayout
      previewText="Trial expiry warning"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>⏰ 2 days left of monkcubed Pro</H2>

      <P>Hey {name},</P>
      <P>Your free Pro trial ends in 2 days.</P>
      <Muted>After that, you&apos;ll move to the Free plan and lose:</Muted>
      <ul style={{ margin: '0 0 12px 18px', padding: 0, color: '#FFFFFF' }}>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Unlimited habits
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Full weekly planner
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Cloud sync across devices
        </li>
        <li style={{ marginBottom: 0, fontSize: 14, lineHeight: '22px' }}>
          Analytics, Deep Work, Kanban, and more
        </li>
      </ul>

      <Muted>Your data stays safe — you just lose the tools.</Muted>

      <P>
        <strong>Pricing:</strong>
      </P>
      <ul style={{ margin: '0 0 14px 18px', padding: 0, color: '#FFFFFF' }}>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Pro Monthly: {planOptions.monthly}
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Pro Annual: {planOptions.annual}
        </li>
        <li style={{ marginBottom: 0, fontSize: 14, lineHeight: '22px' }}>
          Lifetime: {planOptions.lifetime}
        </li>
      </ul>

      <div style={{ margin: '16px 0 10px', textAlign: 'center' }}>
        <PrimaryButton href={upgradeUrl}>Keep my Pro access →</PrimaryButton>
      </div>

      <Muted>
        Or continue with the Free plan — no action needed.
      </Muted>
    </EmailLayout>
  )
}

