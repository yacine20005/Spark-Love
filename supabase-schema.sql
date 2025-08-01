-- Drop existing tables and types to allow for a clean re-run
DROP TABLE IF EXISTS "quiz_progress" CASCADE;
DROP TABLE IF EXISTS "quiz_sessions" CASCADE;
DROP TABLE IF EXISTS "couple_profiles" CASCADE;
DROP TABLE IF EXISTS "user_answers" CASCADE;
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

-- Questions table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers table
CREATE TABLE user_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL, -- Store as text, can be number or string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Couple profiles table
CREATE TABLE couple_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner1_id UUID NOT NULL,
  partner2_id UUID NOT NULL,
  partner1_name TEXT NOT NULL,
  partner2_name TEXT NOT NULL,
  relationship_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner1_id, partner2_id)
);

-- Quiz sessions table
CREATE TABLE quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  category quiz_category NOT NULL,
  questions JSONB NOT NULL, -- Array of question IDs
  partner1_answers JSONB DEFAULT '[]', -- Array of answer objects
  partner2_answers JSONB DEFAULT '[]', -- Array of answer objects
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Quiz progress table
CREATE TABLE quiz_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  category quiz_category NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  last_quiz_date TIMESTAMP WITH TIME ZONE,
  compatibility_score INTEGER, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_id, category)
);

-- Create indexes for better performance
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_release_date ON questions(release_date);
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_quiz_progress_couple_category ON quiz_progress(couple_id, category);

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

CREATE TRIGGER update_couple_profiles_updated_at BEFORE UPDATE ON couple_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_progress_updated_at BEFORE UPDATE ON quiz_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample questions for development
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
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - you'll need to customize based on your auth setup)
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "User answers are viewable by owner" ON user_answers FOR SELECT USING (true);
CREATE POLICY "User answers are insertable by owner" ON user_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "User answers are updatable by owner" ON user_answers FOR UPDATE USING (true);
CREATE POLICY "Couple profiles are viewable by members" ON couple_profiles FOR SELECT USING (true);
CREATE POLICY "Couple profiles are insertable by members" ON couple_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Quiz sessions are viewable by couple" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Quiz sessions are insertable by couple" ON quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Quiz progress is viewable by couple" ON quiz_progress FOR SELECT USING (true);
CREATE POLICY "Quiz progress is insertable by couple" ON quiz_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Quiz progress is updatable by couple" ON quiz_progress FOR UPDATE USING (true); 