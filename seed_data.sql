-- ============================================================
-- StudyBuddy AI — Seed Data  (SINGLE SOURCE OF TRUTH)
-- VERSION: 2.0
-- ============================================================
-- Run AFTER supabase_schema.sql
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run.
-- ============================================================

-- ── 1. USER PROFILES ─────────────────────────────────────────
-- Real Firebase UIDs from the production project.
-- Add or update as new users join.
INSERT INTO profiles (
  firebase_uid, email, username, full_name,
  role, onboarding_completed, bio, college, avatar_url
) VALUES
  -- Students
  ('n5GjCwmCZyM8pzeJOPukw6HM0z83',
   'vivekpawar@gmail.com',       'vivekpawar',     'Vivek Pawar',
   'student', TRUE, 'CS student & developer', 'SVERI College', NULL),

  ('2lYWcsi8BSVVoU9AUyjmJLaixba2',
   'king3010@gmail.com',         'king3010',       'King 3010',
   'student', TRUE, 'Learning DSA and web dev', 'SVERI College', NULL),

  ('HeAp1TwB8bYh8P1PP0mOtIMwhJ82',
   'zambarekiran92@gmail.com',   'zambarekiran92', 'Kiran Zambare',
   'student', TRUE, '', 'SVERI College', NULL),

  -- Teachers
  ('33D1Xh1vGJdlczuLUAsyMdXao7f1',
   'dhirajvgaikwad@sveri.ac.in', 'dhirajvgaikwad', 'Dhiraj Gaikwad',
   'teacher', TRUE, 'Professor of Computer Science', 'SVERI College', NULL),

  ('7aHbEm06KvUR2nmWUMwMDc2JFD02',
   'vivekpawar932564@gmail.com', 'vivekadmin',     'Vivek Pawar (Admin)',
   'teacher', TRUE, 'Platform administrator and lead developer', 'SVERI College', NULL)

ON CONFLICT (firebase_uid) DO NOTHING;

-- ── 2. COMMUNITIES ────────────────────────────────────────────
INSERT INTO communities (id, name, description, created_by, type, invite_code, is_official) VALUES

  -- Official public group — all users are members
  ('00000000-0000-0000-0000-000000000001',
   'Global Study Group',
   'A place for everyone to discuss topics, share notes, and learn together.',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'public', 'GLOBAL12', true),

  -- Broadcast channel — only admins post
  ('00000000-0000-0000-0000-000000000002',
   'Official Updates',
   'Stay updated with the latest StudyBuddy features and announcements. Admins only.',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'broadcast', 'UPDATE88', true),

  -- Private class group
  ('00000000-0000-0000-0000-000000000006',
   'CS101 Study Squad',
   'Private group for CS101 students. Resources, doubt sessions, and assignments.',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'private', 'CS101SQ', false)

ON CONFLICT (id) DO NOTHING;

-- ── 3. COMMUNITY MEMBERS ──────────────────────────────────────
-- Global Study Group
INSERT INTO community_members (community_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'n5GjCwmCZyM8pzeJOPukw6HM0z83',  'member'),
  ('00000000-0000-0000-0000-000000000001', '2lYWcsi8BSVVoU9AUyjmJLaixba2',  'member'),
  ('00000000-0000-0000-0000-000000000001', '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'admin'),
  ('00000000-0000-0000-0000-000000000001', 'HeAp1TwB8bYh8P1PP0mOtIMwhJ82', 'member'),
  ('00000000-0000-0000-0000-000000000001', '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'admin')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Official Updates (all users as members, admin manages)
INSERT INTO community_members (community_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000002', 'n5GjCwmCZyM8pzeJOPukw6HM0z83',  'member'),
  ('00000000-0000-0000-0000-000000000002', '2lYWcsi8BSVVoU9AUyjmJLaixba2',  'member'),
  ('00000000-0000-0000-0000-000000000002', '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'member'),
  ('00000000-0000-0000-0000-000000000002', 'HeAp1TwB8bYh8P1PP0mOtIMwhJ82', 'member'),
  ('00000000-0000-0000-0000-000000000002', '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'admin')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- CS101 Study Squad
INSERT INTO community_members (community_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000006', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'admin'),
  ('00000000-0000-0000-0000-000000000006', '2lYWcsi8BSVVoU9AUyjmJLaixba2', 'member'),
  ('00000000-0000-0000-0000-000000000006', 'HeAp1TwB8bYh8P1PP0mOtIMwhJ82', 'member')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- ── 4. COMMUNITY MESSAGES ─────────────────────────────────────
INSERT INTO messages (community_id, sender_id, message_text, type) VALUES
  -- Global Study Group
  ('00000000-0000-0000-0000-000000000001', '7aHbEm06KvUR2nmWUMwMDc2JFD02',
   'Welcome everyone to the Global Study Group! 🎉 Feel free to ask questions and share notes.', 'text'),
  ('00000000-0000-0000-0000-000000000001', '33D1Xh1vGJdlczuLUAsyMdXao7f1',
   'Great platform! Students, I will be sharing study resources here regularly.', 'text'),
  ('00000000-0000-0000-0000-000000000001', 'n5GjCwmCZyM8pzeJOPukw6HM0z83',
   'Thanks! Really excited to study together 📚', 'text'),
  ('00000000-0000-0000-0000-000000000001', '2lYWcsi8BSVVoU9AUyjmJLaixba2',
   'Can anyone share Data Structures notes?', 'text'),
  ('00000000-0000-0000-0000-000000000001', 'HeAp1TwB8bYh8P1PP0mOtIMwhJ82',
   'I have some! Will share them soon 👍', 'text'),
  -- Official Updates (broadcast)
  ('00000000-0000-0000-0000-000000000002', '7aHbEm06KvUR2nmWUMwMDc2JFD02',
   '📢 StudyBuddy v2.0 is live! New features: secure tests, code-based access, and real-time chat.', 'text'),
  ('00000000-0000-0000-0000-000000000002', '7aHbEm06KvUR2nmWUMwMDc2JFD02',
   '🔔 Tip: Teachers can set tests as Private — students join using a unique 6-character code!', 'text'),
  -- CS101 Squad
  ('00000000-0000-0000-0000-000000000006', 'n5GjCwmCZyM8pzeJOPukw6HM0z83',
   'CS101 squad is live! This group is for our course only 🧑‍💻', 'text'),
  ('00000000-0000-0000-0000-000000000006', '2lYWcsi8BSVVoU9AUyjmJLaixba2',
   'Great idea Vivek! When is the next assignment due?', 'text'),
  ('00000000-0000-0000-0000-000000000006', 'HeAp1TwB8bYh8P1PP0mOtIMwhJ82',
   'Next week Friday I think. Let me check with sir.', 'text')
ON CONFLICT DO NOTHING;

-- ── 5. DIRECT MESSAGE CONVERSATIONS ──────────────────────────
INSERT INTO conversations (id, user1_id, user2_id, status) VALUES
  ('00000000-0000-0000-0000-000000000005',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'accepted'),
  ('00000000-0000-0000-0000-000000000007',
   '2lYWcsi8BSVVoU9AUyjmJLaixba2', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'accepted'),
  ('00000000-0000-0000-0000-000000000008',
   'HeAp1TwB8bYh8P1PP0mOtIMwhJ82', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'accepted'),
  ('00000000-0000-0000-0000-000000000009',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- ── 6. DIRECT MESSAGES ───────────────────────────────────────
INSERT INTO direct_messages (id, conversation_id, sender_id, message_text) VALUES
  -- Vivek ↔ Admin
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000005',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'Hey! How do I share a private test with my students?'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000005',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'Set visibility to Private when creating the test. Your students get the 6-character code shown on the test card.'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000005',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'Got it! And can students resume if their device dies?'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000005',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02', 'Yes! Their answers and remaining time are saved every 30 seconds. They can re-login and resume before time runs out.'),
  -- King ↔ Vivek
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000007',
   '2lYWcsi8BSVVoU9AUyjmJLaixba2', 'Vivek, did you finish the DSA assignment?'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000007',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'Almost! Question 4 is tricky. Let me know if you get it.'),
  -- Kiran ↔ Vivek
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000008',
   'HeAp1TwB8bYh8P1PP0mOtIMwhJ82', 'Can you add me to the CS101 group?'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000008',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'Done! Check your communities 👍'),
  -- Dhiraj ↔ Vivek
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000009',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'Good morning Vivek! Your project submission is pending.'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000009',
   'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'I will submit by tonight sir!')
ON CONFLICT (id) DO NOTHING;

-- ── 7. TESTS ─────────────────────────────────────────────────
INSERT INTO tests (
  id, teacher_id, title, description,
  subject, topic, duration, total_marks, negative_marks,
  randomize_questions, visibility, status, test_code
) VALUES

  -- PUBLIC: Teacher guide (helps teachers learn the platform)
  ('00000000-0000-0000-0000-000000000003',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02',
   'Teacher Guide: Creating Tests',
   'Learn how to use the test builder, add questions, set marks, and publish your test.',
   'General', 'Onboarding', 30, 100, 0,
   false, 'public', 'published', 'GUIDE1'),

  -- PUBLIC: Student guide
  ('00000000-0000-0000-0000-000000000004',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02',
   'Student Guide: Taking Tests',
   'Instructions on how to start a test, manage your time, and submit answers securely.',
   'General', 'Onboarding', 30, 100, 0,
   false, 'public', 'published', 'GUIDE2'),

  -- PRIVATE: CS101 Mid-Term
  ('00000000-0000-0000-0000-000000000010',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1',
   'CS101 Mid-Term Exam',
   'Covers Arrays, Linked Lists, Stacks & Queues. Full-screen mode enforced.',
   'Computer Science', 'Data Structures', 90, 100, 0.25,
   true, 'private', 'published', 'CS1MID'),

  -- PRIVATE: Physics Quiz
  ('00000000-0000-0000-0000-000000000011',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1',
   'Physics: Thermodynamics Quiz',
   'Chapter 12 & 13 — Laws of Thermodynamics. 20 questions. Negative marking applies.',
   'Physics', 'Thermodynamics', 45, 50, 0.5,
   false, 'private', 'published', 'PHYQ01'),

  -- DRAFT: Unpublished test (visible only to creator)
  ('00000000-0000-0000-0000-000000000012',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1',
   'Algebra Unit Test [DRAFT]',
   'Chapter 5 — Quadratic Equations. Still being drafted.',
   'Mathematics', 'Algebra', 60, 80, 0,
   false, 'private', 'draft', 'ALGDRFT')

ON CONFLICT (id) DO NOTHING;

-- ── 8. TEST DISTRIBUTIONS ─────────────────────────────────────
-- Distribute CS101 Mid-Term to CS101 Study Squad community
INSERT INTO test_distributions (test_id, community_id) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006')
ON CONFLICT (test_id, community_id) DO NOTHING;

-- ── 9. QUESTIONS ──────────────────────────────────────────────

-- Teacher Guide questions
INSERT INTO questions (id, test_id, question_text, question_type, options, correct_answer, marks, order_index, explanation)
VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000003',
   'Where do you find the "Add Question" button in the test builder?',
   'mcq',
   '[{"id":"1","text":"At the bottom of the question list"},{"id":"2","text":"In the top navigation bar"},{"id":"3","text":"In the sidebar settings"}]',
   '"1"', 50, 0,
   'Scroll to the bottom of the questions panel and click "Add New Question".'),

  ('00000000-0000-0000-0001-000000000002',
   '00000000-0000-0000-0000-000000000003',
   'What happens after you click "Publish Test"?',
   'mcq',
   '[{"id":"1","text":"The editor stays open"},{"id":"2","text":"The test is published and you return to the test list"},{"id":"3","text":"The test is sent directly to students"}]',
   '"2"', 50, 1,
   'Clicking Publish saves the test as published and closes the editor.')
ON CONFLICT (id) DO NOTHING;

-- Student Guide questions
INSERT INTO questions (id, test_id, question_text, question_type, options, correct_answer, marks, order_index, explanation)
VALUES
  ('00000000-0000-0000-0001-000000000003',
   '00000000-0000-0000-0000-000000000004',
   'What happens when the countdown timer reaches zero?',
   'mcq',
   '[{"id":"1","text":"Test is automatically submitted"},{"id":"2","text":"You get 5 extra minutes"},{"id":"3","text":"You can keep writing"}]',
   '"1"', 25, 0,
   'The system auto-submits your attempt the moment time expires.'),

  ('00000000-0000-0000-0001-000000000004',
   '00000000-0000-0000-0000-000000000004',
   'What happens if you switch tabs or exit full-screen during a test?',
   'mcq',
   '[{"id":"1","text":"Nothing, it is allowed"},{"id":"2","text":"A violation is recorded — 3 violations auto-submit the test"},{"id":"3","text":"The test pauses automatically"}]',
   '"2"', 25, 1,
   'Each tab-switch or fullscreen exit counts as one violation. At 3 violations, the test is automatically submitted.'),

  ('00000000-0000-0000-0001-000000000005',
   '00000000-0000-0000-0000-000000000004',
   'How do you join a private test not shown in the list?',
   'mcq',
   '[{"id":"1","text":"Ask the teacher to add you manually"},{"id":"2","text":"Click \"Enter Code\" and type the 6-character test code your teacher gives you"},{"id":"3","text":"Search for it by name"}]',
   '"2"', 25, 2,
   'Private tests require a unique 6-character code from your teacher.'),

  ('00000000-0000-0000-0001-000000000006',
   '00000000-0000-0000-0000-000000000004',
   'If your device loses power mid-test, can you resume?',
   'mcq',
   '[{"id":"1","text":"No — you must start over"},{"id":"2","text":"Yes — log back in before the timer expires to resume with all saved answers"},{"id":"3","text":"Only if the teacher enables it"}]',
   '"2"', 25, 3,
   'Answers and time remaining are saved every 30 seconds. Resume from any device before time expires.')
ON CONFLICT (id) DO NOTHING;

-- CS101 Mid-Term questions
INSERT INTO questions (id, test_id, question_text, question_type, options, correct_answer, marks, order_index, explanation)
VALUES
  ('00000000-0000-0000-0001-000000000010',
   '00000000-0000-0000-0000-000000000010',
   'Which of the following are LIFO data structures?',
   'multi_select',
   '[{"id":"1","text":"Stack"},{"id":"2","text":"Queue"},{"id":"3","text":"Recursion call stack"},{"id":"4","text":"Deque (used as stack)"}]',
   '["1","3","4"]', 10, 0,
   'Stacks, call stacks, and deques-used-as-stacks all follow LIFO. Queues are FIFO.'),

  ('00000000-0000-0000-0001-000000000011',
   '00000000-0000-0000-0000-000000000010',
   'What is the time complexity of accessing an element by index in an array?',
   'mcq',
   '[{"id":"1","text":"O(1)"},{"id":"2","text":"O(n)"},{"id":"3","text":"O(log n)"},{"id":"4","text":"O(n²)"}]',
   '"1"', 10, 1,
   'Arrays provide O(1) random access because elements are stored contiguously in memory.'),

  ('00000000-0000-0000-0001-000000000012',
   '00000000-0000-0000-0000-000000000010',
   'A singly linked list allows traversal in both directions.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   '"false"', 5, 2,
   'Singly linked lists only allow forward traversal. Doubly linked lists support bidirectional traversal.'),

  ('00000000-0000-0000-0001-000000000013',
   '00000000-0000-0000-0000-000000000010',
   'Explain the difference between a stack and a queue with a real-world example for each.',
   'long_answer',
   NULL, NULL, 15, 3,
   'Stack: LIFO — e.g., browser back button. Queue: FIFO — e.g., print job queue or ticket counter.')
ON CONFLICT (id) DO NOTHING;

-- Physics Thermodynamics questions
INSERT INTO questions (id, test_id, question_text, question_type, options, correct_answer, marks, order_index, explanation)
VALUES
  ('00000000-0000-0000-0001-000000000020',
   '00000000-0000-0000-0000-000000000011',
   'The first law of thermodynamics states that energy can be:',
   'mcq',
   '[{"id":"1","text":"Created but not destroyed"},{"id":"2","text":"Destroyed but not created"},{"id":"3","text":"Neither created nor destroyed, only converted"},{"id":"4","text":"Both created and destroyed"}]',
   '"3"', 5, 0,
   'First law: ΔU = Q − W. Energy is conserved; it can only be transferred or converted.'),

  ('00000000-0000-0000-0001-000000000021',
   '00000000-0000-0000-0000-000000000011',
   'In an isothermal process for an ideal gas, which quantities remain constant?',
   'multi_select',
   '[{"id":"1","text":"Temperature"},{"id":"2","text":"Pressure"},{"id":"3","text":"Internal energy (ideal gas)"},{"id":"4","text":"Volume"}]',
   '["1","3"]', 8, 1,
   'Isothermal = constant temperature. For an ideal gas, internal energy depends only on temperature, so it also stays constant.'),

  ('00000000-0000-0000-0001-000000000022',
   '00000000-0000-0000-0000-000000000011',
   'Entropy always increases in a reversible process.',
   'true_false',
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   '"false"', 5, 2,
   'In a reversible process, ΔS = 0. Entropy increases only in irreversible processes.'),

  ('00000000-0000-0000-0001-000000000023',
   '00000000-0000-0000-0000-000000000011',
   'Briefly explain why a heat engine cannot have 100% efficiency.',
   'short_answer',
   NULL,
   '"Because some heat must always be rejected to a cold reservoir per the second law (Kelvin-Planck statement)."',
   7, 3,
   'The Kelvin-Planck statement forbids converting all absorbed heat into work; some must be expelled to a cold reservoir.')
ON CONFLICT (id) DO NOTHING;

-- ── 10. NOTEBOOKS ─────────────────────────────────────────────
INSERT INTO notebooks (id, user_id, title, color) VALUES
  ('00000000-0000-0000-0004-000000000001', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'Science 101',  '#10b981'),
  ('00000000-0000-0000-0004-000000000002', '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'Lesson Plans', '#6366f1'),
  ('00000000-0000-0000-0004-000000000003', '2lYWcsi8BSVVoU9AUyjmJLaixba2', 'My Notes',     '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- ── 11. SECTIONS ──────────────────────────────────────────────
INSERT INTO sections (id, notebook_id, title) VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001', 'Physics'),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000001', 'Biology'),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0004-000000000002', 'Fall 2026'),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0004-000000000003', 'General')
ON CONFLICT (id) DO NOTHING;

-- ── 12. PAGES ─────────────────────────────────────────────────
INSERT INTO pages (id, section_id, title, tags) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0005-000000000001', 'Newton''s Laws',   ARRAY['physics','mechanics']),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0005-000000000002', 'Cell Structure',   ARRAY['biology','cells']),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0005-000000000003', 'Physics Syllabus', ARRAY['syllabus']),
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0005-000000000004', 'DSA Notes',        ARRAY['cs','dsa'])
ON CONFLICT (id) DO NOTHING;

-- ── 13. NOTES CONTENT ─────────────────────────────────────────
INSERT INTO notes_content (page_id, content) VALUES
  ('00000000-0000-0000-0006-000000000001',
   '<h1>Newton''s Laws of Motion</h1><p><strong>1st Law:</strong> An object at rest stays at rest unless acted on by an external force.</p><p><strong>2nd Law:</strong> F = ma</p><p><strong>3rd Law:</strong> For every action, there is an equal and opposite reaction.</p>'),
  ('00000000-0000-0000-0006-000000000002',
   '<h1>Cell Structure</h1><p>Cells are the fundamental units of life. The main parts include: nucleus, mitochondria, ribosomes, and cell membrane.</p>'),
  ('00000000-0000-0000-0006-000000000003',
   '<h1>Physics Syllabus — Fall 2026</h1><ul><li>Module 1: Mechanics</li><li>Module 2: Waves & Optics</li><li>Module 3: Thermodynamics</li><li>Module 4: Electromagnetism</li></ul>'),
  ('00000000-0000-0000-0006-000000000004',
   '<h1>DSA Notes</h1><h2>Arrays</h2><p>O(1) access, O(n) search. Fixed size.</p><h2>Linked Lists</h2><p>O(n) access, O(1) insertion at head.</p><h2>Stacks</h2><p>LIFO — push/pop at one end.</p>')
ON CONFLICT (page_id) DO NOTHING;

-- ── 14. PAGE SHARES ───────────────────────────────────────────
INSERT INTO page_shares (page_id, user_id, access_type) VALUES
  -- Newton's Laws shared to teacher (viewer)
  ('00000000-0000-0000-0006-000000000001', '33D1Xh1vGJdlczuLUAsyMdXao7f1', 'viewer'),
  -- Physics Syllabus shared to Vivek (editor)
  ('00000000-0000-0000-0006-000000000003', 'n5GjCwmCZyM8pzeJOPukw6HM0z83', 'editor'),
  -- DSA Notes shared to King (viewer)
  ('00000000-0000-0000-0006-000000000004', '2lYWcsi8BSVVoU9AUyjmJLaixba2', 'viewer')
ON CONFLICT (page_id, user_id) DO NOTHING;

-- ── 15. SAMPLE NOTIFICATIONS ──────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, sender_id, link) VALUES
  ('n5GjCwmCZyM8pzeJOPukw6HM0z83', 'info',
   'Welcome to StudyBuddy! 🎉',
   'Complete your profile and explore notes, tests, and communities.',
   '7aHbEm06KvUR2nmWUMwMDc2JFD02', '/profile'),

  ('n5GjCwmCZyM8pzeJOPukw6HM0z83', 'info',
   'New Test Assigned: CS101 Mid-Term',
   'A new test "CS101 Mid-Term Exam" has been assigned to your community.',
   '33D1Xh1vGJdlczuLUAsyMdXao7f1', '/tests'),

  ('33D1Xh1vGJdlczuLUAsyMdXao7f1', 'success',
   'Test Published Successfully',
   'Your test "CS101 Mid-Term Exam" is now live. Share code: CS1MID',
   NULL, '/tests')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA COMPLETE ✅
-- ============================================================
