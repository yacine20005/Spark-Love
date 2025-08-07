-- Drop existing tables and types to allow for a clean re-run
DROP TABLE IF EXISTS "user_answers" CASCADE;
DROP TABLE IF EXISTS "couples" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TYPE IF EXISTS "quiz_category" CASCADE;
DROP TYPE IF EXISTS "question_type" CASCADE;

-- Supabase Schema for Spark Love Quiz App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE quiz_category AS ENUM (
  'communication',
  'values',
  'hobbies',
  'intimacy',
  'family',
  'future',
  'activities',
  'physical',
  'dates',
  'personality'
);

CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'scale',
  'text',
  'yes_no'
);

-- Questions table (no changes here)
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  category quiz_category NOT NULL,
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
CREATE INDEX idx_questions_category ON questions(category);
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

-- Insert sample questions (keeping the existing ones)
INSERT INTO questions (text, category, type, options, min_scale, max_scale, scale_labels, release_date) VALUES
-- Communication
('How do you prefer to communicate when we''re not together?', 'communication', 'multiple_choice', '["Calls", "Texts", "Video Calls", "Voice Messages"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how listened to do you feel in our relationship?', 'communication', 'scale', NULL, 0, 10, '{"min": "Not heard at all", "max": "Perfectly heard"}', NOW()),
('What''s the most important thing I can do to be a better communicator with you?', 'communication', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer to address issues as soon as they arise or wait a bit?', 'communication', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you typically react to constructive criticism from me?', 'communication', 'multiple_choice', '["I appreciate it", "I get defensive", "I need time to think about it", "It depends on how it''s said"]', NULL, NULL, NULL, NOW()),
('How often would you like us to have "deep talks" about our relationship?', 'communication', 'multiple_choice', '["Daily", "Weekly", "Monthly", "Only when necessary"]', NULL, NULL, NULL, NOW()),
('What topic is the hardest for you to bring up with me?', 'communication', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think we are on the same page regarding non-verbal communication?', 'communication', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is laughter in our communication?', 'communication', 'scale', NULL, 0, 10, '{"min": "Not important", "max": "Essential"}', NOW()),
('Is there anything you wish we would stop doing when we argue?', 'communication', 'text', NULL, NULL, NULL, NULL, NOW()),

-- Values
('What is your opinion on the importance of religion or spirituality in life?', 'values', 'multiple_choice', '["Very important", "Somewhat important", "Not very important", "Not important at all"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is political and social engagement to you?', 'values', 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Extremely"}', NOW()),
('Is fidelity an absolute value for you, or can it be discussed?', 'values', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How much importance do you place on the financial independence of each partner?', 'values', 'multiple_choice', '["Essential", "Important but not mandatory", "Not very important", "Not important"]', NULL, NULL, NULL, NOW()),
('How would you define a "good life"?', 'values', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think it''s important to always tell the truth, even if it might hurt?', 'values', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is it for you that we share the same core values?', 'values', 'scale', NULL, 0, 10, '{"min": "Not so important", "max": "Absolutely crucial"}', NOW()),
('What is your stance on sharing household chores?', 'values', 'multiple_choice', '["Equal 50/50 split", "Based on availability", "Based on preference", "Traditional roles"]', NULL, NULL, NULL, NOW()),
('What is the most important value your parents passed on to you?', 'values', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is it more important for you to be happy or to be successful?', 'values', 'multiple_choice', '["Happy", "Successful", "The two are linked", "Neither"]', NULL, NULL, NULL, NOW()),

-- Hobbies
('What new hobby would you like to try with me?', 'hobbies', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer quiet activities at home or adventurous outings?', 'hobbies', 'multiple_choice', '["Quiet at home", "Adventurous outings", "A mix of both"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy sports activities?', 'hobbies', 'scale', NULL, 0, 10, '{"min": "I hate them", "max": "I love them"}', NOW()),
('Is there one of my hobbies that you would like to better understand or share?', 'hobbies', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What type of music do you enjoy listening to the most?', 'hobbies', 'multiple_choice', '["Pop/Rock", "Hip-Hop/R&B", "Classical/Jazz", "Electronic", "Other"]', NULL, NULL, NULL, NOW()),
('What is the last book or movie that really made an impression on you?', 'hobbies', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you enjoy board games or video games?', 'hobbies', 'multiple_choice', '["Board games", "Video games", "Both", "Neither"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how creative are you?', 'hobbies', 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Very creative"}', NOW()),
('What activity relaxes you the most?', 'hobbies', 'text', NULL, NULL, NULL, NULL, NOW()),
('If we had a completely free weekend, what would we do?', 'hobbies', 'multiple_choice', '["Travel", "Hike", "Binge-watch series", "See friends/family", "Do nothing special"]', NULL, NULL, NULL, NOW()),

-- Intimacy
('What is your primary love language?', 'intimacy', 'multiple_choice', '["Words of Affirmation", "Quality Time", "Receiving Gifts", "Acts of Service", "Physical Touch"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how satisfied are you with our intimate life?', 'intimacy', 'scale', NULL, 0, 10, '{"min": "Not at all satisfied", "max": "Very satisfied"}', NOW()),
('Is there anything new you would like to explore together intimately?', 'intimacy', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is spontaneity or planning more important to you when it comes to intimacy?', 'intimacy', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How can I make you feel more desired?', 'intimacy', 'text', NULL, NULL, NULL, NULL, NOW()),
('How often would you like to be intimate?', 'intimacy', 'multiple_choice', '["Several times a week", "Once a week", "A few times a month", "It depends on the moment"]', NULL, NULL, NULL, NOW()),
('Is emotional intimacy as important as physical intimacy for you?', 'intimacy', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how easy is it for you to talk about your desires and boundaries?', 'intimacy', 'scale', NULL, 0, 10, '{"min": "Very difficult", "max": "Very easy"}', NOW()),
('What is the most intimate non-sexual gesture for you?', 'intimacy', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think our level of intimacy has evolved positively over time?', 'intimacy', 'yes_no', NULL, NULL, NULL, NULL, NOW()),

-- Family
('How important is family in your life?', 'family', 'multiple_choice', '["It''s the most important thing", "Very important", "Fairly important", "Not very important"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how well do you get along with my family?', 'family', 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "Very well"}', NOW()),
('How many children would you ideally like to have?', 'family', 'multiple_choice', '["0", "1", "2", "3+", "I don''t know yet"]', NULL, NULL, NULL, NOW()),
('How do you envision our roles as parents?', 'family', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is it important for you that we spend holidays (Christmas, etc.) with our families?', 'family', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What family tradition from your childhood would you like to continue?', 'family', 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do your family''s opinions influence your major decisions?', 'family', 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "A great deal"}', NOW()),
('How would you describe your relationship with your parents?', 'family', 'multiple_choice', '["Very close", "Close", "Distant", "Complicated"]', NULL, NULL, NULL, NOW()),
('Do you think it''s important to live near family?', 'family', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your fondest family memory?', 'family', 'text', NULL, NULL, NULL, NULL, NOW()),

-- Future
('Where do you see yourself living in 10 years?', 'future', 'multiple_choice', '["In the same city", "In another city", "In the countryside", "Abroad"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how aligned are our career goals?', 'future', 'scale', NULL, 0, 10, '{"min": "Not at all aligned", "max": "Perfectly aligned"}', NOW()),
('What is the biggest dream you would like us to achieve together?', 'future', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is marriage an important step for you in a relationship?', 'future', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you imagine our retirement?', 'future', 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how willing are you to make sacrifices for my future goals?', 'future', 'scale', NULL, 0, 10, '{"min": "Not at all willing", "max": "Completely willing"}', NOW()),
('What is the biggest challenge you think we will face in the future?', 'future', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is owning our own home a priority for you?', 'future', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What impact would you like us to have on the world?', 'future', 'text', NULL, NULL, NULL, NULL, NOW()),
('If we won the lottery, what would be the first thing we would do?', 'future', 'multiple_choice', '["Buy a house", "Travel the world", "Invest", "Help our loved ones", "Quit our jobs"]', NULL, NULL, NULL, NOW()),

-- Activities
('What type of vacation do you prefer?', 'activities', 'multiple_choice', '["Beach and relaxation", "Adventure and exploration", "Cultural and historical", "Road trip"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy trying new restaurants?', 'activities', 'scale', NULL, 0, 10, '{"min": "Not at all", "max": "I love it"}', NOW()),
('What would be your ideal weeknight?', 'activities', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer to spend time just the two of us or with friends on the weekend?', 'activities', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What activity have you never done and would like to do with me?', 'activities', 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how much do you enjoy lively parties?', 'activities', 'scale', NULL, 0, 10, '{"min": "I prefer to stay home", "max": "I love to go out"}', NOW()),
('What is the best concert or show you have ever seen?', 'activities', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you enjoy cooking together?', 'activities', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your favorite season for outdoor activities?', 'activities', 'multiple_choice', '["Spring", "Summer", "Fall", "Winter"]', NULL, NULL, NULL, NOW()),
('If we had to choose one activity to do every Sunday, what would it be?', 'activities', 'text', NULL, NULL, NULL, NULL, NOW()),

-- Physical
('On a scale of 0-10, how important is physical attraction in a relationship for you?', 'physical', 'scale', NULL, 0, 10, '{"min": "Not very important", "max": "Very important"}', NOW()),
('What is your favorite physical compliment to receive?', 'physical', 'text', NULL, NULL, NULL, NULL, NOW()),
('Is there a physical activity (sport, dance, etc.) you would like to do together?', 'physical', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('How do you feel about public displays of affection?', 'physical', 'multiple_choice', '["I love them", "I''m okay with them", "They make me uncomfortable", "It depends on the context"]', NULL, NULL, NULL, NOW()),
('What is your favorite physical feature of mine?', 'physical', 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how satisfied are you with your own physical appearance?', 'physical', 'scale', NULL, 0, 10, '{"min": "Not at all satisfied", "max": "Very satisfied"}', NOW()),
('Is your partner''s dress sense important to you?', 'physical', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What type of non-sexual physical contact do you appreciate the most?', 'physical', 'multiple_choice', '["Hugs", "Holding hands", "Massages", "Stroking hair"]', NULL, NULL, NULL, NOW()),
('Is there anything I can do to make you feel more attractive?', 'physical', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you think physical chemistry is something that is built or is it instantaneous?', 'physical', 'yes_no', NULL, NULL, NULL, NULL, NOW()),

-- Dates
('What is your ideal date type?', 'dates', 'multiple_choice', '["Romantic dinner", "Cultural outing (museum, theater)", "Outdoor activity", "Simple night at home"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important are surprises to you on a date?', 'dates', 'scale', NULL, 0, 10, '{"min": "I don''t like surprises", "max": "I love surprises"}', NOW()),
('Who do you think should plan the dates?', 'dates', 'multiple_choice', '["The one who invites", "We plan together", "Take turns", "It doesn''t matter"]', NULL, NULL, NULL, NOW()),
('Do you enjoy group dates with other couples?', 'dates', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your best date memory with me?', 'dates', 'text', NULL, NULL, NULL, NULL, NOW()),
('How often would you like us to have a "real" date (just the two of us, no distractions)?', 'dates', 'multiple_choice', '["Once a week", "Every two weeks", "Once a month", "When the opportunity arises"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how important is it to dress up for a date?', 'dates', 'scale', NULL, 0, 10, '{"min": "Not at all important", "max": "Very important"}', NOW()),
('What is the biggest date faux pas?', 'dates', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you prefer trying a new place or going back to a place we both love?', 'dates', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your dream date that you''ve never had?', 'dates', 'text', NULL, NULL, NULL, NULL, NOW()),

-- Personality
('Do you consider yourself more of an introvert or an extrovert?', 'personality', 'multiple_choice', '["Introvert", "Extrovert", "Ambivert"]', NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how spontaneous are you?', 'personality', 'scale', NULL, 0, 10, '{"min": "Not at all spontaneous", "max": "Very spontaneous"}', NOW()),
('What is the greatest quality you admire in me?', 'personality', 'text', NULL, NULL, NULL, NULL, NOW()),
('Are you more of an optimist, a pessimist, or a realist?', 'personality', 'multiple_choice', '["Optimist", "Pessimist", "Realist"]', NULL, NULL, NULL, NOW()),
('How do you handle stress?', 'personality', 'text', NULL, NULL, NULL, NULL, NOW()),
('On a scale of 0-10, how neat and organized are you?', 'personality', 'scale', NULL, 0, 10, '{"min": "Very messy", "max": "Very organized"}', NOW()),
('What personality trait do you have the hardest time dealing with in others?', 'personality', 'text', NULL, NULL, NULL, NULL, NOW()),
('Do you need a lot of alone time to recharge?', 'personality', 'yes_no', NULL, NULL, NULL, NULL, NOW()),
('What is your biggest fear?', 'personality', 'text', NULL, NULL, NULL, NULL, NOW()),
('If you could change one thing about your personality, what would it be?', 'personality', 'text', NULL, NULL, NULL, NULL, NOW());

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);

-- Policies for user_answers
CREATE POLICY "Users can manage their own answers" ON user_answers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for couples
CREATE POLICY "Users can view couples they are part of" ON couples
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own couple entries" ON couples
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update own pending couple entry" ON couples
  FOR UPDATE
  USING (
    auth.uid() = user1_id AND user2_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user1_id AND user2_id IS NULL
  );

CREATE POLICY "Users can delete couples they are part of" ON couples
  FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);


-- Functions for linking logic
CREATE OR REPLACE FUNCTION generate_linking_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT[] := string_to_array('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', NULL);
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || chars[1 + floor(random() * array_length(chars, 1))];
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp, auth;

CREATE OR REPLACE FUNCTION create_couple_and_get_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  current_user_id UUID := auth.uid();
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_linking_code();
    SELECT EXISTS(SELECT 1 FROM couples WHERE linking_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO couples (user1_id, linking_code)
  VALUES (current_user_id, new_code);

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp, auth;

CREATE OR REPLACE FUNCTION link_partner(p_linking_code TEXT)
RETURNS UUID AS $$
DECLARE
  couple_record couples;
  current_user_id UUID := auth.uid();
BEGIN
  -- Find the couple with the linking code, ignoring case
  SELECT * INTO couple_record FROM couples WHERE UPPER(linking_code) = UPPER(p_linking_code);

  -- Check if code is valid and not already used
  IF couple_record IS NULL THEN
    RAISE EXCEPTION 'Invalid linking code.';
  END IF;

  IF couple_record.user2_id IS NOT NULL THEN
    RAISE EXCEPTION 'This invitation has already been used.';
  END IF;

  -- Check if user is trying to link with themselves
  IF couple_record.user1_id = current_user_id THEN
    RAISE EXCEPTION 'You cannot link with yourself.';
  END IF;

  IF couple_record.user1_id > current_user_id THEN
    -- First set user2_id, then user1_id to avoid CHECK constraint violation
    UPDATE couples
    SET user2_id = couple_record.user1_id
    WHERE id = couple_record.id;
    UPDATE couples
    SET user1_id = current_user_id, linking_code = NULL
    WHERE id = couple_record.id;
  ELSE
    UPDATE couples
    SET user2_id = current_user_id, linking_code = NULL
    WHERE id = couple_record.id;
  END IF;
    UPDATE couples
    SET user2_id = current_user_id, linking_code = NULL
    WHERE id = couple_record.id;
  END IF;

  RETURN couple_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp, auth;

-- Function to get all couples for the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_couples()
RETURNS TABLE(couple_id UUID, partner_id UUID, partner_email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as couple_id, 
    p.id as partner_id, 
    p.email::text as partner_email
  FROM 
    couples c
  JOIN auth.users p ON (CASE WHEN c.user1_id = auth.uid() THEN c.user2_id ELSE c.user1_id END) = p.id
  WHERE 
    (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    AND c.user2_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp, auth;