-- Sprint Standard (sprint_standard) – 30 days
-- Replace existing non-bonus sprint_standard lessons with the latest approved copy.

DELETE FROM public.daily_lessons
WHERE program_type = 'sprint_standard'
  AND COALESCE(is_bonus, false) = false;

INSERT INTO public.daily_lessons (
  program_type,
  program_day,
  is_bonus,
  parent_day_number,
  phase,
  title,
  content_markdown,
  tip_topic,
  audio_url,
  video_url,
  image_url
) VALUES

-- Week 1: Deep Work (Days 1-7)
('sprint_standard', 1, false, null, 1, 'Introduction to Pomodoro', 
'Why 25 minutes works. Your brain can focus intensely for short bursts. The Pomodoro Technique trains your attention like a muscle. Start small. One 25-minute block. No phone. No interruptions. Just focus.

**Today''s Action:**
- 1×25 min Pomodoro
- Log your first win

**Evening Check-in:**
- Log first win
- Phone out of bedroom',
'Why 25 minutes works', null, null, null),

('sprint_standard', 2, false, null, 1, 'Protect Your Focus Block',
'The cost of interruption. Research shows it takes 23 minutes to fully refocus after a distraction. One email check costs you nearly half an hour. Protect your 25-minute block like a meeting with your future self.

**Today''s Action:**
- 1×25 min Pomodoro
- Rate your focus 1–5

**Evening Check-in:**
- Rate focus 1–5
- Phone out of bedroom',
'The cost of interruption (23 min to refocus)', null, null, null),

('sprint_standard', 3, false, null, 1, 'Build Stamina',
'Your brain is a muscle. You wouldn''t lift your maximum weight on day one. Same with focus. Today, two Pomodoros. 25 minutes work, 5 minutes break, 25 minutes work. You''re building stamina.

**Today''s Action:**
- 2×25 min Pomodoro (5 min break)
- Log distractions

**Evening Check-in:**
- Log distractions
- Phone out of bedroom',
'Your brain is a muscle – train it', null, null, null),

('sprint_standard', 4, false, null, 1, 'Batch Shallow Work',
'Email is not deep work. It''s shallow, reactive, and addictive. Today, batch your email into one 20-minute slot. Close your inbox the rest of the day. Your attention is too valuable to give away for free.

**Today''s Action:**
- 2×25 min Pomodoro
- Batch email to one window

**Evening Check-in:**
- Evening reflection
- Phone out of bedroom',
'Email is not deep work', null, null, null),

('sprint_standard', 5, false, null, 1, 'Deep Work Defined',
'What is deep work? Cal Newport defines it as ''professional activities performed in a state of distraction-free concentration that push your cognitive capabilities.'' Today, you''ll do 50 minutes. No interruptions. Just one task.

**Today''s Action:**
- 1×50 min deep work block
- Celebrate progress

**Evening Check-in:**
- Celebrate progress
- Phone out of bedroom',
'What is deep work? (Cal Newport)', null, null, null),

('sprint_standard', 6, false, null, 1, 'Weekly Review Prep',
'Measure what matters. Tomorrow is your weekly review. Today, just notice: How many Pomodoros did you complete? What distracted you most? Data doesn''t lie. Track your growth.

**Today''s Action:**
- 1×50 min deep work block
- Prepare for weekly review

**Evening Check-in:**
- Prepare for review
- Phone out of bedroom',
'Measure what matters', null, null, null),

('sprint_standard', 7, false, null, 1, 'Weekly Review',
'Reflect, don''t regret. Weekly review is not a report card. It''s a compass. What worked? What didn''t? One small change for next week. Take 10 minutes. This habit separates those who change from those who just try.

**Today''s Action:**
- No Pomodoro (rest day)
- Complete weekly review

**Evening Check-in:**
- Complete weekly review
- Phone out of bedroom',
'Reflect, don''t regret', null, null, null),

-- Week 2: Morning Routine (Days 8-14)
('sprint_standard', 8, false, null, 2, 'The First Win – Make Your Bed',
'Make your bed. It takes 30 seconds. But it tells your brain: ''I complete things. I start the day with a win.'' Research shows bed-makers are more productive, happier, and better at sticking to goals. Do it before you leave the bedroom.

**Today''s Action:**
- 1×50 min deep work block
- Make bed within 5 min of waking

**Evening Check-in:**
- Phone away
- Phone out of bedroom',
'Make your bed – your first win', null, null, null),

('sprint_standard', 9, false, null, 2, 'No Phone First 30 Minutes',
'Your morning is sacred. If you fill it with notifications, you start reactive, not proactive. Today, when you wake up, leave your phone in another room. No checking. No scrolling. For 30 minutes, you are offline.

**Today''s Action:**
- 1×50 min deep work block
- No phone for first 30 min awake

**Evening Check-in:**
- Log phone usage
- Phone out of bedroom',
'Your morning is sacred – protect it', null, null, null),

('sprint_standard', 10, false, null, 2, 'One Big Task',
'Eat that frog. Identify your One Big Task – the single most important thing you can do today. Write it down: ''Today I will [action] by [time].'' Then do it first, before email, before anything else.

**Today''s Action:**
- 1×50 min deep work block
- Write tomorrow''s OBT tonight

**Evening Check-in:**
- Write tomorrow''s OBT
- Phone out of bedroom',
'Eat that frog – One Big Task', null, null, null),

('sprint_standard', 11, false, null, 2, 'Morning Hydration',
'Lemon water and brain function. After 6–8 hours of sleep, your body is dehydrated. Even 1% dehydration impairs focus. Within 10 minutes of waking, drink a full glass of water. Add lemon for vitamin C and electrolytes.

**Today''s Action:**
- 2×25 min Pomodoro
- Prepare water on nightstand tonight

**Evening Check-in:**
- Prepare water
- Phone out of bedroom',
'Lemon water & brain function', null, null, null),

('sprint_standard', 12, false, null, 2, 'Silence & Stillness',
'Train your attention with silence. Spend 2 minutes after waking just sitting. No phone. No music. No planning. Just breathe. This is not meditation – it''s attention training. Your mind will wander. Bring it back.

**Today''s Action:**
- 2×25 min Pomodoro
- 2 minutes of silence after waking

**Evening Check-in:**
- Evening gratitude (1 thing)
- Phone out of bedroom',
'Train your attention with silence', null, null, null),

('sprint_standard', 13, false, null, 2, 'Weekly Review Prep',
'Small wins compound. You''ve made your bed, avoided your phone, hydrated, and planned your OBT. These tiny habits are not small. They are the foundation of discipline. Tomorrow, we review.

**Today''s Action:**
- 1×50 min deep work block
- Review morning streak

**Evening Check-in:**
- Review morning streak
- Phone out of bedroom',
'Small wins compound', null, null, null),

('sprint_standard', 14, false, null, 2, 'Weekly Review – Morning Fortress',
'Build your morning fortress. This week, you built a morning routine that works. Next week, we tackle distractions. But first, reflect. What morning habit felt easiest? Which one will you keep forever?

**Today''s Action:**
- No Pomodoro (rest day)
- Complete weekly review

**Evening Check-in:**
- Complete weekly review
- Phone out of bedroom',
'Build your morning fortress', null, null, null),

-- Week 3: Distraction Logging & Urge Surfing (Days 15-21)
('sprint_standard', 15, false, null, 3, 'The Distraction Log',
'Name it to tame it. Today, every time you feel the urge to check your phone, switch tasks, or open a new tab – write it down. Just one word: ''Instagram'', ''Email'', ''Boredom''. Awareness is the first step to control.

**Today''s Action:**
- 1×25 min Pomodoro + log urges
- Log 3 distractions

**Evening Check-in:**
- Log 3 distractions
- Phone out of bedroom',
'Name it to tame it – distraction log', null, null, null),

('sprint_standard', 16, false, null, 3, 'Urge Surfing',
'The 10-minute rule. When you feel an urge, tell yourself: ''I can do it, but I''ll wait 10 minutes.'' Set a timer. After 10 minutes, the urge often fades. If it doesn''t, you can do it – but most times, you won''t want to.

**Today''s Action:**
- 2×25 min Pomodoro + log
- Surf one urge today

**Evening Check-in:**
- Surf one urge
- Phone out of bedroom',
'The 10-minute rule (urge surfing)', null, null, null),

('sprint_standard', 17, false, null, 3, 'Notification Detox',
'Your phone is a tool, not a master. Go into your settings and turn off all non-human notifications. No news alerts. No app promotions. No ''likes''. Keep only calls and texts from real people. You''ll feel calmer within hours.

**Today''s Action:**
- 2×25 min Pomodoro
- Mute one app

**Evening Check-in:**
- Mute one app
- Phone out of bedroom',
'Your phone is a tool, not a master', null, null, null),

('sprint_standard', 18, false, null, 3, 'Single-Tasking',
'Multitasking is a myth. Your brain doesn''t do two things at once. It switches rapidly, losing time and accuracy each time. Today, do one thing at a time. Eat lunch without your phone. Work without tabs.

**Today''s Action:**
- 1×50 min deep work block
- Log task switches

**Evening Check-in:**
- Log task switches
- Phone out of bedroom',
'Multitasking is a myth', null, null, null),

('sprint_standard', 19, false, null, 3, 'Batching Distractions',
'Schedule your scrolling. You don''t have to quit social media. Just batch it. Give yourself 15 minutes at lunch and 15 minutes at 5pm. Outside those windows, no scrolling. Your attention is currency – spend it wisely.

**Today''s Action:**
- 1×50 min deep work block
- Batch email only

**Evening Check-in:**
- Batch email
- Phone out of bedroom',
'Schedule your scrolling', null, null, null),

('sprint_standard', 20, false, null, 3, 'Weekly Review Prep',
'Your attention is currency. This week, you logged distractions, surfed urges, and batched notifications. Look back at your distraction log. What''s the one trigger that appears most often? That''s your target.

**Today''s Action:**
- 2×25 min Pomodoro
- Review distraction log

**Evening Check-in:**
- Review distraction log
- Phone out of bedroom',
'Your attention is currency', null, null, null),

('sprint_standard', 21, false, null, 3, 'Weekly Review – Distraction Mastery',
'Progress over perfection. You don''t need to eliminate all distractions. You just need to reduce them. One less check per day is 365 less checks per year. That''s hours of reclaimed time. Celebrate small wins.

**Today''s Action:**
- No Pomodoro (rest day)
- Complete weekly review

**Evening Check-in:**
- Complete weekly review
- Phone out of bedroom',
'Progress over perfection', null, null, null),

-- Week 4: Integration & Project Completion (Days 22-30)
('sprint_standard', 22, false, null, 4, 'Combine All Habits',
'Your toolkit is ready. You have a morning routine, deep work habit, distraction log, and urge surfing. Today, do all of them. Lemon water, micro-journal, one Pomodoro, evening check-in. You''re not learning anymore – you''re executing.

**Today''s Action:**
- 1×50 min deep work block
- All anchors checked

**Evening Check-in:**
- All anchors checked
- Phone out of bedroom',
'Your toolkit is ready – use it', null, null, null),

('sprint_standard', 23, false, null, 4, 'Project Final Push',
'The last mile. If you started with a One Big Task, today is about finishing it. The final 10% takes 90% of the effort. Push through. You didn''t come this far to stop now.

**Today''s Action:**
- 2×25 min Pomodoro
- One Big Task progress

**Evening Check-in:**
- One Big Task progress
- Phone out of bedroom',
'The last mile – finish strong', null, null, null),

('sprint_standard', 24, false, null, 4, 'Handle Setbacks',
'Rescue protocol. If you miss a day, don''t spiral. Do just 10 minutes of deep work and log it. That''s it. One small action breaks the shame cycle. Tomorrow, you''re back.

**Today''s Action:**
- 2×25 min Pomodoro
- If missed, restart small

**Evening Check-in:**
- If missed, restart small
- Phone out of bedroom',
'Rescue protocol – start small', null, null, null),

('sprint_standard', 25, false, null, 4, 'Celebrate Wins',
'You''ve earned it. 25 days of showing up. Write down three wins – no matter how small. ''I made my bed every day.'' ''I finished my OBT.'' ''I didn''t quit.'' Celebrating is not arrogance. It''s fuel.

**Today''s Action:**
- 1×50 min deep work block
- Write 3 wins

**Evening Check-in:**
- Write 3 wins
- Phone out of bedroom',
'You''ve earned it – celebrate', null, null, null),

('sprint_standard', 26, false, null, 4, 'Plan Your Next Step',
'What''s next? You can repeat Sprint with a new OBT, upgrade to Transform for deeper change, or maintain with weekly check-ins. Discipline is not a destination. It''s a direction. Choose your path.

**Today''s Action:**
- 1×50 min deep work block
- Choose: repeat or upgrade

**Evening Check-in:**
- Choose next step
- Phone out of bedroom',
'What''s next? Plan your journey', null, null, null),

('sprint_standard', 27, false, null, 4, 'Weekly Review Prep',
'30 days of showing up. That''s not a streak. That''s proof. Proof that you are someone who follows through. Tomorrow, we graduate. But today, just reflect: What changed most in you?

**Today''s Action:**
- 2×25 min Pomodoro
- Review all weeks

**Evening Check-in:**
- Review all weeks
- Phone out of bedroom',
'30 days of showing up', null, null, null),

('sprint_standard', 28, false, null, 4, 'Final Review',
'You did it. 30 days of lemon water, micro-journals, Pomodoros, and evening check-ins. Not perfect. But consistent. That''s discipline. Today, complete your final review. Then celebrate.

**Today''s Action:**
- Optional Pomodoro
- Complete program

**Evening Check-in:**
- Complete program
- Phone out of bedroom',
'You did it – graduation', null, null, null),

('sprint_standard', 29, false, null, 4, 'Graduation Day 1 – Reflection',
'Reflect on your biggest change. Maybe you wake earlier. Maybe you focus longer. Maybe you just trust yourself more. Write it down. That''s your transformation story.

**Today''s Action:**
- Rest day
- Answer reflection

**Evening Check-in:**
- Answer reflection
- Phone out of bedroom (optional)',
'Reflect on your biggest change', null, null, null),

('sprint_standard', 30, false, null, 4, 'Graduation Day 2 – Certificate',
'Download your certificate. You''ve earned it. Share it if you want. Or keep it as a reminder. You are not the person who started 30 days ago. You are disciplined. You are focused. You are in control.

**Today''s Action:**
- Rest day
- Download certificate
- Choose next step

**Evening Check-in:**
- Download certificate
- Choose next step',
'Download your certificate', null, null, null);

-- Verify import
-- Should return 30
SELECT COUNT(*) FROM public.daily_lessons
WHERE program_type = 'sprint_standard'
  AND COALESCE(is_bonus, false) = false;
