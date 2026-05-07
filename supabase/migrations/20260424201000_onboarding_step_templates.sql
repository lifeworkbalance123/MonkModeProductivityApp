-- Program-specific onboarding wizard steps (admin-configurable per track).

CREATE TABLE IF NOT EXISTS public.onboarding_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT NOT NULL
    CHECK (program_type IN ('sprint_standard', 'sprint_monk', 'transform')),
  step_order INTEGER NOT NULL,
  step_kind TEXT NOT NULL DEFAULT 'content'
    CHECK (
      step_kind IN (
        'welcome',
        'why',
        'commitment',
        'wake',
        'content',
        'ready',
        'goal',
        'sleep',
        'accountability',
        'payment'
      )
    ),
  title TEXT NOT NULL,
  content TEXT,
  button_label TEXT NOT NULL DEFAULT 'Continue',
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_type, step_order)
);

CREATE INDEX IF NOT EXISTS onboarding_step_templates_program_order_idx
  ON public.onboarding_step_templates (program_type, step_order ASC, id ASC);

ALTER TABLE public.onboarding_step_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_step_templates_select_public"
  ON public.onboarding_step_templates
  FOR SELECT
  USING (true);

CREATE POLICY "onboarding_step_templates_insert_admin"
  ON public.onboarding_step_templates
  FOR INSERT
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "onboarding_step_templates_update_admin"
  ON public.onboarding_step_templates
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "onboarding_step_templates_delete_admin"
  ON public.onboarding_step_templates
  FOR DELETE
  USING (public.is_current_user_admin());

GRANT SELECT ON public.onboarding_step_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.onboarding_step_templates TO authenticated;

DROP TRIGGER IF EXISTS onboarding_step_templates_set_updated_at ON public.onboarding_step_templates;
CREATE TRIGGER onboarding_step_templates_set_updated_at
  BEFORE UPDATE ON public.onboarding_step_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- One copy of each legacy global step per program (same order and content).
INSERT INTO public.onboarding_step_templates (
  program_type,
  step_order,
  step_kind,
  title,
  content,
  button_label,
  image_url,
  video_url
)
SELECT
  pt.program_type,
  s.step_order,
  s.step_kind,
  s.title,
  s.description,
  s.action_label,
  NULL::text,
  s.video_url
FROM public.onboarding_steps s
CROSS JOIN (
  VALUES
    ('sprint_standard'::text),
    ('sprint_monk'::text),
    ('transform'::text)
) AS pt(program_type)
WHERE NOT EXISTS (SELECT 1 FROM public.onboarding_step_templates LIMIT 1);
