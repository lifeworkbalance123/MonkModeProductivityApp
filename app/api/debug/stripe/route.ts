import { validateStripePrices } from '@/lib/stripePrices'

export const dynamic = 'force-dynamic'

function isConfigured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

export async function GET() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_ADMIN_DEBUG_GRANT !== 'true'
  ) {
    return Response.json({ error: 'Not available in production' }, { status: 404 })
  }

  const prices = validateStripePrices()

  return Response.json({
    stripe: {
      publishableKeyConfigured: isConfigured('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
      secretKeyConfigured: isConfigured('STRIPE_SECRET_KEY'),
      webhookSecretConfigured: isConfigured('STRIPE_WEBHOOK_SECRET'),
    },
    app: {
      appUrlConfigured: isConfigured('NEXT_PUBLIC_APP_URL'),
      siteUrlConfigured: isConfigured('NEXT_PUBLIC_SITE_URL'),
    },
    prices,
  })
}
