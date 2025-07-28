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
-- Communication questions
('How do you prefer to resolve conflicts in our relationship?', 'communication', 'multiple_choice', 
 '["Talk it out immediately", "Take time to think first", "Write it down", "Seek outside help"]', NULL, NULL, NULL, NOW()),

('On a scale of 1-10, how comfortable are you sharing your deepest thoughts with me?', 'communication', 'scale', 
 NULL, 1, 10, '{"min": "Very uncomfortable", "max": "Very comfortable"}', NOW()),

('What is the most important quality you look for in a partner?', 'communication', 'text', 
 NULL, NULL, NULL, NULL, NOW()),

-- Values questions
('Do you believe in traditional gender roles in a relationship?', 'values', 'yes_no', 
 NULL, NULL, NULL, NULL, NOW()),

('How important is financial stability in our relationship?', 'values', 'scale', 
 NULL, 1, 10, '{"min": "Not important", "max": "Very important"}', NOW()),

-- Hobbies questions
('What type of activities do you enjoy most?', 'hobbies', 'multiple_choice', 
 '["Outdoor adventures", "Creative arts", "Sports and fitness", "Reading and learning", "Social activities"]', NULL, NULL, NULL, NOW()),

-- Intimacy questions
('How do you prefer to show affection?', 'intimacy', 'multiple_choice', 
 '["Physical touch", "Words of affirmation", "Quality time", "Acts of service", "Gifts"]', NULL, NULL, NULL, NOW()),

-- Family questions
('How many children would you like to have?', 'family', 'multiple_choice', 
 '["0", "1", "2", "3", "4 or more"]', NULL, NULL, NULL, NOW()),

-- Future questions
('Where do you see us living in 5 years?', 'future', 'text', 
 NULL, NULL, NULL, NULL, NOW()),

-- Activities questions
('What is your ideal weekend activity together?', 'activities', 'multiple_choice', 
 '["Staying home and relaxing", "Going out to restaurants", "Outdoor adventures", "Cultural activities", "Shopping"]', NULL, NULL, NULL, NOW());

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