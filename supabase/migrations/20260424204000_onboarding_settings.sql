-- Singleton config for program selection screen copy (/onboarding first step).

CREATE TABLE IF NOT EXISTS public.onboarding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_selection_title TEXT NOT NULL DEFAULT 'Choose your path',
  program_selection_subtitle TEXT NOT NULL DEFAULT 'Select the program that fits your goals and schedule',
  program_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_settings_singleton CHECK (id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)
);

INSERT INTO public.onboarding_settings (id, program_selection_title, program_selection_subtitle, program_headers)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Choose your path',
  'Select the program that fits your goals and schedule',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.onboarding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_settings_select_public"
  ON public.onboarding_settings
  FOR SELECT
  USING (true);

CREATE POLICY "onboarding_settings_update_admin"
  ON public.onboarding_settings
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "onboarding_settings_insert_admin"
  ON public.onboarding_settings
  FOR INSERT
  WITH CHECK (public.is_current_user_admin());

GRANT SELECT ON public.onboarding_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.onboarding_settings TO authenticated;

DROP TRIGGER IF EXISTS onboarding_settings_set_updated_at ON public.onboarding_settings;
CREATE TRIGGER onboarding_settings_set_updated_at
  BEFORE UPDATE ON public.onboarding_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
