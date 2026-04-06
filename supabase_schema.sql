-- ============================================================
-- StudyBuddy — Supabase Schema  (SINGLE SOURCE OF TRUTH)
-- Run in Supabase → SQL Editor to create / refresh the schema.
-- Safe to re-run — all statements use IF NOT EXISTS / OR REPLACE.
--
-- For a completely clean slate first run:
--   DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- ============================================================

-- 0. UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid         TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE,
  username             TEXT UNIQUE,
  full_name            TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  location             TEXT,
  college              TEXT,
  github               TEXT,
  linkedin             TEXT,
  role                 TEXT CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  is_support           BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,   -- true after wizard is dismissed
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);

-- ============================================================
-- 2. NOTES SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS notebooks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL REFERENCES profiles(firebase_uid),
  title      TEXT NOT NULL,
  color      TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  tags       TEXT[] DEFAULT '{}',              -- user-defined labels
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notes_content (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id    UUID NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
  content    TEXT,                             -- stored as HTML string from TipTap
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note page shares (viewer / editor permissions)
CREATE TABLE IF NOT EXISTS page_shares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES profiles(firebase_uid),
  access_type TEXT CHECK (access_type IN ('viewer', 'editor')) DEFAULT 'viewer',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_page_shares_page_id ON page_shares(page_id);
CREATE INDEX IF NOT EXISTS idx_page_shares_user_id ON page_shares(user_id);

-- ============================================================
-- 3. COMMUNITIES & MESSAGING
-- ============================================================
CREATE TABLE IF NOT EXISTS communities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  created_by  TEXT NOT NULL REFERENCES profiles(firebase_uid),
  type        TEXT CHECK (type IN ('public', 'private', 'broadcast')) DEFAULT 'public',
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) FROM 1 FOR 8),
  is_official BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS community_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES profiles(firebase_uid),
  role         TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id      ON community_members(user_id);

CREATE TABLE IF NOT EXISTS community_join_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES profiles(firebase_uid),
  status       TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_jr_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_jr_user_id      ON community_join_requests(user_id);

CREATE TABLE IF NOT EXISTS community_invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id    UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  invited_user_id TEXT REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  email           TEXT,
  invited_by      TEXT NOT NULL REFERENCES profiles(firebase_uid),
  status          TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, invited_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_invites_user_id      ON community_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_community_id ON community_invites(community_id);

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL REFERENCES profiles(firebase_uid),
  message_text TEXT NOT NULL,
  type         TEXT CHECK (type IN ('text', 'note', 'file')) DEFAULT 'text',
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id, created_at);

-- ============================================================
-- 4. DIRECT MESSAGING
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id   TEXT NOT NULL REFERENCES profiles(firebase_uid),
  user2_id   TEXT NOT NULL REFERENCES profiles(firebase_uid),
  status     TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

CREATE TABLE IF NOT EXISTS direct_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES profiles(firebase_uid),
  message_text    TEXT NOT NULL,
  type            TEXT CHECK (type IN ('text', 'note', 'file')) DEFAULT 'text',
  metadata        JSONB DEFAULT '{}'::jsonb,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id, created_at);

-- ============================================================
-- 5. AI TUTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL REFERENCES profiles(firebase_uid),
  title      TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL,   -- 'user' | 'ai'
  message         TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL REFERENCES profiles(firebase_uid),
  type       TEXT CHECK (type IN ('dm', 'group', 'alert', 'success', 'info')) DEFAULT 'info',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  sender_id  TEXT REFERENCES profiles(firebase_uid),
  is_read    BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);

-- ============================================================
-- 7. TESTS & ASSESSMENTS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS tests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id          TEXT NOT NULL REFERENCES profiles(firebase_uid),
  title               TEXT NOT NULL,
  description         TEXT,
  subject             TEXT,
  topic               TEXT,
  duration            INTEGER NOT NULL,          -- minutes
  total_marks         INTEGER NOT NULL DEFAULT 0,
  negative_marks      FLOAT DEFAULT 0,
  randomize_questions BOOLEAN DEFAULT FALSE,
  start_time          TIMESTAMP WITH TIME ZONE,
  end_time            TIMESTAMP WITH TIME ZONE,
  -- 'public'  → visible to all students
  -- 'private' → accessible only via test_code
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  status     TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  -- Unique 6-char uppercase alphanumeric join code (shown ONLY to the teacher)
  test_code  TEXT UNIQUE DEFAULT upper(substring(md5(random()::text) FROM 1 FOR 6)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id ON tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_code  ON tests(test_code);
CREATE INDEX IF NOT EXISTS idx_tests_topic      ON tests(topic);
CREATE INDEX IF NOT EXISTS idx_tests_status     ON tests(status);

-- Test distributions (link tests to communities)
CREATE TABLE IF NOT EXISTS test_distributions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, community_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id       UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (
    question_type IN ('mcq', 'multi_select', 'true_false', 'short_answer', 'long_answer')
  ) DEFAULT 'mcq',
  options        JSONB,   -- [{id, text}, ...]  — null for open-ended
  correct_answer JSONB,   -- string for mcq/true_false/short_answer; string[] for multi_select
  marks          INTEGER NOT NULL DEFAULT 1,
  order_index    INTEGER NOT NULL DEFAULT 0,
  explanation    TEXT,    -- shown to student after submission
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);

-- Test attempts — one row per student per attempt
CREATE TABLE IF NOT EXISTS test_attempts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id    UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES profiles(firebase_uid),

  -- Scoring
  score      FLOAT,
  is_graded  BOOLEAN DEFAULT FALSE,

  -- Lifecycle
  status       TEXT CHECK (status IN ('in_progress', 'submitted')) DEFAULT 'in_progress',
  started_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,

  -- Session persistence (every 30 s the client saves state here)
  time_remaining INTEGER,
  last_heartbeat TIMESTAMP WITH TIME ZONE,

  -- Security monitoring
  tab_violations INTEGER DEFAULT 0    -- 3 violations → auto-submit
);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id    ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_id ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status     ON test_attempts(status);

-- Individual answers saved per question
CREATE TABLE IF NOT EXISTS answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id    UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES questions(id)     ON DELETE CASCADE,
  answer        JSONB,
  is_correct    BOOLEAN,
  marks_awarded FLOAT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- (Enabled but effectively open for MVP — Firebase Auth + anon key)
-- Remove DISABLE statements below when migrating to Supabase Auth.
-- ============================================================
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_content           ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_shares             ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_distributions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. RLS POLICIES
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "Profiles: select all" ON profiles;
CREATE POLICY "Profiles: select all" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles: insert own" ON profiles;
CREATE POLICY "Profiles: insert own" ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (true);

-- Notes
DROP POLICY IF EXISTS "Notebooks: manage own" ON notebooks;
CREATE POLICY "Notebooks: manage own" ON notebooks FOR ALL USING (true);
DROP POLICY IF EXISTS "Sections: manage own"  ON sections;
CREATE POLICY "Sections: manage own"  ON sections  FOR ALL USING (true);
DROP POLICY IF EXISTS "Pages: manage own"     ON pages;
CREATE POLICY "Pages: manage own"     ON pages     FOR ALL USING (true);
DROP POLICY IF EXISTS "Notes content: manage" ON notes_content;
CREATE POLICY "Notes content: manage" ON notes_content FOR ALL USING (true);
DROP POLICY IF EXISTS "Page shares: manage"   ON page_shares;
CREATE POLICY "Page shares: manage"   ON page_shares   FOR ALL USING (true);

-- Communities
DROP POLICY IF EXISTS "Communities: view public" ON communities;
CREATE POLICY "Communities: view public" ON communities FOR SELECT USING (type = 'public');
DROP POLICY IF EXISTS "Communities: view all"    ON communities;
CREATE POLICY "Communities: view all"    ON communities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Communities: manage all"  ON communities;
CREATE POLICY "Communities: manage all"  ON communities FOR ALL USING (true);
DROP POLICY IF EXISTS "Communities: create"      ON communities;
CREATE POLICY "Communities: create"      ON communities FOR INSERT WITH CHECK (true);

-- Community members
DROP POLICY IF EXISTS "Members: view"   ON community_members;
CREATE POLICY "Members: view"   ON community_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members: join"   ON community_members;
CREATE POLICY "Members: join"   ON community_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Members: update" ON community_members;
CREATE POLICY "Members: update" ON community_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Members: delete" ON community_members;
CREATE POLICY "Members: delete" ON community_members FOR DELETE USING (true);

-- Community join requests
DROP POLICY IF EXISTS "JoinRequests: view"   ON community_join_requests;
CREATE POLICY "JoinRequests: view"   ON community_join_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "JoinRequests: create" ON community_join_requests;
CREATE POLICY "JoinRequests: create" ON community_join_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "JoinRequests: update" ON community_join_requests;
CREATE POLICY "JoinRequests: update" ON community_join_requests FOR UPDATE USING (true);
DROP POLICY IF EXISTS "JoinRequests: delete" ON community_join_requests;
CREATE POLICY "JoinRequests: delete" ON community_join_requests FOR DELETE USING (true);

-- Community invites
DROP POLICY IF EXISTS "Invites: view"   ON community_invites;
CREATE POLICY "Invites: view"   ON community_invites FOR SELECT USING (true);
DROP POLICY IF EXISTS "Invites: create" ON community_invites;
CREATE POLICY "Invites: create" ON community_invites FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Invites: update" ON community_invites;
CREATE POLICY "Invites: update" ON community_invites FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Invites: delete" ON community_invites;
CREATE POLICY "Invites: delete" ON community_invites FOR DELETE USING (true);

-- Messages (community)
DROP POLICY IF EXISTS "Messages: members view" ON messages;
CREATE POLICY "Messages: members view" ON messages FOR SELECT USING (
  community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()::text)
);
DROP POLICY IF EXISTS "Messages: members send" ON messages;
CREATE POLICY "Messages: members send" ON messages FOR INSERT WITH CHECK (
  community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()::text)
);

-- Direct messages
DROP POLICY IF EXISTS "DM: view own" ON conversations;
CREATE POLICY "DM: view own" ON conversations FOR SELECT USING (
  user1_id = auth.uid()::text OR user2_id = auth.uid()::text
);
DROP POLICY IF EXISTS "DM messages: view" ON direct_messages;
CREATE POLICY "DM messages: view" ON direct_messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user1_id = auth.uid()::text OR user2_id = auth.uid()::text
  )
);
DROP POLICY IF EXISTS "DM messages: send" ON direct_messages;
CREATE POLICY "DM messages: send" ON direct_messages FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user1_id = auth.uid()::text OR user2_id = auth.uid()::text
  )
);

-- AI
DROP POLICY IF EXISTS "AI convos: manage own" ON ai_conversations;
CREATE POLICY "AI convos: manage own" ON ai_conversations FOR ALL USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "AI messages: manage own" ON ai_messages;
CREATE POLICY "AI messages: manage own" ON ai_messages FOR ALL USING (
  conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid()::text)
);

-- Tests
DROP POLICY IF EXISTS "Tests: teacher manage" ON tests;
CREATE POLICY "Tests: teacher manage" ON tests FOR ALL USING (teacher_id = auth.uid()::text);
DROP POLICY IF EXISTS "Tests: student view published" ON tests;
CREATE POLICY "Tests: student view published" ON tests FOR SELECT USING (status = 'published');

-- Questions
DROP POLICY IF EXISTS "Questions: teacher manage" ON questions;
CREATE POLICY "Questions: teacher manage" ON questions FOR ALL USING (
  test_id IN (SELECT id FROM tests WHERE teacher_id = auth.uid()::text)
);
DROP POLICY IF EXISTS "Questions: student view" ON questions;
CREATE POLICY "Questions: student view" ON questions FOR SELECT USING (
  test_id IN (SELECT id FROM tests WHERE status = 'published')
);

-- Attempts
DROP POLICY IF EXISTS "Attempts: student manage own" ON test_attempts;
CREATE POLICY "Attempts: student manage own" ON test_attempts FOR ALL USING (student_id = auth.uid()::text);
DROP POLICY IF EXISTS "Attempts: teacher view" ON test_attempts;
CREATE POLICY "Attempts: teacher view" ON test_attempts FOR SELECT USING (
  test_id IN (SELECT id FROM tests WHERE teacher_id = auth.uid()::text)
);

-- Answers
DROP POLICY IF EXISTS "Answers: student manage own" ON answers;
CREATE POLICY "Answers: student manage own" ON answers FOR ALL USING (
  attempt_id IN (SELECT id FROM test_attempts WHERE student_id = auth.uid()::text)
);
DROP POLICY IF EXISTS "Answers: teacher view" ON answers;
CREATE POLICY "Answers: teacher view" ON answers FOR SELECT USING (
  attempt_id IN (
    SELECT ta.id FROM test_attempts ta
    JOIN tests t ON t.id = ta.test_id
    WHERE t.teacher_id = auth.uid()::text
  )
);

-- Notifications
DROP POLICY IF EXISTS "Notifications: own" ON notifications;
CREATE POLICY "Notifications: own" ON notifications FOR ALL USING (true);

-- ============================================================
-- 10. DISABLE RLS (MVP — Firebase Auth + Supabase anon key)
--     Remove these when switching to Supabase Auth
-- ============================================================
ALTER TABLE profiles                DISABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks               DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections                DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes_content           DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_shares             DISABLE ROW LEVEL SECURITY;
ALTER TABLE communities             DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members       DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites       DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages                DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations           DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations        DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE tests                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_distributions      DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions               DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE answers                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. REALTIME (idempotent — safe to re-run)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages', 'direct_messages', 'conversations', 'community_invites', 'notifications']
  LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Publication may already include ALL TABLES; ignore
    END;
  END LOOP;
END $$;

-- ============================================================
-- 12. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Storage: chat files read"   ON storage.objects;
CREATE POLICY "Storage: chat files read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('chat-files', 'avatars'));

DROP POLICY IF EXISTS "Storage: chat files upload" ON storage.objects;
CREATE POLICY "Storage: chat files upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('chat-files', 'avatars'));

DROP POLICY IF EXISTS "Storage: chat files delete" ON storage.objects;
CREATE POLICY "Storage: chat files delete" ON storage.objects
  FOR DELETE USING (bucket_id IN ('chat-files', 'avatars'));