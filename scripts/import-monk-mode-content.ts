import { createClient } from '@supabase/supabase-js'

type LessonRow = {
  program_type: 'sprint_monk'
  program_day: number
  is_bonus: false
  parent_day_number: null
  phase: number
  title: string
  tip_topic: string
  content_markdown: string
  audio_url: null
  video_url: null
  image_url: null
}

const monkModeLessons: LessonRow[] = [
  { program_type: 'sprint_monk', program_day: 1, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 1: Identity Lock-In', tip_topic: 'Identity', content_markdown: '# Day 1: Identity Lock-In\n\nToday is about identity, not effort.\n\n- Decide: "I am the person who ships."\n- Pick one project that matters for the next 21 days.\n- Write your non-negotiable deep-work window.\n\n**Prompt:** What does a successful Day 21 version of me look like?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 2, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 2: Environment Reset', tip_topic: 'Environment Design', content_markdown: '# Day 2: Environment Reset\n\nYour environment should make focus easier than distraction.\n\n- Remove friction from starting work.\n- Add friction to social and noise.\n- Prepare your desk and tools before your first block.\n\n**Prompt:** What one environmental change gave you the biggest leverage today?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 3, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 3: Attention Audit', tip_topic: 'Awareness', content_markdown: '# Day 3: Attention Audit\n\nTrack where your attention leaks.\n\n- Log each context switch.\n- Count how often you break your own focus.\n- Identify your top two distraction triggers.\n\n**Prompt:** Which trigger sabotages you the most?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 4, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 4: Deep Work Ritual', tip_topic: 'Ritual', content_markdown: '# Day 4: Deep Work Ritual\n\nCreate the same pre-focus ritual each day.\n\n- Start with one minute of stillness.\n- Define one clear outcome for this block.\n- Begin with the hardest action first.\n\n**Prompt:** Which ritual step instantly signals "it is time to focus"?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 5, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 5: Single-Task Discipline', tip_topic: 'Execution', content_markdown: '# Day 5: Single-Task Discipline\n\nMultitasking is hidden quitting.\n\n- Choose one target for each session.\n- Keep a parking lot list for side thoughts.\n- Finish before switching.\n\n**Prompt:** What unfinished switch cost you the most energy this week?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 6, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 6: Frictionless Start', tip_topic: 'Momentum', content_markdown: '# Day 6: Frictionless Start\n\nStarting fast beats perfect planning.\n\n- Define your first 5-minute action before bed.\n- Open the exact file or document in advance.\n- Start before checking messages.\n\n**Prompt:** What made your start faster today?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 7, is_bonus: false, parent_day_number: null, phase: 1, title: 'Day 7: Week 1 Review', tip_topic: 'Reflection', content_markdown: '# Day 7: Week 1 Review\n\nReview the process, not just output.\n\n- What worked repeatedly?\n- What keeps interrupting focus?\n- What one rule will you tighten for Week 2?\n\n**Prompt:** Write your Week 2 operating rule.', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 8, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 8: Capacity Expansion', tip_topic: 'Stamina', content_markdown: '# Day 8: Capacity Expansion\n\nSlightly extend your deep-work capacity.\n\n- Add 10-20 more focused minutes.\n- Keep break quality high (walk, water, breathe).\n- Protect recovery after intense blocks.\n\n**Prompt:** How did your focus quality change with longer duration?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 9, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 9: Distraction Intercepts', tip_topic: 'Interruption Control', content_markdown: '# Day 9: Distraction Intercepts\n\nInterruptions are predictable.\n\n- Pre-write "Not now" responses.\n- Silence non-essential notifications.\n- Block known distraction windows.\n\n**Prompt:** Which intercept saved your focus today?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 10, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 10: Output Over Busyness', tip_topic: 'Prioritization', content_markdown: '# Day 10: Output Over Busyness\n\nBusy is not productive.\n\n- Pick one measurable output for today.\n- Timebox low-value admin.\n- Ship something concrete before noon if possible.\n\n**Prompt:** What did you actually ship today?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 11, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 11: Energy Protocol', tip_topic: 'Recovery', content_markdown: '# Day 11: Energy Protocol\n\nFocus depends on energy management.\n\n- Hydrate and move before your first block.\n- Use short resets between sessions.\n- Stop grinding when quality drops, then reset.\n\n**Prompt:** Which reset most restored your attention?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 12, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 12: Boredom Tolerance', tip_topic: 'Mental Endurance', content_markdown: '# Day 12: Boredom Tolerance\n\nBoredom is a gateway to depth.\n\n- Stay with hard work past the urge to escape.\n- Delay stimulation for 10 extra minutes.\n- Notice the moment depth begins after resistance.\n\n**Prompt:** What happened after you stayed in discomfort?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 13, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 13: Constraint Sprint', tip_topic: 'Focus Constraints', content_markdown: '# Day 13: Constraint Sprint\n\nConstraints create clarity.\n\n- Reduce today\'s goal to one narrow outcome.\n- Limit tools and tabs to essentials.\n- Work in one environment only.\n\n**Prompt:** Which constraint sharpened your execution?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 14, is_bonus: false, parent_day_number: null, phase: 2, title: 'Day 14: Week 2 Review', tip_topic: 'Review and Adjust', content_markdown: '# Day 14: Week 2 Review\n\nYou are halfway through Monk Mode.\n\n- Compare Week 2 to Week 1.\n- Keep one behavior, remove one behavior, add one behavior.\n- Re-commit to your Day 21 outcome.\n\n**Prompt:** What is your single most important adjustment for Week 3?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 15, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 15: Precision Planning', tip_topic: 'Planning', content_markdown: '# Day 15: Precision Planning\n\nPlan less, execute better.\n\n- Define top 3 execution moves before first block.\n- Estimate time realistically.\n- Leave margin for one unexpected issue.\n\n**Prompt:** Which planned move delivered the highest ROI?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 16, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 16: Hardest Task First', tip_topic: 'Courage', content_markdown: '# Day 16: Hardest Task First\n\nWin the day early.\n\n- Start with the most avoided task.\n- Work without negotiation for the first block.\n- Delay easy work until after meaningful progress.\n\n**Prompt:** What did doing the hardest task first change?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 17, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 17: Recovery Discipline', tip_topic: 'Sustainability', content_markdown: '# Day 17: Recovery Discipline\n\nRecovery is part of performance.\n\n- Finish focus blocks with intention, not collapse.\n- Protect sleep setup tonight.\n- End the day with a short shutdown review.\n\n**Prompt:** What recovery habit most affects tomorrow\'s focus?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 18, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 18: Anti-Drift System', tip_topic: 'Consistency', content_markdown: '# Day 18: Anti-Drift System\n\nDrift happens gradually.\n\n- Set a midday checkpoint.\n- Compare actual vs planned work.\n- Correct course immediately.\n\n**Prompt:** Where did drift start today, and how did you stop it?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 19, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 19: Final Push Strategy', tip_topic: 'Momentum', content_markdown: '# Day 19: Final Push Strategy\n\nEnter finish mode.\n\n- Remove optional commitments for the next 72 hours.\n- Double down on your highest leverage block.\n- Protect your morning execution window.\n\n**Prompt:** What are you saying no to for the final push?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 20, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 20: Delivery Day', tip_topic: 'Shipping', content_markdown: '# Day 20: Delivery Day\n\nCompletion beats perfection.\n\n- Ship a meaningful milestone today.\n- Capture what remains for Day 21 closure.\n- Communicate outcomes clearly.\n\n**Prompt:** What did you deliver that mattered?', audio_url: null, video_url: null, image_url: null },
  { program_type: 'sprint_monk', program_day: 21, is_bonus: false, parent_day_number: null, phase: 3, title: 'Day 21: Monk Mode Integration', tip_topic: 'Integration', content_markdown: '# Day 21: Monk Mode Integration\n\nTurn this sprint into a system.\n\n- Review all 21 days.\n- Document your personal Monk Mode playbook.\n- Choose the next 30-day continuation protocol.\n\n**Prompt:** Which three habits will you keep permanently?', audio_url: null, video_url: null, image_url: null },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.',
    )
  }

  if (monkModeLessons.length !== 21) {
    throw new Error(`Expected 21 lessons, got ${monkModeLessons.length}.`)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { error } = await supabase.from('daily_lessons').upsert(monkModeLessons, {
    onConflict: 'program_type,program_day,is_bonus',
  })

  if (error) {
    throw error
  }

  console.log(`Imported ${monkModeLessons.length} sprint_monk lessons successfully.`)
}

main().catch((error) => {
  console.error('Monk Mode import failed:', error)
  process.exit(1)
})
