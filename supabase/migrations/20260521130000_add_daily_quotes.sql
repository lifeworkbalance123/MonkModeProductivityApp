-- Daily motivational quotes (60 slots, cycle on program day).

CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 60),
  quote_text TEXT NOT NULL,
  author TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (day_number)
);

CREATE INDEX IF NOT EXISTS daily_quotes_day_number_idx ON public.daily_quotes (day_number);

DROP TRIGGER IF EXISTS daily_quotes_set_updated_at ON public.daily_quotes;
CREATE TRIGGER daily_quotes_set_updated_at
  BEFORE UPDATE ON public.daily_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read active daily_quotes" ON public.daily_quotes;
CREATE POLICY "Users read active daily_quotes"
  ON public.daily_quotes
  FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Admins manage daily_quotes" ON public.daily_quotes;
CREATE POLICY "Admins manage daily_quotes"
  ON public.daily_quotes
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quotes TO authenticated;

COMMENT ON TABLE public.daily_quotes IS 'Curated morning quotes; day_number 1–60 cycles with program day modulo 60.';

INSERT INTO public.daily_quotes (day_number, quote_text, author) VALUES
(1, 'Discipline is the bridge between goals and accomplishment.', 'Jim Rohn'),
(2, 'The man who moves a mountain begins by carrying away small stones.', 'Confucius'),
(3, 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Aristotle'),
(4, 'The successful warrior is the average man, with laser-like focus.', 'Bruce Lee'),
(5, 'It does not matter how slowly you go as long as you do not stop.', 'Confucius'),
(6, 'The only way to do great work is to love what you do.', 'Steve Jobs'),
(7, 'Focus on being productive instead of busy.', 'Tim Ferriss'),
(8, 'You will never change your life until you change something you do daily.', 'John C. Maxwell'),
(9, 'Small disciplines repeated with consistency every day lead to great achievements.', 'John C. Maxwell'),
(10, 'The secret of getting ahead is getting started.', 'Mark Twain'),
(11, 'Do the hard jobs first. The easy jobs will take care of themselves.', 'Dale Carnegie'),
(12, 'Concentrate all your thoughts upon the work at hand. The sun''s rays do not burn until brought to a focus.', 'Alexander Graham Bell'),
(13, 'What you do today can improve all your tomorrows.', 'Ralph Marston'),
(14, 'The future depends on what you do today.', 'Mahatma Gandhi'),
(15, 'Either you run the day, or the day runs you.', 'Jim Rohn'),
(16, 'Without commitment, you cannot have depth in anything.', 'Nile Rodgers'),
(17, 'The key is not to prioritize what''s on your schedule, but to schedule your priorities.', 'Stephen Covey'),
(18, 'Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', 'Chuck Close'),
(19, 'Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'),
(20, 'A year from now you may wish you had started today.', 'Karen Lamb'),
(21, 'The way to get started is to quit talking and begin doing.', 'Walt Disney'),
(22, 'Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson'),
(23, 'Quality is not an act, it is a habit.', 'Aristotle'),
(24, 'Motivation is what gets you started. Habit is what keeps you going.', 'Jim Ryun'),
(25, 'The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese proverb'),
(26, 'Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'),
(27, 'Your mind is for having ideas, not holding them.', 'David Allen'),
(28, 'The difference between ordinary and extraordinary is that little extra.', 'Jimmy Johnson'),
(29, 'If you want to live a happy life, tie it to a goal, not to people or things.', 'Albert Einstein'),
(30, 'Action is the foundational key to all success.', 'Pablo Picasso'),
(31, 'Well done is better than well said.', 'Benjamin Franklin'),
(32, 'You don''t have to be great to start, but you have to start to be great.', 'Zig Ziglar'),
(33, 'The harder you work for something, the greater you''ll feel when you achieve it.', NULL),
(34, 'Dream big. Start small. Act now.', 'Robin Sharma'),
(35, 'Don''t count the days, make the days count.', 'Muhammad Ali'),
(36, 'Energy and persistence conquer all things.', 'Benjamin Franklin'),
(37, 'What we fear doing most is usually what we most need to do.', 'Tim Ferriss'),
(38, 'The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt'),
(39, 'If you are not willing to risk the usual, you will have to settle for the ordinary.', 'Jim Rohn'),
(40, 'Opportunities don''t happen. You create them.', 'Chris Grosser'),
(41, 'It always seems impossible until it''s done.', 'Nelson Mandela'),
(42, 'Don''t be pushed around by the fears in your mind. Be led by the dreams in your heart.', 'Roy T. Bennett'),
(43, 'Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau'),
(44, 'The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson'),
(45, 'Go as far as you can see; when you get there, you''ll be able to see further.', 'Thomas Carlyle'),
(46, 'Your limitation—it''s only your imagination.', NULL),
(47, 'Push yourself, because no one else is going to do it for you.', NULL),
(48, 'Sometimes later becomes never. Do it now.', NULL),
(49, 'Great things never come from comfort zones.', NULL),
(50, 'Dream it. Wish it. Do it.', NULL),
(51, 'Success doesn''t just find you. You have to go out and get it.', NULL),
(52, 'The harder you work, the luckier you get.', 'Gary Player'),
(53, 'Don''t stop when you''re tired. Stop when you''re done.', NULL),
(54, 'Wake up with determination. Go to bed with satisfaction.', NULL),
(55, 'Do something today that your future self will thank you for.', NULL),
(56, 'Little things make big days.', NULL),
(57, 'It''s going to be hard, but hard does not mean impossible.', NULL),
(58, 'Don''t wait for opportunity. Create it.', NULL),
(59, 'Sometimes we''re tested not to show our weaknesses, but to discover our strengths.', NULL),
(60, 'The key to success is to focus on goals, not obstacles.', NULL)
ON CONFLICT (day_number) DO NOTHING;
