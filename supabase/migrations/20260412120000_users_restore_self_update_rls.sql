-- Client-side trial upsert (/debug) needs authenticated users to UPDATE their own row.
-- 20260406120000_entitlement_rls_stripe.sql removed users_update_own for billing safety;
-- service_role still bypasses RLS for Stripe webhooks and /api/debug/ensure-trial.

drop policy if exists "users_update_own" on public.users;

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
