/**
 * Buddy pair discount: when `buddy_pairs.both_completed_7_days` is true and
 * `discount_amount` is 15, apply 15% off the user’s current paid program (or
 * process a partial refund for recent purchases).
 *
 * Not wired automatically — integrate with Stripe (customer balance credit,
 * invoice discount, or refund) using the service role in a secure API route or
 * webhook. Update `inviter_discount_applied` / `invitee_discount_applied` and
 * `discount_applied` on `buddy_pairs` after successful application.
 */

export const BUDDY_DISCOUNT_PERCENT_DEFAULT = 15
