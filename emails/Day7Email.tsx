import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function Day7Email({
  firstName,
  daysLeft,
  appUrl,
  recipientEmail,
}: {
  firstName?: string
  daysLeft: number
  appUrl: string
  recipientEmail: string
}) {
  const name = (firstName ?? '').trim() || 'there'
  const kanbanUrl = `${appUrl.replace(/\/$/, '')}/kanban`
  const upgradeUrl = `${appUrl.replace(/\/$/, '')}/upgrade`

  return (
    <EmailLayout
      previewText="Day 7 motivator"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>1 week in — here&apos;s what consistent people do differently 🧘</H2>

      <P>Hey {name},</P>
      <P>You&apos;ve been using monkcubed for 7 days.</P>
      <Muted>
        Research shows habits take 21–66 days to automate. You&apos;re already
        further than most people get.
      </Muted>

      <P>
        <strong>Feature spotlight:</strong> Kanban board
      </P>
      <Muted>
        (Screenshot placeholder)
        <br />
        Organize tasks visually and keep your focus lane clear.
      </Muted>

      <div style={{ margin: '16px 0 18px', textAlign: 'center' }}>
        <PrimaryButton href={kanbanUrl}>Try it now →</PrimaryButton>
      </div>

      <Muted>7 days left of your free Pro trial.</Muted>

      <div style={{ margin: '16px 0 0', textAlign: 'center' }}>
        <PrimaryButton href={upgradeUrl}>Upgrade and keep your momentum →</PrimaryButton>
      </div>
    </EmailLayout>
  )
}

