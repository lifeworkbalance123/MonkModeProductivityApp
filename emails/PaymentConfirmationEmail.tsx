import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function PaymentConfirmationEmail({
  firstName,
  appUrl,
  recipientEmail,
  plan,
  amount,
  invoiceUrl,
}: {
  firstName?: string
  appUrl: string
  recipientEmail: string
  plan: string
  amount: string
  invoiceUrl?: string
}) {
  const name = (firstName ?? '').trim() || 'there'
  const dashboardUrl = `${appUrl.replace(/\/$/, '')}/dashboard`

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })

  return (
    <EmailLayout
      previewText="Payment confirmed"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>You&apos;re now on monkcubed Pro 🔥</H2>

      <P>Hey {name},</P>
      <P>Payment confirmed. Welcome to monkcubed Pro.</P>

      <P>
        <strong>Receipt summary</strong>
      </P>
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, lineHeight: '22px' }}>Plan: {plan}</div>
        <div style={{ fontSize: 14, lineHeight: '22px' }}>Amount: {amount}</div>
        <div style={{ fontSize: 14, lineHeight: '22px' }}>Date: {today}</div>
        <div style={{ fontSize: 14, lineHeight: '22px' }}>
          Invoice:{' '}
          {invoiceUrl ? (
            <a
              href={invoiceUrl}
              style={{ color: '#F59E0B', textDecoration: 'underline' }}
            >
              View invoice
            </a>
          ) : (
            <span style={{ color: '#9CA3AF' }}>Available in Stripe</span>
          )}
        </div>
      </div>

      <P>
        <strong>What&apos;s now unlocked:</strong>
      </P>
      <ul style={{ margin: '0 0 14px 18px', padding: 0, color: '#FFFFFF' }}>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Unlimited habits & goals
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Full 7-day weekly planner
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Cloud sync across devices
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Analytics & heatmaps
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Kanban board
        </li>
        <li style={{ marginBottom: 8, fontSize: 14, lineHeight: '22px' }}>
          Deep Work mode
        </li>
        <li style={{ marginBottom: 0, fontSize: 14, lineHeight: '22px' }}>
          Morning + evening journal
        </li>
      </ul>

      <div style={{ margin: '16px 0 12px', textAlign: 'center' }}>
        <PrimaryButton href={dashboardUrl}>Go to my dashboard →</PrimaryButton>
      </div>

      <Muted>
        Questions? Reply to this email or reach us at support@monkcubed.com
      </Muted>
    </EmailLayout>
  )
}

