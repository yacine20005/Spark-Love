-- Drop existing tables and types to allow for a clean re-run
DROP TABLE IF EXISTS "user_answers" CASCADE;
DROP TABLE IF EXISTS "couples" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "quiz_categories" CASCADE;
DROP TYPE IF EXISTS "question_type" CASCADE;
DROP TYPE IF EXISTS "quiz_category" CASCADE;

-- Supabase Schema for Spark Love Quiz App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'scale',
  'text',
  'yes_no'
);

-- Profiles table to store public user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Categories table
CREATE TABLE quiz_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL, -- Storing emoji as text
  color TEXT NOT NULL, -- Storing hex color as text
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table, now referencing quiz_categories
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES quiz_categories(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  options JSONB, -- For multiple choice questions
  min_scale INTEGER, -- For scale questions
  max_scale INTEGER, -- For scale questions
  scale_labels JSONB, -- {"min": "label", "max": "label"}
  is_active BOOLEAN DEFAULT true,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT questions_options_is_array CHECK (options IS NULL OR jsonb_typeof(options) = 'array'),
  CONSTRAINT questions_scale_labels_is_object CHECK (scale_labels IS NULL OR jsonb_typeof(scale_labels) = 'object'),
  CONSTRAINT questions_scale_min_le_max CHECK ((min_scale IS NULL AND max_scale IS NULL) OR (min_scale IS NOT NULL AND max_scale IS NOT NULL AND min_scale <= max_scale))
);

-- Couples table to store links between users
CREATE TABLE couples (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    linking_code TEXT UNIQUE, -- Temporary code for linking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensures that user1_id and user2_id pair is unique regardless of order
    CONSTRAINT ordered_couple_pair CHECK (user2_id IS NULL OR user1_id < user2_id),
    UNIQUE (user1_id, user2_id)
);

-- User answers table, now with a link to a couple
CREATE TABLE user_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE, -- Can be NULL for solo answers
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- A user can answer a question once solo, and once for each couple
  UNIQUE(user_id, question_id, couple_id)
);

-- Create indexes for better performance
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_couple_id ON user_answers(couple_id);
CREATE INDEX idx_couples_user1_id ON couples(user1_id);
CREATE INDEX idx_couples_user2_id ON couples(user2_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON couples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- This trigger automatically creates a profile entry for new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--
-- DATA INSERTION
--

-- Insert categories first
INSERT INTO quiz_categories (name, icon, color, description) VALUES
('Communication', '💬', '#FF6B6B', 'Improve how you talk and listen to each other'),
('Values', '💎', '#8B5CF6', 'Discover what matters most to both of you'),
('Hobbies', '🎨', '#10B981', 'Find activities you both enjoy'),
('Intimacy', '💕', '#EC4899', 'Deepen your emotional and physical connection'),
('Family', '👨‍👩‍👧‍👦', '#F59E0B', 'Explore your family values and future plans'),
('Future', '🔮', '#6366F1', 'Plan and dream about your future together'),
('Activities', '🎯', '#EF4444', 'Discover fun things to do together'),
('Physical', '💪', '#06B6D4', 'Explore physical activities and preferences'),
('Dates', '🍷', '#8B5A2B', 'Plan perfect date nights together'),
('Personality', '🌟', '#F97316', 'Learn more about each other''s personalities');


-- Insert sample questions, linking them to categories via a subquery
INSERT INTO questions (text, category_id, type, options, min_scale, max_scale, scale_labels, release_date) VALUES
-- Communication
('How do you prefer to communicate when we''re not together?', (SELECT id from quiz_categories where name = 'Communication'), 'multiple_choice', '["Calls", "Texts", "Video Calls", "Voice Messages"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how listened to do you feel in our relationship?', (SELECT id from quiz_categories where name = 'Communication'), 'scale', NULL, 0, 10, '{"min": "Not heard at all", "max": "Perfectly heard"}', NOW()),
('What''s the most important thing I can do to be a better communicator with you?', (SELECT id from quiz_categories where name = 'Communication'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer to address issues as soon as they arise or wait a bit?', (SELECT id from quiz_categories where name = 'Communication'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you typically react to constructive criticism from me?', (SELECT id from quiz_categories where name = 'Communication'), 'multiple_choice', '["I appreciate it", "I get defensive", "I need time to think about it", "It depends on how it''s said"]', NULL, NULL, NULL, NOW()),
('How often would you like us to have "deep talks" about our relationship?', (SELECT id from quiz_categories where name = 'Communication'), 'multiple_choice', '["Daily", "Weekly", "Monthly", "Only when necessary"]', NULL, NULL, NULL, NOW()),
('What topic is the hardest for you to bring up with me?', (SELECT id from quiz_categories where name = 'Communication'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think we are on the same page regarding non-verbal communication?', (SELECT id from quiz_categories where name = 'Communication'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is laughter in our communication?', (SELECT id from quiz_categories where name = 'Communication'), 'scale', NULL, 0, 10, '{"min": "Not important", "max": "Essential"}', NOW()),
('Is there anything you wish we would stop doing when we argue?', (SELECT id from quiz_categories where name = 'Communication'), 'text', NULL, NULL, NULL, NULL, NOW()),

-- Values
('What is your opinion on the importance of religion or spirituality in life?', (SELECT id from quiz_categories where name = 'Values'), 'multiple_choice', '["Very important", "Somewhat important", "Not very important", "Not important at all"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is political and social engagement to you?', (SELECT id from quiz_categories where name = 'Values'), 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Extremely"}', NOW()),
('Is fidelity an absolute value for you, or can it be discussed?', (SELECT id from quiz_categories where name = 'Values'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How much importance do you place on the financial independence of each partner?', (SELECT id from quiz_categories where name = 'Values'), 'multiple_choice', '["Essential", "Important but not mandatory", "Not very important", "Not important"]', NULL, NULL, NULL, NOW()),
('How would you define a "good life"?', (SELECT id from quiz_categories where name = 'Values'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think it''s important to always tell the truth, even if it might hurt?', (SELECT id from quiz_categories where name = 'Values'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is it for you that we share the same core values?', (SELECT id from quiz_categories where name = 'Values'), 'scale', NULL, 0, 10, '{"min": "Not so important", "max": "Absolutely crucial"}', NOW()),
('What is your stance on sharing household chores?', (SELECT id from quiz_categories where name = 'Values'), 'multiple_choice', '["Equal 50/50 split", "Based on availability", "Based on preference", "Traditional roles"]', NULL, NULL, NULL, NOW()),
('What is the most important value your parents passed on to you?', (SELECT id from quiz_categories where name = 'Values'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is it more important for you to be happy or to be successful?', (SELECT id from quiz_categories where name = 'Values'), 'multiple_choice', '["Happy", "Successful", "The two are linked", "Neither"]', NULL, NULL, NULL, NOW()),

-- Hobbies
('What new hobby would you like to try with me?', (SELECT id from quiz_categories where name = 'Hobbies'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer quiet activities at home or adventurous outings?', (SELECT id from quiz_categories where name = 'Hobbies'), 'multiple_choice', '["Quiet at home", "Adventurous outings", "A mix of both"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy sports activities?', (SELECT id from quiz_categories where name = 'Hobbies'), 'scale', NULL, 0, 10, '{"min": "I hate them", "max": "I love them"}', NOW()),
('Is there one of my hobbies that you would like to better understand or share?', (SELECT id from quiz_categories where name = 'Hobbies'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What type of music do you enjoy listening to the most?', (SELECT id from quiz_categories where name = 'Hobbies'), 'multiple_choice', '["Pop/Rock", "Hip-Hop/R&B", "Classical/Jazz", "Electronic", "Other"]', NULL, NULL, NULL, NOW()),
('What is the last book or movie that really made an impression on you?', (SELECT id from quiz_categories where name = 'Hobbies'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you enjoy board games or video games?', (SELECT id from quiz_categories where name = 'Hobbies'), 'multiple_choice', '["Board games", "Video games", "Both", "Neither"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how creative are you?', (SELECT id from quiz_categories where name = 'Hobbies'), 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Very creative"}', NOW()),
('What activity relaxes you the most?', (SELECT id from quiz_categories where name = 'Hobbies'), 'text', NULL, NULL, NULL, NULL, NOW()),
('If we had a completely free weekend, what would we do?', (SELECT id from quiz_categories where name = 'Hobbies'), 'multiple_choice', '["Travel", "Hike", "Binge-watch series", "See friends/family", "Do nothing special"]', NULL, NULL, NULL, NOW()),

-- Intimacy
('What is your primary love language?', (SELECT id from quiz_categories where name = 'Intimacy'), 'multiple_choice', '["Words of Affirmation", "Quality Time", "Receiving Gifts", "Acts of Service", "Physical Touch"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how satisfied are you with our intimate life?', (SELECT id from quiz_categories where name = 'Intimacy'), 'scale', NULL, 0, 10, '{"min": "Not at all satisfied", "max": "Very satisfied"}', NOW()),
('Is there anything new you would like to explore together intimately?', (SELECT id from quiz_categories where name = 'Intimacy'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is spontaneity or planning more important to you when it comes to intimacy?', (SELECT id from quiz_categories where name = 'Intimacy'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How can I make you feel more desired?', (SELECT id from quiz_categories where name = 'Intimacy'), 'text', NULL, NULL, NULL, NULL, NOW()),
('How often would you like to be intimate?', (SELECT id from quiz_categories where name = 'Intimacy'), 'multiple_choice', '["Several times a week", "Once a week", "A few times a month", "It depends on the moment"]', NULL, NULL, NULL, NOW()),
('Is emotional intimacy as important as physical intimacy for you?', (SELECT id from quiz_categories where name = 'Intimacy'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how easy is it for you to talk about your desires and boundaries?', (SELECT id from quiz_categories where name = 'Intimacy'), 'scale', NULL, 0, 10, '{"min": "Very difficult", "max": "Very easy"}', NOW()),
('What is the most intimate non-sexual gesture for you?', (SELECT id from quiz_categories where name = 'Intimacy'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think our level of intimacy has evolved positively over time?', (SELECT id from quiz_categories where name = 'Intimacy'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),

-- Family
('How important is family in your life?', (SELECT id from quiz_categories where name = 'Family'), 'multiple_choice', '["It''s the most important thing", "Very important", "Fairly important", "Not very important"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how well do you get along with my family?', (SELECT id from quiz_categories where name = 'Family'), 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Very well"}', NOW()),
('How many children would you ideally like to have?', (SELECT id from quiz_categories where name = 'Family'), 'multiple_choice', '["0", "1", "2", "3+", "I don''t know yet"]', NULL, NULL, NULL, NOW()),
('How do you envision our roles as parents?', (SELECT id from quiz_categories where name = 'Family'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is it important for you that we spend holidays (Christmas, etc.) with our families?', (SELECT id from quiz_categories where name = 'Family'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What family tradition from your childhood would you like to continue?', (SELECT id from quiz_categories where name = 'Family'), 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do your family''s opinions influence your major decisions?', (SELECT id from quiz_categories where name = 'Family'), 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "A great deal"}', NOW()),
('How would you describe your relationship with your parents?', (SELECT id from quiz_categories where name = 'Family'), 'multiple_choice', '["Very close", "Close", "Distant", "Complicated"]', NULL, NULL, NULL, NOW()),
('Do you think it''s important to live near family?', (SELECT id from quiz_categories where name = 'Family'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your fondest family memory?', (SELECT id from quiz_categories where name = 'Family'), 'text', NULL, NULL, NULL, NULL, NOW()),

-- Future
('Where do you see yourself living in 10 years?', (SELECT id from quiz_categories where name = 'Future'), 'multiple_choice', '["In the same city", "In another city", "In the countryside", "Abroad"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how aligned are our career goals?', (SELECT id from quiz_categories where name = 'Future'), 'scale', NULL, 0, 10, '{"min": "Not at all aligned", "max": "Perfectly aligned"}', NOW()),
('What is the biggest dream you would like us to achieve together?', (SELECT id from quiz_categories where name = 'Future'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is marriage an important step for you in a relationship?', (SELECT id from quiz_categories where name = 'Future'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you imagine our retirement?', (SELECT id from quiz_categories where name = 'Future'), 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how willing are you to make sacrifices for my future goals?', (SELECT id from quiz_categories where name = 'Future'), 'scale', NULL, 0, 10, '{"min": "Not at all willing", "max": "Completely willing"}', NOW()),
('What is the biggest challenge you think we will face in the future?', (SELECT id from quiz_categories where name = 'Future'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is owning our own home a priority for you?', (SELECT id from quiz_categories where name = 'Future'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What impact would you like us to have on the world?', (SELECT id from quiz_categories where name = 'Future'), 'text', NULL, NULL, NULL, NULL, NOW()),
('If we won the lottery, what would be the first thing we would do?', (SELECT id from quiz_categories where name = 'Future'), 'multiple_choice', '["Buy a house", "Travel the world", "Invest", "Help our loved ones", "Quit our jobs"]', NULL, NULL, NULL, NOW()),

-- Activities
('What type of vacation do you prefer?', (SELECT id from quiz_categories where name = 'Activities'), 'multiple_choice', '["Beach and relaxation", "Adventure and exploration", "Cultural and historical", "Road trip"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy trying new restaurants?', (SELECT id from quiz_categories where name = 'Activities'), 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "I love it"}', NOW()),
('What would be your ideal weeknight?', (SELECT id from quiz_categories where name = 'Activities'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer to spend time just the two of us or with friends on the weekend?', (SELECT id from quiz_categories where name = 'Activities'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What activity have you never done and would like to do with me?', (SELECT id from quiz_categories where name = 'Activities'), 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy lively parties?', (SELECT id from quiz_categories where name = 'Activities'), 'scale', NULL, 0, 10, '{"min": "I prefer to stay home", "max": "I love to go out"}', NOW()),
('What is the best concert or show you have ever seen?', (SELECT id from quiz_categories where name = 'Activities'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you enjoy cooking together?', (SELECT id from quiz_categories where name = 'Activities'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your favorite season for outdoor activities?', (SELECT id from quiz_categories where name = 'Activities'), 'multiple_choice', '["Spring", "Summer", "Fall", "Winter"]', NULL, NULL, NULL, NOW()),
('If we had to choose one activity to do every Sunday, what would it be?', (SELECT id from quiz_categories where name = 'Activities'), 'text', NULL, NULL, NULL, NULL, NOW()),

-- Physical
('On a scale of 0-10, how important is physical attraction in a relationship for you?', (SELECT id from quiz_categories where name = 'Physical'), 'scale', NULL, 0, 10, '{"min": "Not very important", "max": "Very important"}', NOW()),
('What is your favorite physical compliment to receive?', (SELECT id from quiz_categories where name = 'Physical'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Is there a physical activity (sport, dance, etc.) you would like to do together?', (SELECT id from quiz_categories where name = 'Physical'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you feel about public displays of affection?', (SELECT id from quiz_categories where name = 'Physical'), 'multiple_choice', '["I love them", "I''m okay with them", "They make me uncomfortable", "It depends on the context"]', NULL, NULL, NULL, NOW()),
('What is your favorite physical feature of mine?', (SELECT id from quiz_categories where name = 'Physical'), 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how satisfied are you with your own physical appearance?', (SELECT id from quiz_categories where name = 'Physical'), 'scale', NULL, 0, 10, '{"min": "Not at all satisfied", "max": "Very satisfied"}', NOW()),
('Is your partner''s dress sense important to you?', (SELECT id from quiz_categories where name = 'Physical'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What type of non-sexual physical contact do you appreciate the most?', (SELECT id from quiz_categories where name = 'Physical'), 'multiple_choice', '["Hugs", "Holding hands", "Massages", "Stroking hair"]', NULL, NULL, NULL, NOW()),
('Is there anything I can do to make you feel more attractive?', (SELECT id from quiz_categories where name = 'Physical'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think physical chemistry is something that is built or is it instantaneous?', (SELECT id from quiz_categories where name = 'Physical'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),

-- Dates
('What is your ideal date type?', (SELECT id from quiz_categories where name = 'Dates'), 'multiple_choice', '["Romantic dinner", "Cultural outing (museum, theater)", "Outdoor activity", "Simple night at home"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important are surprises to you on a date?', (SELECT id from quiz_categories where name = 'Dates'), 'scale', NULL, 0, 10, '{"min": "I don''t like surprises", "max": "I love surprises"}', NOW()),
('Who do you think should plan the dates?', (SELECT id from quiz_categories where name = 'Dates'), 'multiple_choice', '["The one who invites", "We plan together", "Take turns", "It doesn''t matter"]', NULL, NULL, NULL, NOW()),
('Do you enjoy group dates with other couples?', (SELECT id from quiz_categories where name = 'Dates'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your best date memory with me?', (SELECT id from quiz_categories where name = 'Dates'), 'text', NULL, NULL, NULL, NULL, NOW()),
('How often would you like us to have a "real" date (just the two of us, no distractions)?', (SELECT id from quiz_categories where name = 'Dates'), 'multiple_choice', '["Once a week", "Every two weeks", "Once a month", "When the opportunity arises"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is it to dress up for a date?', (SELECT id from quiz_categories where name = 'Dates'), 'scale', NULL, 0, 10, '{"min": "Not at all important", "max": "Very important"}', NOW()),
('What is the biggest date faux pas?', (SELECT id from quiz_categories where name = 'Dates'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer trying a new place or going back to a place we both love?', (SELECT id from quiz_categories where name = 'Dates'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your dream date that you''ve never had?', (SELECT id from quiz_categories where name = 'Dates'), 'text', NULL, NULL, NULL, NULL, NOW()),

-- Personality
('Do you consider yourself more of an introvert or an extrovert?', (SELECT id from quiz_categories where name = 'Personality'), 'multiple_choice', '["Introvert", "Extrovert", "Ambivert"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how spontaneous are you?', (SELECT id from quiz_categories where name = 'Personality'), 'scale', NULL, 0, 10, '{"min": "Not at all spontaneous", "max": "Very spontaneous"}', NOW()),
('What is the greatest quality you admire in me?', (SELECT id from quiz_categories where name = 'Personality'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Are you more of an optimist, a pessimist, or a realist?', (SELECT id from quiz_categories where name = 'Personality'), 'multiple_choice', '["Optimist", "Pessimist", "Realist"]', NULL, NULL, NULL, NOW()),
('How do you handle stress?', (SELECT id from quiz_categories where name = 'Personality'), 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how neat and organized are you?', (SELECT id from quiz_categories where name = 'Personality'), 'scale', NULL, 0, 10, '{"min": "Very messy", "max": "Very organized"}', NOW()),
('What personality trait do you have the hardest time dealing with in others?', (SELECT id from quiz_categories where name = 'Personality'), 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you need a lot of alone time to recharge?', (SELECT id from quiz_categories where name = 'Personality'), 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your biggest fear?', (SELECT id from quiz_categories where name = 'Personality'), 'text', NULL, NULL, NULL, NULL, NOW()),
('If you could change one thing about your personality, what would it be?', (SELECT id from quiz_categories where name = 'Personality'), 'text', NULL, NULL, NULL, NULL, NOW());


--
-- ROW LEVEL SECURITY
--

-- Enable RLS for all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Policies for `quiz_categories`
DROP POLICY IF EXISTS "Allow public read access to quiz categories" ON public.quiz_categories;
CREATE POLICY "Allow public read access to quiz categories"
  ON public.quiz_categories FOR SELECT
  USING (true);

-- Policies for `questions`
DROP POLICY IF EXISTS "Allow public read access to questions" ON public.questions;
CREATE POLICY "Allow public read access to questions"
  ON public.questions FOR SELECT
  USING (true);

-- Policies for `profiles`
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.profiles;

CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow individual user to read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow individual user to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for `couples`
DROP POLICY IF EXISTS "Allow user to see couples they are part of" ON public.couples;
DROP POLICY IF EXISTS "Allow user to create a couple" ON public.couples;
DROP POLICY IF EXISTS "Allow user to update a couple they are part of" ON public.couples;
DROP POLICY IF EXISTS "Allow members to update their own couple record" ON public.couples;
DROP POLICY IF EXISTS "Allow user to join a couple using a linking code" ON public.couples;

CREATE POLICY "Allow user to see couples they are part of"
  ON public.couples FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- This policy is for direct INSERTs, which is what the RPC function will do.
CREATE POLICY "Allow user to create a couple"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

-- This policy allows members of a couple to update it.
-- The link_partner RPC runs as SECURITY DEFINER, so it bypasses this, but it's good practice to have it.
CREATE POLICY "Allow members to update their own couple record"
  ON public.couples FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies for `user_answers`
DROP POLICY IF EXISTS "Allow user to see their own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Allow user to insert their own answers" ON public.user_answers;

CREATE POLICY "Allow user to see their own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow user to insert their own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);