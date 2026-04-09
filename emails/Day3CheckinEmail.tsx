import React from 'react'
import { EmailLayout, H2, Muted, P, PrimaryButton } from '@/emails/components/EmailLayout'

export function Day3CheckinEmail({
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
  const habitsUrl = `${appUrl.replace(/\/$/, '')}/habits`
  const upgradeUrl = `${appUrl.replace(/\/$/, '')}/upgrade`

  return (
    <EmailLayout
      previewText="Day 3 check-in"
      appUrl={appUrl}
      recipientEmail={recipientEmail}
    >
      <H2>How&apos;s your first week going? 👀</H2>

      <P>Hey {name},</P>
      <P>It&apos;s been 3 days since you entered Monk Mode.</P>
      <Muted>
        The most successful users set their habits in the first 48 hours — have
        you added yours yet?
      </Muted>

      <div style={{ margin: '16px 0 18px', textAlign: 'center' }}>
        <PrimaryButton href={habitsUrl}>Check my habits →</PrimaryButton>
      </div>

      <P>
        <strong>Tip of the day:</strong> Pro tip: Time-box your deep work sessions
        for before 12pm. Your willpower is highest in the morning.
      </P>

      <Muted>You have {daysLeft} days left of Pro access.</Muted>

      <div style={{ margin: '16px 0 0', textAlign: 'center' }}>
        <PrimaryButton href={upgradeUrl}>Upgrade now to lock in your progress →</PrimaryButton>
      </div>
    </EmailLayout>
  )
}

