-- RLS hardening: tables that were missing RLS or policies compared to app usage.
-- (Habits, goals, planner_slots, kanban, program tables, etc. already have RLS from earlier migrations.)

-- ═══ REFERRAL_EVENTS — was wide open (no RLS) ═══
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_events_select_parties" ON public.referral_events;
CREATE POLICY "referral_events_select_parties"
  ON public.referral_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

GRANT SELECT ON public.referral_events TO authenticated;

-- Writes go through service role (Stripe /api/referral/claim, lib/referral.ts); JWT cannot insert/update.

-- ═══ WEBHOOK_LOGS — RLS on but no policies (only service_role could insert) ═══
-- Allow admins to read logs in dashboard; deny everyone else at table level via RLS.
DROP POLICY IF EXISTS "webhook_logs_select_admin" ON public.webhook_logs;
CREATE POLICY "webhook_logs_select_admin"
  ON public.webhook_logs
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

GRANT SELECT ON public.webhook_logs TO authenticated;

-- ═══ DEEP_WORK_SESSIONS — had insert/select/delete, missing UPDATE ═══
DROP POLICY IF EXISTS "deep_work_sessions_update_own" ON public.deep_work_sessions;
CREATE POLICY "deep_work_sessions_update_own"
  ON public.deep_work_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
