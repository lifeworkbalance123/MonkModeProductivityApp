-- Monk Mode (sprint_monk) – 21 days
-- Replace existing non-bonus sprint_monk lessons with the latest approved copy.

DELETE FROM public.daily_lessons
WHERE program_type = 'sprint_monk'
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

-- Week 1: Deep Work Ramp-Up (Days 1-7)
('sprint_monk', 1, false, null, 1, 'Lock In', 
'Monk Mode is not for the faint of heart. You will do 2–4 hours of focused work daily. No social media during blocks. Cold exposure (15 seconds minimum). And you show up even when you don''t want to. This is your oath. Lock in.

**Today''s Action:**
- Define your One Big Task (OBT)
- Complete 2×25 min Pomodoro sessions
- Log distractions

**Evening Check-in:**
- Did you complete your OBT work?
- Energy rating (1-5)
- Phone out of bedroom',
'Define your OBT and start your first Pomodoro', null, null, null),

('sprint_monk', 2, false, null, 1, 'Build Stamina',
'No social media during focus blocks. Your brain needs uninterrupted time to enter flow. Each time you check your phone, you lose 23 minutes of refocus time. Protect your blocks like your life depends on it.

**Today''s Action:**
- 2×25 min Pomodoro on OBT
- Delete 1 time-wasting app
- Log each urge to check phone

**Evening Check-in:**
- Did you avoid social media during blocks?
- Energy rating (1-5)',
'Delete one app – reclaim your attention', null, null, null),

('sprint_monk', 3, false, null, 1, 'First 50-Min Block',
'Deep work = hard work. It''s cognitively demanding, not reactive. If you''re checking email or scrolling, that''s not deep work. Real deep work feels uncomfortable. That''s how you know it''s working.

**Today''s Action:**
- 2×50 min deep work blocks
- Batch email – check only once today
- Log your deepest focus moment

**Evening Check-in:**
- Did you batch email?
- Energy rating (1-5)',
'Batch email – twice daily maximum', null, null, null),

('sprint_monk', 4, false, null, 1, 'Morning Fortress',
'No phone for the first hour of your day. Not even ''just to check the time''. Your morning sets the tone. If you start reactive, you stay reactive. Wake, hydrate, move, then work. Phone stays in another room.

**Today''s Action:**
- 2×50 min deep work blocks
- Make bed within 5 min of waking
- Write OBT for tomorrow before bed

**Evening Check-in:**
- Did you avoid phone for first hour?
- Energy rating (1-5)',
'No phone for first hour – protect your morning', null, null, null),

('sprint_monk', 5, false, null, 1, 'First 90-Min Block',
'The gold standard of focus is the 90-minute block. Cal Newport calls this the core of deep work. You''ll feel resistance around minute 60. Push through. The last 30 minutes are where breakthroughs happen.

**Today''s Action:**
- 1×90 min deep work block (no timer)
- 1×25 min Pomodoro (afternoon)
- Cold splash at end of shower (15 sec)

**Evening Check-in:**
- Did you complete the 90-min block?
- Energy rating (1-5)',
'First 90-min block – push through resistance', null, null, null),

('sprint_monk', 6, false, null, 1, 'Double 90 – Elite Focus',
'Elite focus means two 90-minute blocks in one day. This is what separates the top 1% of performers. Morning block: your hardest task. Afternoon block: your second hardest. Take a 30-min break between – walk, eat, rest your eyes.

**Today''s Action:**
- 2×90 min deep work blocks
- Log energy before and after each block
- Cold exposure: 30 seconds

**Evening Check-in:**
- What was your biggest win today?
- Energy rating (1-5)',
'Double 90 – elite focus for top performers', null, null, null),

('sprint_monk', 7, false, null, 1, 'Weekly Review',
'Crush your week by reviewing it. Today, no new deep work. Just reflect. What worked? What didn''t? What one change will make next week better? This 15-minute ritual doubles your progress.

**Today''s Action:**
- Complete weekly review (in app)
- Optional: 1×90 min block if you have energy
- Rest or light task only

**Evening Check-in:**
- Weekly review completed?
- Energy rating (1-5)',
'Weekly review – 15 minutes to double your progress', null, null, null),

-- Week 2: Environment & Attention Lock (Days 8-14)
('sprint_monk', 8, false, null, 2, 'Digital Declutter',
'Delete, don''t organise. You don''t need folders for your apps. You need fewer apps. Today, delete two apps from your phone that steal time. Not ''move to a folder''. Delete. You''ll feel lighter.

**Today''s Action:**
- 2×90 min deep work blocks
- Delete 2 time-wasting apps
- Log how you felt after deleting

**Evening Check-in:**
- Which apps did you delete?
- Energy rating (1-5)',
'Delete two apps – less clutter, more focus', null, null, null),

('sprint_monk', 9, false, null, 2, 'Notification Zero',
'Mute everything that isn''t a human. News alerts, app promotions, game invites, ''likes'' – all of it. Your phone should be a tool, not a circus. Go to settings and turn off all non-human notifications. Today.

**Today''s Action:**
- 2×90 min deep work blocks
- Turn off all non-human notifications
- Notice how quiet your phone feels

**Evening Check-in:**
- Notifications muted?
- Energy rating (1-5)',
'Mute all non-human notifications – reclaim your attention', null, null, null),

('sprint_monk', 10, false, null, 2, 'Urge Surfing Mastery',
'When you feel the urge to check your phone or switch tasks, wait 10 minutes. Set a timer. Surf the urge like a wave – it rises, peaks, and falls. After 10 minutes, you usually won''t want to do it. Try it today.

**Today''s Action:**
- 2×90 min deep work blocks
- Log every urge you felt
- Practice the 10-minute rule at least 3 times

**Evening Check-in:**
- How many urges did you surf?
- Energy rating (1-5)',
'Urge surfing – wait 10 minutes before giving in', null, null, null),

('sprint_monk', 11, false, null, 2, 'Batching Master',
'Email is not deep work. Check email twice daily – once at 11am, once at 3pm. Outside those windows, close your email tab. Turn off notifications. Your attention is too valuable to give away for free.

**Today''s Action:**
- 2×90 min deep work blocks
- Only 2 email windows today
- Close email tab outside those windows

**Evening Check-in:**
- Did you stick to 2 email windows?
- Energy rating (1-5)',
'Batch email – twice daily maximum', null, null, null),

('sprint_monk', 12, false, null, 2, 'Physical Anchor – Cold Exposure',
'Cold exposure builds mental resilience. At the end of your shower, turn the water cold for 30 seconds. Breathe. Your brain will scream at you to turn it off. That''s the old you. The new you stays. Tomorrow, 45 seconds.

**Today''s Action:**
- 1×90 min + 1×50 min deep work
- Cold shower: 30 seconds
- 5-minute exercise snack

**Evening Check-in:**
- Cold exposure completed? (log seconds)
- Energy rating (1-5)',
'Cold exposure – 30 seconds of mental resilience', null, null, null),

('sprint_monk', 13, false, null, 2, 'Combine Disciplines',
'Deep work + cold exposure + movement. These three disciplines reinforce each other. Cold builds resilience. Movement wakes your body. Deep work channels that energy into output. You are becoming unbreakable.

**Today''s Action:**
- 2×90 min deep work blocks
- Cold shower: 45 seconds
- 5-minute exercise snack

**Evening Check-in:**
- One sentence: "I felt _____ today"
- Energy rating (1-5)',
'Combine disciplines – deep work, cold, movement', null, null, null),

('sprint_monk', 14, false, null, 2, 'Weekly Review – Mid-Point Intensity',
'You''re halfway through Monk Mode. Look back at days 1–7. What was your hardest moment? Your biggest win? Use that fuel for the final week. You''ve already done more than most people attempt.

**Today''s Action:**
- 1×90 min deep work block
- Complete weekly review (in app)
- Rest or light task only

**Evening Check-in:**
- Weekly review completed?
- Energy rating (1-5)',
'Mid-point review – reflect and refuel', null, null, null),

-- Week 3: Execution & Delivery (Days 15-21)
('sprint_monk', 15, false, null, 3, 'Final Push',
'The last week. Your OBT should be at least 50% complete. If not, adjust your plan. The next 7 days are about delivery. No excuses. No half-effort. Show up every day like it''s day 1.

**Today''s Action:**
- 2×90 min deep work blocks
- Review OBT progress
- Break remaining tasks into daily chunks

**Evening Check-in:**
- OBT progress (% complete)
- Energy rating (1-5)',
'Final push – deliver on your One Big Task', null, null, null),

('sprint_monk', 16, false, null, 3, 'No Excuses',
'Show up even when you''re tired. Especially when you''re tired. Discipline is not about motivation. It''s about doing the work when you don''t feel like it. Today, you show up. No excuses.

**Today''s Action:**
- 2×90 min deep work blocks
- Cold shower: 60 seconds
- Log your energy before starting

**Evening Check-in:**
- Did you show up even when tired?
- Energy rating (1-5)',
'No excuses – show up tired', null, null, null),

('sprint_monk', 17, false, null, 3, 'Deliberate Practice',
'Get better, not just done. Today, spend 20 minutes on deliberate practice – a skill you want to improve. Typing, coding, public speaking, a language. Then record one observation: ''What was hard? What felt better?'' 

**Today''s Action:**
- 1×90 min deep work block (OBT focus)
- 20 min deliberate practice
- Write one self-observation

**Evening Check-in:**
- What skill did you practice?
- Energy rating (1-5)',
'Deliberate practice – 20 minutes to get better', null, null, null),

('sprint_monk', 18, false, null, 3, 'Rescue Drill',
'If you slip, recover fast. Write a one-sentence rescue plan: ''If I miss a day, I will do just 10 minutes of deep work and log it.'' This small plan prevents shame spirals. You will have bad days. That''s human. Recover like a disciplined person.

**Today''s Action:**
- 2×90 min deep work blocks
- Write your rescue plan
- Simulate a high-distraction scenario

**Evening Check-in:**
- Rescue plan written?
- Energy rating (1-5)',
'Rescue plan – recover fast from setbacks', null, null, null),

('sprint_monk', 19, false, null, 3, 'Project Wrap – Deliver',
'Deliver. Today, you complete your One Big Task. Not ''make progress''. Complete. The final 10% takes 90% of the effort. Push through. You didn''t come this far to stop now.

**Today''s Action:**
- 2×90 min deep work blocks
- Finish OBT
- Celebrate – 15 min break, walk outside

**Evening Check-in:**
- OBT completed?
- Energy rating (1-5)',
'Complete your OBT – deliver the final 10%', null, null, null),

('sprint_monk', 20, false, null, 3, 'Final Review',
'21 days of intensity. Today, look back. What changed? You woke earlier, focused longer, resisted urges, stood under cold water. You are not the same person who started. Write down one thing you''ll keep forever.

**Today''s Action:**
- 1×90 min deep work block (optional)
- Complete final weekly review
- Write your ''forever anchor''

**Evening Check-in:**
- Final review completed?
- Energy rating (1-5)',
'Final review – choose your forever anchor', null, null, null),

('sprint_monk', 21, false, null, 3, 'Graduation – Monk Mode Conqueror',
'Monk Mode conqueror. You did it. 21 days of lockdown, deep work, cold exposure, and showing up. Today, rest. No deep work. No cold shower (unless you want to). Just celebrate. Download your certificate. Share your win. You''ve earned it.

**Today''s Action:**
- Rest day – no required actions
- Download certificate from app
- (Optional) Share your achievement

**Evening Check-in:**
- Certificate downloaded?
- Choose next step',
'Graduation – celebrate and download certificate', null, null, null);

-- Verify import
-- Should return 21
SELECT COUNT(*) FROM public.daily_lessons WHERE program_type = 'sprint_monk' AND COALESCE(is_bonus, false) = false;
