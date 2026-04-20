-- Allow queued lifecycle email for Day 30 milestones (e.g. 30-Day Sprint completion).

ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_email_type_check;

ALTER TABLE public.email_queue ADD CONSTRAINT email_queue_email_type_check CHECK (
  email_type IN (
    'welcome_day1',
    'welcome_day3',
    'welcome_day7',
    'at_risk_2days',
    'at_risk_4days',
    'milestone_21',
    'milestone_30',
    'milestone_40',
    'milestone_60',
    're_engagement_7days',
    're_engagement_14days'
  )
);
