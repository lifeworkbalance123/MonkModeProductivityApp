import { Resend } from 'resend'
import React from 'react'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { Day3CheckinEmail } from '@/emails/Day3CheckinEmail'
import { Day7Email } from '@/emails/Day7Email'
import { TrialExpiryEmail } from '@/emails/TrialExpiryEmail'
import { TrialExpiredEmail } from '@/emails/TrialExpiredEmail'
import { PaymentConfirmationEmail } from '@/emails/PaymentConfirmationEmail'

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    'http://127.0.0.1:3000'
  )
}

function resendClient(): Resend {
  const key = requiredEnv('RESEND_API_KEY')
  return new Resend(key)
}

function fromAddress(): string {
  return requiredEnv('EMAIL_FROM')
}

export async function sendWelcomeEmail(email: string, firstName?: string | null) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: '🔥 Welcome to MonkMode — your 14-day Pro trial has started',
    react: React.createElement(WelcomeEmail, {
      firstName: firstName ?? undefined,
      appUrl: appUrl(),
      recipientEmail: email,
    }),
  })
}

export async function sendDay3Email(
  email: string,
  firstName: string | null | undefined,
  daysLeft: number,
) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "How's your first week going? 👀",
    react: React.createElement(Day3CheckinEmail, {
      firstName: firstName ?? undefined,
      daysLeft,
      appUrl: appUrl(),
      recipientEmail: email,
    }),
  })
}

export async function sendDay7Email(
  email: string,
  firstName: string | null | undefined,
  daysLeft: number,
) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "1 week in — here's what consistent people do differently 🧘",
    react: React.createElement(Day7Email, {
      firstName: firstName ?? undefined,
      daysLeft,
      appUrl: appUrl(),
      recipientEmail: email,
    }),
  })
}

export async function sendTrialExpiryEmail(
  email: string,
  firstName: string | null | undefined,
  planOptions?: {
    monthly: string
    annual: string
    lifetime: string
  },
) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: '⏰ 2 days left of MonkMode Pro',
    react: React.createElement(TrialExpiryEmail, {
      firstName: firstName ?? undefined,
      appUrl: appUrl(),
      recipientEmail: email,
      planOptions: planOptions ?? {
        monthly: '$9.99/mo',
        annual: '$59.99/yr (save 50%)',
        lifetime: '$149 once',
      },
    }),
  })
}

export async function sendTrialExpiredEmail(
  email: string,
  firstName: string | null | undefined,
) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: 'Your MonkMode Pro trial has ended',
    react: React.createElement(TrialExpiredEmail, {
      firstName: firstName ?? undefined,
      appUrl: appUrl(),
      recipientEmail: email,
    }),
  })
}

export async function sendPaymentConfirmationEmail(
  email: string,
  firstName: string | null | undefined,
  plan: string,
  amount: string,
  invoiceUrl?: string | null,
) {
  const resend = resendClient()
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "You're now on MonkMode Pro 🔥 Receipt inside",
    react: React.createElement(PaymentConfirmationEmail, {
      firstName: firstName ?? undefined,
      appUrl: appUrl(),
      recipientEmail: email,
      plan,
      amount,
      invoiceUrl: invoiceUrl ?? undefined,
    }),
  })
}

export async function sendReferralRewardEmail(email: string, firstName?: string | null) {
  const resend = resendClient()
  const name = (firstName ?? '').trim() || 'there'
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: 'You earned a free month of MonkMode Pro! 🎉',
    html: `
      <div style="background:#111827;color:#fff;padding:24px;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:20px;background:#0b1220">
          <h2 style="margin:0 0 12px;color:#F59E0B">MonkMode</h2>
          <p>Hey ${name},</p>
          <p>Your friend just upgraded to MonkMode Pro. As a thank you, we've added 1 free month to your account.</p>
          <p>Keep sharing — every referral earns you another month.</p>
        </div>
      </div>
    `,
  })
}

export async function sendWinbackEmail(email: string, firstName?: string | null) {
  const resend = resendClient()
  const name = (firstName ?? '').trim() || 'there'
  const upgradeUrl = `${appUrl().replace(/\/$/, '')}/upgrade`
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "We'll keep the light on for you 🕯️",
    html: `
      <div style="background:#111827;color:#fff;padding:24px;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:20px;background:#0b1220">
          <h2 style="margin:0 0 12px;color:#F59E0B">MonkMode</h2>
          <p>Hey ${name},</p>
          <p>Your MonkMode Pro subscription has ended.</p>
          <p>Everything you built is still here — your habits, goals, and journal entries are safe on the Free plan.</p>
          <p>Whenever you're ready to get back to full focus, your Pro access is one click away.</p>
          <p style="font-size:18px;color:#F59E0B;font-weight:700">$59.99/year — less than $5/month</p>
          <p><a href="${upgradeUrl}" style="color:#111827;background:#F59E0B;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Come back to Pro →</a></p>
          <p style="color:#9CA3AF;font-size:13px">PS: Reply to this email if there was something we could have done better. We read every reply.</p>
        </div>
      </div>
    `,
  })
}

export async function sendWaitlistConfirmationEmail(email: string) {
  const resend = resendClient()
  const origin = appUrl().replace(/\/$/, '')
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "You're on the MonkMode waitlist 🔥",
    html: `
      <div style="background:#0F172A;color:#fff;padding:24px;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;border:1px solid rgba(245,158,11,.35);border-radius:12px;padding:20px;background:#111827">
          <h2 style="margin:0 0 12px;color:#F59E0B">You're in.</h2>
          <p>We'll email you the moment MonkMode launches on iOS and Android.</p>
          <p>As a waitlist member, you'll get:</p>
          <ul>
            <li>30-day free Pro trial (vs 14 days for regular signups)</li>
            <li>Lifetime deal locked at $99 (vs $149 at public launch)</li>
            <li>Founding member badge in the app</li>
            <li>Direct input on features before v2.0 ships</li>
          </ul>
          <p>In the meantime, the web app is live right now:</p>
          <p><a href="${origin}/auth" style="color:#111827;background:#F59E0B;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Try MonkMode now →</a></p>
          <p>Know someone who should be in Monk Mode? Share your spot:</p>
          <p><a href="${origin}/waitlist" style="color:#F59E0B">${origin}/waitlist</a></p>
          <p>We'll be in touch soon.</p>
        </div>
      </div>
    `,
  })
}

