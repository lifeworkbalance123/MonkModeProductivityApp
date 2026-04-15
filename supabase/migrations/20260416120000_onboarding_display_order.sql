-- Order onboarding_content rows for admin reorder / dynamic steps

ALTER TABLE public.onboarding_content
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

UPDATE public.onboarding_content SET display_order = 1 WHERE step_key = 'welcome';
UPDATE public.onboarding_content SET display_order = 2 WHERE step_key = 'why';
UPDATE public.onboarding_content SET display_order = 3 WHERE step_key = 'commitment';
UPDATE public.onboarding_content SET display_order = 4 WHERE step_key = 'setup';
UPDATE public.onboarding_content SET display_order = 5 WHERE step_key = 'ready';

CREATE INDEX IF NOT EXISTS onboarding_content_display_order_idx
  ON public.onboarding_content (display_order ASC, step_key ASC);
