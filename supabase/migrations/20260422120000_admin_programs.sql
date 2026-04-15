CREATE TABLE IF NOT EXISTS public.admin_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  duration_days INT NOT NULL,
  tagline TEXT,
  icon_name TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_programs
  DROP CONSTRAINT IF EXISTS admin_programs_program_type_check;

ALTER TABLE public.admin_programs
  ADD CONSTRAINT admin_programs_program_type_check
  CHECK (program_type IN ('sprint', 'transform', 'mastery'));

INSERT INTO public.admin_programs (
  program_type,
  display_name,
  description,
  duration_days,
  tagline,
  icon_name,
  display_order,
  is_active
)
VALUES
  (
    'sprint',
    'Sprint',
    'Lock in and execute with focused daily actions.',
    30,
    'Lock in. Execute. Deliver.',
    'zap',
    1,
    true
  ),
  (
    'transform',
    'Transform',
    'Build non-negotiable routines and identity-level consistency.',
    60,
    'Build discipline that compounds.',
    'refresh-cw',
    2,
    true
  ),
  (
    'mastery',
    'Mastery',
    'Sustain elite habits and deepen long-term execution.',
    90,
    'Sustain focus. Become unshakeable.',
    'crown',
    3,
    true
  )
ON CONFLICT (program_type) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  tagline = EXCLUDED.tagline,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

ALTER TABLE public.admin_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read admin programs" ON public.admin_programs;
CREATE POLICY "Public read admin programs"
  ON public.admin_programs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage admin programs" ON public.admin_programs;
CREATE POLICY "Admins manage admin programs"
  ON public.admin_programs
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
