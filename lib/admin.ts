import type { User } from '@supabase/supabase-js'

const DEFAULT_ADMIN_EMAILS = ['your-email@example.com', 'tester@monkcubed.com']

function configuredAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim()
  const list = raw ? raw.split(',') : DEFAULT_ADMIN_EMAILS
  return list
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return configuredAdminEmails().includes(email.trim().toLowerCase())
}

export function isAdmin(user: User | null): boolean {
  return isAdminEmail(user?.email)
}
