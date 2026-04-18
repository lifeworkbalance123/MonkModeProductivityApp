-- Buddy encouragement messages + in-app notifications (partner completed a day, etc.)

CREATE TABLE IF NOT EXISTS public.buddy_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_pair_id UUID NOT NULL REFERENCES public.buddy_pairs (id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT buddy_checkins_week_positive CHECK (week_number >= 1),
  CONSTRAINT buddy_checkins_from_neq_to CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS buddy_checkins_pair_idx ON public.buddy_checkins (buddy_pair_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS buddy_checkins_to_unread_idx
  ON public.buddy_checkins (to_user_id)
  WHERE read_at IS NULL;

COMMENT ON TABLE public.buddy_checkins IS 'Optional weekly encouragement note between buddies; week_number is program week (1-based).';

CREATE TABLE IF NOT EXISTS public.buddy_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  buddy_pair_id UUID REFERENCES public.buddy_pairs (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('partner_day_complete', 'weekly_checkin_prompt')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS buddy_notifications_user_unread_idx
  ON public.buddy_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS buddy_notifications_user_idx ON public.buddy_notifications (user_id, created_at DESC);

COMMENT ON TABLE public.buddy_notifications IS 'In-app inbox for buddy events (partner day logged, weekly nudge).';

-- When the current user completes a program day, notify their active buddy.
CREATE OR REPLACE FUNCTION public.notify_buddy_partner_day_complete(p_completed_day integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  partner_id UUID;
  bp RECORD;
BEGIN
  IF uid IS NULL OR p_completed_day IS NULL OR p_completed_day < 1 THEN
    RETURN;
  END IF;

  SELECT id, inviter_user_id, invitee_user_id
  INTO bp
  FROM public.buddy_pairs
  WHERE status = 'active'
    AND invitee_user_id IS NOT NULL
    AND (inviter_user_id = uid OR invitee_user_id = uid)
  ORDER BY activated_at DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF bp.inviter_user_id = uid THEN
    partner_id := bp.invitee_user_id;
  ELSE
    partner_id := bp.inviter_user_id;
  END IF;

  INSERT INTO public.buddy_notifications (
    user_id,
    buddy_pair_id,
    kind,
    title,
    body,
    metadata
  )
  VALUES (
    partner_id,
    bp.id,
    'partner_day_complete',
    'Your buddy completed a day',
    format('They finished Day %s of their program — send a quick cheer?', p_completed_day),
    jsonb_build_object(
      'partner_day', p_completed_day,
      'from_user_id', uid
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_buddy_partner_day_complete(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_buddy_partner_day_complete(integer) TO authenticated;

ALTER TABLE public.buddy_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buddy_checkins_select_parties" ON public.buddy_checkins;
CREATE POLICY "buddy_checkins_select_parties"
  ON public.buddy_checkins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "buddy_checkins_insert_as_sender" ON public.buddy_checkins;
CREATE POLICY "buddy_checkins_insert_as_sender"
  ON public.buddy_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.buddy_pairs bp
      WHERE bp.id = buddy_pair_id
        AND bp.status = 'active'
        AND bp.invitee_user_id IS NOT NULL
        AND (
          (bp.inviter_user_id = auth.uid() AND bp.invitee_user_id = to_user_id)
          OR (bp.invitee_user_id = auth.uid() AND bp.inviter_user_id = to_user_id)
        )
    )
  );

DROP POLICY IF EXISTS "buddy_checkins_mark_read" ON public.buddy_checkins;
CREATE POLICY "buddy_checkins_mark_read"
  ON public.buddy_checkins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "buddy_notifications_select_own" ON public.buddy_notifications;
CREATE POLICY "buddy_notifications_select_own"
  ON public.buddy_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "buddy_notifications_update_read" ON public.buddy_notifications;
CREATE POLICY "buddy_notifications_update_read"
  ON public.buddy_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.buddy_checkins TO authenticated;
GRANT SELECT, UPDATE ON public.buddy_notifications TO authenticated;
