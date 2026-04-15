-- CMS: persisted program length + admin RPCs to delete / swap program days (shifts user data)

CREATE TABLE IF NOT EXISTS public.cms_program_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  program_length INT NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.cms_program_settings (id, program_length)
VALUES (1, 60)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.cms_program_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cms_program_settings"
  ON public.cms_program_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_program_settings TO authenticated;

-- Swap lesson content for two adjacent calendar days (used for move up/down).
CREATE OR REPLACE FUNCTION public.admin_swap_program_days(p_a INT, p_b INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_a < 1 OR p_b < 1 OR p_a = p_b THEN
    RAISE EXCEPTION 'invalid swap';
  END IF;
  IF ABS(p_a - p_b) <> 1 THEN
    RAISE EXCEPTION 'only adjacent days can be swapped';
  END IF;

  UPDATE public.lessons
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IN (p_a, p_b);

  UPDATE public.daily_actions
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IN (p_a, p_b);

  UPDATE public.weekly_reviews
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IN (p_a, p_b);

  UPDATE public.distraction_logs
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IS NOT NULL AND day_number IN (p_a, p_b);

  UPDATE public.energy_logs
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IN (p_a, p_b);

  UPDATE public.goals
  SET day_number = CASE day_number WHEN p_a THEN p_b WHEN p_b THEN p_a END
  WHERE day_number IS NOT NULL AND day_number IN (p_a, p_b);

  UPDATE public.program_enrollments
  SET
    current_day = CASE current_day
      WHEN p_a THEN p_b
      WHEN p_b THEN p_a
      ELSE current_day
    END,
    updated_at = NOW();
END;
$$;

-- Delete one program day, shift later days down, shrink program_length, fix enrollments.
CREATE OR REPLACE FUNCTION public.admin_delete_program_day(p_day INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m INT;
  i INT;
  v_new INT;
BEGIN
  IF p_day < 1 THEN
    RAISE EXCEPTION 'invalid day';
  END IF;

  SELECT program_length INTO m FROM public.cms_program_settings WHERE id = 1;
  IF m IS NULL THEN
    m := 60;
  END IF;

  IF p_day > m THEN
    RAISE EXCEPTION 'day out of range';
  END IF;

  IF m <= 1 THEN
    RAISE EXCEPTION 'cannot delete last day';
  END IF;

  DELETE FROM public.lessons WHERE day_number = p_day;

  FOR i IN (p_day + 1)..m LOOP
    UPDATE public.lessons SET day_number = i - 1 WHERE day_number = i;
    UPDATE public.daily_actions SET day_number = i - 1 WHERE day_number = i;
    UPDATE public.weekly_reviews SET day_number = i - 1 WHERE day_number = i;
    UPDATE public.distraction_logs SET day_number = i - 1 WHERE day_number = i;
    UPDATE public.energy_logs SET day_number = i - 1 WHERE day_number = i;
    UPDATE public.goals SET day_number = i - 1 WHERE day_number IS NOT NULL AND day_number = i;
  END LOOP;

  UPDATE public.program_enrollments
  SET
    current_day = LEAST(
      CASE
        WHEN current_day > p_day THEN current_day - 1
        ELSE current_day
      END,
      m - 1
    ),
    completed_days = COALESCE(
      (
        SELECT ARRAY_AGG(sub.v ORDER BY sub.v)
        FROM (
          SELECT DISTINCT CASE WHEN x > p_day THEN x - 1 ELSE x END AS v
          FROM unnest(completed_days) AS x
          WHERE x <> p_day
        ) AS sub
      ),
      '{}'::INT[]
    ),
    updated_at = NOW();

  v_new := m - 1;
  UPDATE public.cms_program_settings
  SET program_length = v_new, updated_at = NOW()
  WHERE id = 1;

  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_increment_program_length()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m INT;
BEGIN
  INSERT INTO public.cms_program_settings (id, program_length)
  VALUES (1, 60)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.cms_program_settings
  SET
    program_length = program_length + 1,
    updated_at = NOW()
  WHERE id = 1
  RETURNING program_length INTO m;

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_swap_program_days(INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_program_day(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_increment_program_length() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_swap_program_days(INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_program_day(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_increment_program_length() TO service_role;
