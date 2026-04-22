-- Per-user UI preferences (e.g. cross-device tooltip dismissals).

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  dismissed_tooltips jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT user_preferences_dismissed_tooltips_is_array
    CHECK (jsonb_typeof(dismissed_tooltips) = 'array')
);

COMMENT ON TABLE public.user_preferences IS 'User-scoped preferences; dismissed_tooltips is a JSON array of tooltip id strings.';

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
