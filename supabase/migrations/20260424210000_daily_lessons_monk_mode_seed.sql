-- Align daily_lessons schema for Monk Mode CMS usage and seed 21-day sprint_monk content.

ALTER TABLE public.daily_lessons
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.daily_lessons
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_day_number INT;

CREATE UNIQUE INDEX IF NOT EXISTS daily_lessons_program_type_program_day_is_bonus_key
  ON public.daily_lessons (program_type, program_day, is_bonus);

DROP POLICY IF EXISTS "Users read daily_lessons" ON public.daily_lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.daily_lessons;

CREATE POLICY "Anyone can view lessons"
  ON public.daily_lessons
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.daily_lessons (
  program_type,
  program_day,
  is_bonus,
  parent_day_number,
  phase,
  title,
  tip_topic,
  content_markdown,
  audio_url,
  video_url,
  image_url
)
VALUES
  (
    'sprint_monk', 1, false, null, 1,
    'Day 1: Identity Lock-In',
    'Identity',
    '# Day 1: Identity Lock-In

Today is about identity, not effort.

- Decide: "I am the person who ships."
- Pick one project that matters for the next 21 days.
- Write your non-negotiable deep-work window.

**Prompt:** What does a successful Day 21 version of me look like?',
    null, null, null
  ),
  (
    'sprint_monk', 2, false, null, 1,
    'Day 2: Environment Reset',
    'Environment Design',
    '# Day 2: Environment Reset

Your environment should make focus easier than distraction.

- Remove friction from starting work.
- Add friction to social and noise.
- Prepare your desk and tools before your first block.

**Prompt:** What one environmental change gave you the biggest leverage today?',
    null, null, null
  ),
  (
    'sprint_monk', 3, false, null, 1,
    'Day 3: Attention Audit',
    'Awareness',
    '# Day 3: Attention Audit

Track where your attention leaks.

- Log each context switch.
- Count how often you break your own focus.
- Identify your top two distraction triggers.

**Prompt:** Which trigger sabotages you the most?',
    null, null, null
  ),
  (
    'sprint_monk', 4, false, null, 1,
    'Day 4: Deep Work Ritual',
    'Ritual',
    '# Day 4: Deep Work Ritual

Create the same pre-focus ritual each day.

- Start with one minute of stillness.
- Define one clear outcome for this block.
- Begin with the hardest action first.

**Prompt:** Which ritual step instantly signals "it is time to focus"?',
    null, null, null
  ),
  (
    'sprint_monk', 5, false, null, 1,
    'Day 5: Single-Task Discipline',
    'Execution',
    '# Day 5: Single-Task Discipline

Multitasking is hidden quitting.

- Choose one target for each session.
- Keep a parking lot list for side thoughts.
- Finish before switching.

**Prompt:** What unfinished switch cost you the most energy this week?',
    null, null, null
  ),
  (
    'sprint_monk', 6, false, null, 1,
    'Day 6: Frictionless Start',
    'Momentum',
    '# Day 6: Frictionless Start

Starting fast beats perfect planning.

- Define your first 5-minute action before bed.
- Open the exact file or document in advance.
- Start before checking messages.

**Prompt:** What made your start faster today?',
    null, null, null
  ),
  (
    'sprint_monk', 7, false, null, 1,
    'Day 7: Week 1 Review',
    'Reflection',
    '# Day 7: Week 1 Review

Review the process, not just output.

- What worked repeatedly?
- What keeps interrupting focus?
- What one rule will you tighten for Week 2?

**Prompt:** Write your Week 2 operating rule.',
    null, null, null
  ),
  (
    'sprint_monk', 8, false, null, 2,
    'Day 8: Capacity Expansion',
    'Stamina',
    '# Day 8: Capacity Expansion

Slightly extend your deep-work capacity.

- Add 10-20 more focused minutes.
- Keep break quality high (walk, water, breathe).
- Protect recovery after intense blocks.

**Prompt:** How did your focus quality change with longer duration?',
    null, null, null
  ),
  (
    'sprint_monk', 9, false, null, 2,
    'Day 9: Distraction Intercepts',
    'Interruption Control',
    '# Day 9: Distraction Intercepts

Interruptions are predictable.

- Pre-write "Not now" responses.
- Silence non-essential notifications.
- Block known distraction windows.

**Prompt:** Which intercept saved your focus today?',
    null, null, null
  ),
  (
    'sprint_monk', 10, false, null, 2,
    'Day 10: Output Over Busyness',
    'Prioritization',
    '# Day 10: Output Over Busyness

Busy is not productive.

- Pick one measurable output for today.
- Timebox low-value admin.
- Ship something concrete before noon if possible.

**Prompt:** What did you actually ship today?',
    null, null, null
  ),
  (
    'sprint_monk', 11, false, null, 2,
    'Day 11: Energy Protocol',
    'Recovery',
    '# Day 11: Energy Protocol

Focus depends on energy management.

- Hydrate and move before your first block.
- Use short resets between sessions.
- Stop grinding when quality drops, then reset.

**Prompt:** Which reset most restored your attention?',
    null, null, null
  ),
  (
    'sprint_monk', 12, false, null, 2,
    'Day 12: Boredom Tolerance',
    'Mental Endurance',
    '# Day 12: Boredom Tolerance

Boredom is a gateway to depth.

- Stay with hard work past the urge to escape.
- Delay stimulation for 10 extra minutes.
- Notice the moment depth begins after resistance.

**Prompt:** What happened after you stayed in discomfort?',
    null, null, null
  ),
  (
    'sprint_monk', 13, false, null, 2,
    'Day 13: Constraint Sprint',
    'Focus Constraints',
    '# Day 13: Constraint Sprint

Constraints create clarity.

- Reduce today''s goal to one narrow outcome.
- Limit tools and tabs to essentials.
- Work in one environment only.

**Prompt:** Which constraint sharpened your execution?',
    null, null, null
  ),
  (
    'sprint_monk', 14, false, null, 2,
    'Day 14: Week 2 Review',
    'Review and Adjust',
    '# Day 14: Week 2 Review

You are halfway through Monk Mode.

- Compare Week 2 to Week 1.
- Keep one behavior, remove one behavior, add one behavior.
- Re-commit to your Day 21 outcome.

**Prompt:** What is your single most important adjustment for Week 3?',
    null, null, null
  ),
  (
    'sprint_monk', 15, false, null, 3,
    'Day 15: Precision Planning',
    'Planning',
    '# Day 15: Precision Planning

Plan less, execute better.

- Define top 3 execution moves before first block.
- Estimate time realistically.
- Leave margin for one unexpected issue.

**Prompt:** Which planned move delivered the highest ROI?',
    null, null, null
  ),
  (
    'sprint_monk', 16, false, null, 3,
    'Day 16: Hardest Task First',
    'Courage',
    '# Day 16: Hardest Task First

Win the day early.

- Start with the most avoided task.
- Work without negotiation for the first block.
- Delay easy work until after meaningful progress.

**Prompt:** What did doing the hardest task first change?',
    null, null, null
  ),
  (
    'sprint_monk', 17, false, null, 3,
    'Day 17: Recovery Discipline',
    'Sustainability',
    '# Day 17: Recovery Discipline

Recovery is part of performance.

- Finish focus blocks with intention, not collapse.
- Protect sleep setup tonight.
- End the day with a short shutdown review.

**Prompt:** What recovery habit most affects tomorrow''s focus?',
    null, null, null
  ),
  (
    'sprint_monk', 18, false, null, 3,
    'Day 18: Anti-Drift System',
    'Consistency',
    '# Day 18: Anti-Drift System

Drift happens gradually.

- Set a midday checkpoint.
- Compare actual vs planned work.
- Correct course immediately.

**Prompt:** Where did drift start today, and how did you stop it?',
    null, null, null
  ),
  (
    'sprint_monk', 19, false, null, 3,
    'Day 19: Final Push Strategy',
    'Momentum',
    '# Day 19: Final Push Strategy

Enter finish mode.

- Remove optional commitments for the next 72 hours.
- Double down on your highest leverage block.
- Protect your morning execution window.

**Prompt:** What are you saying no to for the final push?',
    null, null, null
  ),
  (
    'sprint_monk', 20, false, null, 3,
    'Day 20: Delivery Day',
    'Shipping',
    '# Day 20: Delivery Day

Completion beats perfection.

- Ship a meaningful milestone today.
- Capture what remains for Day 21 closure.
- Communicate outcomes clearly.

**Prompt:** What did you deliver that mattered?',
    null, null, null
  ),
  (
    'sprint_monk', 21, false, null, 3,
    'Day 21: Monk Mode Integration',
    'Integration',
    '# Day 21: Monk Mode Integration

Turn this sprint into a system.

- Review all 21 days.
- Document your personal Monk Mode playbook.
- Choose the next 30-day continuation protocol.

**Prompt:** Which three habits will you keep permanently?',
    null, null, null
  )
ON CONFLICT (program_type, program_day, is_bonus)
DO UPDATE SET
  parent_day_number = EXCLUDED.parent_day_number,
  phase = EXCLUDED.phase,
  title = EXCLUDED.title,
  tip_topic = EXCLUDED.tip_topic,
  content_markdown = EXCLUDED.content_markdown,
  audio_url = EXCLUDED.audio_url,
  video_url = EXCLUDED.video_url,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();
