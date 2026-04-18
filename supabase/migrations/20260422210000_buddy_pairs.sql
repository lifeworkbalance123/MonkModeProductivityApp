-- Buddy accountability pairs: invite code, acceptance, 7-day logging → 15% discount eligibility

CREATE TABLE IF NOT EXISTS public.buddy_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  invitee_user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  both_completed_7_days BOOLEAN NOT NULL DEFAULT false,
  discount_applied BOOLEAN NOT NULL DEFAULT false,
  inviter_discount_applied BOOLEAN NOT NULL DEFAULT false,
  invitee_discount_applied BOOLEAN NOT NULL DEFAULT false,
  discount_amount INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT buddy_pairs_inviter_neq_invitee CHECK (
    invitee_user_id IS NULL OR inviter_user_id <> invitee_user_id
  ),
  CONSTRAINT buddy_pairs_invite_code_key UNIQUE (invite_code)
);

CREATE INDEX IF NOT EXISTS buddy_pairs_inviter_idx ON public.buddy_pairs (inviter_user_id);
CREATE INDEX IF NOT EXISTS buddy_pairs_invitee_idx ON public.buddy_pairs (invitee_user_id);
CREATE INDEX IF NOT EXISTS buddy_pairs_status_idx ON public.buddy_pairs (status);

COMMENT ON TABLE public.buddy_pairs IS 'Accountability buddy: pending until invitee accepts; 7+ completed program days each → both_completed_7_days; Stripe discount applied separately.';

-- One open pair per inviter (pending or active)
CREATE UNIQUE INDEX IF NOT EXISTS buddy_pairs_one_open_inviter_idx
  ON public.buddy_pairs (inviter_user_id)
  WHERE status IN ('pending', 'active');

-- At most one active/pending pair per invitee (when set)
CREATE UNIQUE INDEX IF NOT EXISTS buddy_pairs_one_active_invitee_idx
  ON public.buddy_pairs (invitee_user_id)
  WHERE invitee_user_id IS NOT NULL AND status IN ('pending', 'active');

-- BD + 8 uppercase alphanumeric (distinct from MM referral codes)
CREATE OR REPLACE FUNCTION public.generate_buddy_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
BEGIN
  LOOP
    code := 'BD';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::INT, 1);
    END LOOP;
    IF NOT EXISTS (
      SELECT 1 FROM public.buddy_pairs b WHERE b.invite_code = code
    ) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Recompute 7-day completion for any active pair involving the current user (program_enrollments.completed_days).
CREATE OR REPLACE FUNCTION public.refresh_buddy_pair_eligibility()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r RECORD;
  inviter_len INT;
  invitee_len INT;
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT id, inviter_user_id, invitee_user_id
    FROM public.buddy_pairs
    WHERE status = 'active'
      AND invitee_user_id IS NOT NULL
      AND (inviter_user_id = uid OR invitee_user_id = uid)
  LOOP
    SELECT COALESCE(array_length(pe.completed_days, 1), 0)
    INTO inviter_len
    FROM public.program_enrollments pe
    WHERE pe.user_id = r.inviter_user_id;

    SELECT COALESCE(array_length(pe.completed_days, 1), 0)
    INTO invitee_len
    FROM public.program_enrollments pe
    WHERE pe.user_id = r.invitee_user_id;

    IF COALESCE(inviter_len, 0) >= 7 AND COALESCE(invitee_len, 0) >= 7 THEN
      UPDATE public.buddy_pairs
      SET both_completed_7_days = true
      WHERE id = r.id
        AND both_completed_7_days = false;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_buddy_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_buddy_invite_code() TO service_role;

REVOKE ALL ON FUNCTION public.refresh_buddy_pair_eligibility() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_buddy_pair_eligibility() TO authenticated;

ALTER TABLE public.buddy_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own buddy_pairs" ON public.buddy_pairs;
CREATE POLICY "Users select own buddy_pairs"
  ON public.buddy_pairs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = inviter_user_id
    OR auth.uid() = invitee_user_id
  );

-- Inserts/updates use service role in API routes (bypass RLS).
GRANT SELECT ON public.buddy_pairs TO authenticated;
