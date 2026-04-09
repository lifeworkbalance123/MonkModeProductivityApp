import React from 'react'

const COLORS = {
  bg: '#111827',
  card: '#0b1220',
  text: '#FFFFFF',
  muted: '#9CA3AF',
  amber: '#F59E0B',
  border: 'rgba(245, 158, 11, 0.25)',
}

export function EmailLayout({
  previewText,
  children,
  recipientEmail,
  appUrl,
}: {
  previewText?: string
  children: React.ReactNode
  recipientEmail: string
  appUrl: string
}) {
  const unsubscribeUrl = `${appUrl.replace(/\/$/, '')}/unsubscribe?email=${encodeURIComponent(
    recipientEmail,
  )}`

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {previewText ? <title>{previewText}</title> : null}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: COLORS.bg }}>
        <div
          style={{
            backgroundColor: COLORS.bg,
            padding: '28px 16px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            color: COLORS.text,
          }}
        >
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  color: COLORS.amber,
                }}
              >
                MonkMode
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                Enter monk mode. Stay focused.
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                borderRadius: 14,
                padding: 22,
              }}
            >
              {children}
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                lineHeight: '18px',
                color: COLORS.muted,
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 6 }}>
                Need help?{' '}
                <a
                  href="mailto:support@monkmodeapp.com"
                  style={{ color: COLORS.amber, textDecoration: 'underline' }}
                >
                  support@monkmodeapp.com
                </a>
              </div>
              <div>
                <a
                  href={unsubscribeUrl}
                  style={{ color: COLORS.muted, textDecoration: 'underline' }}
                >
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: COLORS.amber,
        color: COLORS.card,
        padding: '12px 16px',
        borderRadius: 12,
        fontWeight: 700,
        textDecoration: 'none',
        textAlign: 'center',
      }}
    >
      {children}
    </a>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 10px',
        fontSize: 18,
        lineHeight: '24px',
        color: COLORS.text,
      }}
    >
      {children}
    </h2>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 12px',
        fontSize: 14,
        lineHeight: '22px',
        color: COLORS.text,
      }}
    >
      {children}
    </p>
  )
}

export function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 12px',
        fontSize: 14,
        lineHeight: '22px',
        color: COLORS.muted,
      }}
    >
      {children}
    </p>
  )
}

