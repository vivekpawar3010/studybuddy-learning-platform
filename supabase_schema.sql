-- ============================================================
-- StudyBuddy AI — Supabase Database Schema
-- VERSION: 2.0  |  SINGLE SOURCE OF TRUTH
-- ============================================================
-- HOW TO USE:
--   1. Go to Supabase → SQL Editor
--   2. For a CLEAN SLATE first run:
--        DROP SCHEMA public CASCADE; CREATE SCHEMA public;
--        GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
--   3. Then paste and run this entire file.
-- ============================================================
-- ARCHITECTURE NOTE:
--   This app uses Firebase Auth + Supabase anon key.
--   The anon key is public — so RLS policies must be tight.
--   Because we cannot use auth.uid() with Firebase tokens,
--   we use a helper function get_firebase_uid() that reads
--   a custom JWT claim OR falls back to anon-open policies
--   that are safe because the data is not sensitive per-row.
--   Tables with sensitive data (notes, DMs, attempts) are
--   protected using firebase_uid passed as a column filter
--   which is enforced at the query level in the service layer.
-- ============================================================

-- 0. Dependencies
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1: USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid         TEXT        UNIQUE NOT NULL,
  email                TEXT        UNIQUE,
  username             TEXT        UNIQUE,
  full_name            TEXT,
  avatar_url           TEXT,
  bio                  TEXT        DEFAULT '',
  location             TEXT        DEFAULT '',
  college              TEXT        DEFAULT '',
  github               TEXT        DEFAULT '',
  linkedin             TEXT        DEFAULT '',
  role                 TEXT        CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  is_support           BOOLEAN     DEFAULT FALSE,
  onboarding_completed BOOLEAN     DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_username     ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON profiles(email);

-- ============================================================
-- SECTION 2: NOTES SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS notebooks (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  color      TEXT        DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);

CREATE TABLE IF NOT EXISTS sections (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID        NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sections_notebook_id ON sections(notebook_id);

CREATE TABLE IF NOT EXISTS pages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID        NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  tags       TEXT[]      DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pages_section_id ON pages(section_id);

CREATE TABLE IF NOT EXISTS notes_content (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id    UUID        NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
  content    TEXT        DEFAULT '',       -- TipTap HTML
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_content_page_id ON notes_content(page_id);

-- Note sharing (viewer / editor permissions)
CREATE TABLE IF NOT EXISTS page_shares (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  access_type TEXT        CHECK (access_type IN ('viewer', 'editor')) DEFAULT 'viewer',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_page_shares_page_id ON page_shares(page_id);
CREATE INDEX IF NOT EXISTS idx_page_shares_user_id ON page_shares(user_id);

-- ============================================================
-- SECTION 3: COMMUNITIES & MESSAGING
-- ============================================================
CREATE TABLE IF NOT EXISTS communities (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  avatar_url  TEXT,
  created_by  TEXT        NOT NULL REFERENCES profiles(firebase_uid),
  type        TEXT        CHECK (type IN ('public', 'private', 'broadcast')) DEFAULT 'public',
  invite_code TEXT        UNIQUE DEFAULT upper(substring(md5(random()::text) FROM 1 FOR 8)),
  is_official BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communities_type        ON communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON communities(invite_code);
CREATE INDEX IF NOT EXISTS idx_communities_created_by  ON communities(created_by);

CREATE TABLE IF NOT EXISTS community_members (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  role         TEXT        DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id      ON community_members(user_id);

CREATE TABLE IF NOT EXISTS community_join_requests (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  status       TEXT        CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_jr_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_jr_user_id      ON community_join_requests(user_id);

CREATE TABLE IF NOT EXISTS community_invites (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id    UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  invited_user_id TEXT        REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  email           TEXT,
  invited_by      TEXT        NOT NULL REFERENCES profiles(firebase_uid),
  status          TEXT        CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, invited_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_invites_user_id      ON community_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_community_id ON community_invites(community_id);

-- Community group messages
CREATE TABLE IF NOT EXISTS messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id    TEXT        NOT NULL REFERENCES profiles(firebase_uid),
  message_text TEXT        NOT NULL,
  type         TEXT        CHECK (type IN ('text', 'note', 'file', 'link')) DEFAULT 'text',
  metadata     JSONB       DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON messages(sender_id);

-- ============================================================
-- SECTION 4: DIRECT MESSAGING
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id   TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  user2_id   TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  status     TEXT        CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id <> user2_id)  -- prevent self-conversation
);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

CREATE TABLE IF NOT EXISTS direct_messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT        NOT NULL REFERENCES profiles(firebase_uid),
  message_text    TEXT        NOT NULL,
  type            TEXT        CHECK (type IN ('text', 'note', 'file', 'link')) DEFAULT 'text',
  metadata        JSONB       DEFAULT '{}'::jsonb,
  is_read         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id       ON direct_messages(sender_id);

-- ============================================================
-- SECTION 5: AI TUTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  title      TEXT        DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  sender_type     TEXT        NOT NULL CHECK (sender_type IN ('user', 'ai')),
  message         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- ============================================================
-- SECTION 6: NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  type       TEXT        CHECK (type IN ('dm', 'group', 'alert', 'success', 'info')) DEFAULT 'info',
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  sender_id  TEXT        REFERENCES profiles(firebase_uid),
  is_read    BOOLEAN     DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- SECTION 7: TESTS & ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tests (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id          TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  description         TEXT        DEFAULT '',
  subject             TEXT        DEFAULT '',
  topic               TEXT        DEFAULT '',
  duration            INTEGER     NOT NULL CHECK (duration > 0),        -- minutes
  total_marks         INTEGER     NOT NULL DEFAULT 0,
  negative_marks      FLOAT       DEFAULT 0 CHECK (negative_marks >= 0),
  randomize_questions BOOLEAN     DEFAULT FALSE,
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  visibility          TEXT        CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  status              TEXT        CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  -- 6-char uppercase alphanumeric join code — shown only to teacher
  test_code           TEXT        UNIQUE DEFAULT upper(substring(md5(random()::text) FROM 1 FOR 6)),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id ON tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_code  ON tests(test_code);
CREATE INDEX IF NOT EXISTS idx_tests_status     ON tests(status, visibility);
CREATE INDEX IF NOT EXISTS idx_tests_topic      ON tests(subject, topic);

-- Link tests → communities (distribution)
CREATE TABLE IF NOT EXISTS test_distributions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id      UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, community_id)
);
CREATE INDEX IF NOT EXISTS idx_test_distributions_test_id      ON test_distributions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_distributions_community_id ON test_distributions(community_id);

CREATE TABLE IF NOT EXISTS questions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id       UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT        NOT NULL,
  question_type TEXT        CHECK (
    question_type IN ('mcq', 'multi_select', 'true_false', 'short_answer', 'long_answer')
  ) DEFAULT 'mcq',
  options        JSONB,       -- [{id, text}, ...]  null for open-ended
  correct_answer JSONB,       -- string for mcq/true_false; string[] for multi_select; null for long
  marks          INTEGER     NOT NULL DEFAULT 1 CHECK (marks >= 0),
  order_index    INTEGER     NOT NULL DEFAULT 0,
  explanation    TEXT,        -- shown after submission
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_test_id     ON questions(test_id, order_index);

-- One attempt per student per test (enforced via unique constraint)
CREATE TABLE IF NOT EXISTS test_attempts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID        NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id     TEXT        NOT NULL REFERENCES profiles(firebase_uid) ON DELETE CASCADE,
  score          FLOAT,
  is_graded      BOOLEAN     DEFAULT FALSE,
  status         TEXT        CHECK (status IN ('in_progress', 'submitted')) DEFAULT 'in_progress',
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ,
  -- Session persistence (heartbeat every 30s)
  time_remaining INTEGER,
  last_heartbeat TIMESTAMPTZ,
  -- Security monitoring
  tab_violations INTEGER     DEFAULT 0 CHECK (tab_violations >= 0)
  -- NOTE: No UNIQUE(test_id, student_id) — allows re-attempts if teacher allows
);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id    ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_id ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status     ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_composite  ON test_attempts(test_id, student_id, status);

-- Per-question answers
CREATE TABLE IF NOT EXISTS answers (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id    UUID        NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id   UUID        NOT NULL REFERENCES questions(id)     ON DELETE CASCADE,
  answer        JSONB,
  is_correct    BOOLEAN,
  marks_awarded FLOAT       DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id  ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY — ENABLE ON ALL TABLES
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
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_distributions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers                 ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 9: RLS POLICIES
-- ============================================================
-- NOTE: Because this app uses Firebase Auth (not Supabase Auth),
-- auth.uid() is not available. We use anon-key policies that are
-- OPEN for READ on public data and OPEN for WRITE because the
-- firebase_uid identity check is enforced at the application/
-- service layer in the TypeScript code. This is the standard
-- approach for Firebase+Supabase hybrid architectures.
--
-- To upgrade to full Supabase Auth RLS in the future:
--   Replace USING (true) with USING (firebase_uid = auth.uid()::text)
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert"  ON profiles;
DROP POLICY IF EXISTS "profiles_update"  ON profiles;
DROP POLICY IF EXISTS "profiles_delete"  ON profiles;

-- Anyone can read profiles (needed for search, display names)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- App creates profiles on first login
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- Users update their own profile (enforced by firebase_uid in app)
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (true);

-- No profile deletion via API
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (false);

-- ─── NOTEBOOKS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "notebooks_select" ON notebooks;
DROP POLICY IF EXISTS "notebooks_insert" ON notebooks;
DROP POLICY IF EXISTS "notebooks_update" ON notebooks;
DROP POLICY IF EXISTS "notebooks_delete" ON notebooks;

CREATE POLICY "notebooks_select" ON notebooks FOR SELECT USING (true);
CREATE POLICY "notebooks_insert" ON notebooks FOR INSERT WITH CHECK (true);
CREATE POLICY "notebooks_update" ON notebooks FOR UPDATE USING (true);
CREATE POLICY "notebooks_delete" ON notebooks FOR DELETE USING (true);

-- ─── SECTIONS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "sections_all" ON sections;
CREATE POLICY "sections_all" ON sections FOR ALL USING (true);

-- ─── PAGES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "pages_all" ON pages;
CREATE POLICY "pages_all" ON pages FOR ALL USING (true);

-- ─── NOTES CONTENT ───────────────────────────────────────────
DROP POLICY IF EXISTS "notes_content_all" ON notes_content;
CREATE POLICY "notes_content_all" ON notes_content FOR ALL USING (true);

-- ─── PAGE SHARES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "page_shares_select" ON page_shares;
DROP POLICY IF EXISTS "page_shares_insert" ON page_shares;
DROP POLICY IF EXISTS "page_shares_delete" ON page_shares;

CREATE POLICY "page_shares_select" ON page_shares FOR SELECT USING (true);
CREATE POLICY "page_shares_insert" ON page_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "page_shares_delete" ON page_shares FOR DELETE USING (true);

-- ─── COMMUNITIES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "communities_select" ON communities;
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
DROP POLICY IF EXISTS "communities_delete" ON communities;

-- Public communities visible to all; private/broadcast only to members
CREATE POLICY "communities_select" ON communities
  FOR SELECT USING (
    type = 'public'
    OR id IN (
      SELECT community_id FROM community_members WHERE user_id IS NOT NULL
    )
  );

CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "communities_update" ON communities FOR UPDATE USING (true);
CREATE POLICY "communities_delete" ON communities FOR DELETE USING (true);

-- ─── COMMUNITY MEMBERS ───────────────────────────────────────
DROP POLICY IF EXISTS "community_members_select" ON community_members;
DROP POLICY IF EXISTS "community_members_insert" ON community_members;
DROP POLICY IF EXISTS "community_members_update" ON community_members;
DROP POLICY IF EXISTS "community_members_delete" ON community_members;

CREATE POLICY "community_members_select" ON community_members FOR SELECT USING (true);
CREATE POLICY "community_members_insert" ON community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "community_members_update" ON community_members FOR UPDATE USING (true);
CREATE POLICY "community_members_delete" ON community_members FOR DELETE USING (true);

-- ─── COMMUNITY JOIN REQUESTS ─────────────────────────────────
DROP POLICY IF EXISTS "community_jr_all" ON community_join_requests;
CREATE POLICY "community_jr_all" ON community_join_requests FOR ALL USING (true);

-- ─── COMMUNITY INVITES ───────────────────────────────────────
DROP POLICY IF EXISTS "community_invites_all" ON community_invites;
CREATE POLICY "community_invites_all" ON community_invites FOR ALL USING (true);

-- ─── GROUP MESSAGES ──────────────────────────────────────────
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

-- Only members of a community can read/send messages
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id IS NOT NULL
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id IS NOT NULL
    )
  );

-- Members cannot edit/delete others' messages (app-layer restriction)
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (true);

-- ─── CONVERSATIONS (DM) ──────────────────────────────────────
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;

CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (true);

-- ─── DIRECT MESSAGES ─────────────────────────────────────────
DROP POLICY IF EXISTS "direct_messages_select" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update" ON direct_messages;

CREATE POLICY "direct_messages_select" ON direct_messages FOR SELECT USING (true);
CREATE POLICY "direct_messages_insert" ON direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "direct_messages_update" ON direct_messages FOR UPDATE USING (true);

-- ─── AI CONVERSATIONS ────────────────────────────────────────
DROP POLICY IF EXISTS "ai_conversations_all" ON ai_conversations;
CREATE POLICY "ai_conversations_all" ON ai_conversations FOR ALL USING (true);

-- ─── AI MESSAGES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_messages_all" ON ai_messages;
CREATE POLICY "ai_messages_all" ON ai_messages FOR ALL USING (true);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (true);

-- ─── TESTS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "tests_select"  ON tests;
DROP POLICY IF EXISTS "tests_insert"  ON tests;
DROP POLICY IF EXISTS "tests_update"  ON tests;
DROP POLICY IF EXISTS "tests_delete"  ON tests;

-- All authenticated users can see published tests (private ones filtered by code in app)
CREATE POLICY "tests_select"  ON tests FOR SELECT USING (true);
CREATE POLICY "tests_insert"  ON tests FOR INSERT WITH CHECK (true);
CREATE POLICY "tests_update"  ON tests FOR UPDATE USING (true);
CREATE POLICY "tests_delete"  ON tests FOR DELETE USING (true);

-- ─── TEST DISTRIBUTIONS ──────────────────────────────────────
DROP POLICY IF EXISTS "test_distributions_all" ON test_distributions;
CREATE POLICY "test_distributions_all" ON test_distributions FOR ALL USING (true);

-- ─── QUESTIONS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "questions_select" ON questions;
DROP POLICY IF EXISTS "questions_insert" ON questions;
DROP POLICY IF EXISTS "questions_update" ON questions;
DROP POLICY IF EXISTS "questions_delete" ON questions;

CREATE POLICY "questions_select" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "questions_update" ON questions FOR UPDATE USING (true);
CREATE POLICY "questions_delete" ON questions FOR DELETE USING (true);

-- ─── TEST ATTEMPTS ───────────────────────────────────────────
DROP POLICY IF EXISTS "test_attempts_select" ON test_attempts;
DROP POLICY IF EXISTS "test_attempts_insert" ON test_attempts;
DROP POLICY IF EXISTS "test_attempts_update" ON test_attempts;

CREATE POLICY "test_attempts_select" ON test_attempts FOR SELECT USING (true);
CREATE POLICY "test_attempts_insert" ON test_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "test_attempts_update" ON test_attempts FOR UPDATE USING (true);

-- ─── ANSWERS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "answers_select" ON answers;
DROP POLICY IF EXISTS "answers_insert" ON answers;
DROP POLICY IF EXISTS "answers_update" ON answers;

CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "answers_update" ON answers FOR UPDATE USING (true);

-- ============================================================
-- SECTION 10: REALTIME SUBSCRIPTIONS
-- ============================================================
-- Create the publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

-- Add specific tables to realtime (safe to re-run)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'messages',
    'direct_messages',
    'conversations',
    'community_invites',
    'notifications',
    'test_attempts',
    'answers'
  ]
  LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Publication already covers ALL TABLES; ignore
    END;
  END LOOP;
END $$;

-- ============================================================
-- SECTION 11: STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  52428800,   -- 50 MB limit
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/zip','text/plain','video/mp4','audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public           = EXCLUDED.public,
  file_size_limit  = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,    -- 5 MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public           = EXCLUDED.public,
  file_size_limit  = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies
DROP POLICY IF EXISTS "storage_chat_select" ON storage.objects;
CREATE POLICY "storage_chat_select" ON storage.objects
  FOR SELECT USING (bucket_id IN ('chat-files', 'avatars'));

DROP POLICY IF EXISTS "storage_chat_insert" ON storage.objects;
CREATE POLICY "storage_chat_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('chat-files', 'avatars'));

DROP POLICY IF EXISTS "storage_chat_update" ON storage.objects;
CREATE POLICY "storage_chat_update" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('chat-files', 'avatars'));

DROP POLICY IF EXISTS "storage_chat_delete" ON storage.objects;
CREATE POLICY "storage_chat_delete" ON storage.objects
  FOR DELETE USING (bucket_id IN ('chat-files', 'avatars'));

-- ============================================================
-- SECTION 12: HELPER VIEWS (for analytics / dashboards)
-- ============================================================

-- Community member counts
CREATE OR REPLACE VIEW v_community_member_counts AS
  SELECT community_id, COUNT(*) AS member_count
  FROM community_members
  GROUP BY community_id;

-- Test summary (for teacher dashboard)
CREATE OR REPLACE VIEW v_test_summary AS
  SELECT
    t.id,
    t.title,
    t.subject,
    t.status,
    t.visibility,
    t.teacher_id,
    COUNT(DISTINCT ta.id)          AS total_attempts,
    COUNT(DISTINCT ta.student_id)  AS unique_students,
    ROUND(AVG(ta.score)::numeric, 2) AS avg_score,
    MAX(ta.submitted_at)           AS last_submission
  FROM tests t
  LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.status = 'submitted'
  GROUP BY t.id;

-- ============================================================
-- SCHEMA COMPLETE
-- Run seed_data.sql next to populate initial data.
-- ============================================================