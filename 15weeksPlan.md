# StudyBuddy — 15-Week Step-by-Step Development Plan

**Project:** StudyBuddy — AI-Driven Study & Community Collaboration Platform

**Author:** Vivek Pawar

**Duration:** 15 weeks

**Tech Stack (Balanced):** Next.js, Tailwind CSS, FastAPI (Python), PostgreSQL (Supabase), Firebase Auth, Firebase Storage, Redis (Upstash), Gemini API, Pusher / Socket.IO (chat), Vercel (frontend), Render (backend)

---

## Purpose

This README documents the week-by-week plan to develop StudyBuddy from MVP to a deployed version over 15 weeks. Each week lists the goals, short tasks, and deliverables so you can track progress and hand over clear artifacts to your mentor.

---

## Prerequisites

* Node.js (v16+)
* Python 3.9+
* Git & GitHub account
* Supabase account (or managed PostgreSQL)
* Firebase project (Auth + Storage)
* Vercel account (for frontend) and Render account (for backend)
* Gemini API access (or equivalent LLM access)
* Redis provider (Upstash or Redis Cloud) for caching

---

## How to use this README

* Follow the weekly steps in order.
* Commit small, frequent changes to `github.com/your-repo`.
* Create one PR per completed week with a short demo note and screenshots.
* Keep the `README` updated with links to deployed staging URLs and any API keys reference (in private notes only).

---

## Repo Structure (suggested)

```
/frontend    # Next.js app
/backend     # FastAPI app
/docs        # Architecture diagrams, reports, slides
/migrations  # Alembic migrations
/scripts     # helper scripts
```

---

## Week-by-week Plan (Short & Actionable)

> Each week: commit code, update issues, add a short demo GIF / screenshots to PR.

### Week 1 — Project Setup & Initial Infrastructure

* Initialize `frontend/` (Next.js + Tailwind) and `backend/` (FastAPI) repos.
* Configure linting / formatters (ESLint, Prettier, Black, isort).
* Create Supabase project and get DB credentials.

**Deliverables:** Repo skeleton, README, `.gitignore`, local dev instructions.

---

### Week 2 — Authentication (Firebase Auth)

* Integrate Firebase Auth in frontend (email / Google sign-in).
* Protect routes and create auth context/provider.
* Create simple dashboard layout.

**Deliverables:** Login, signup pages; protected route demo.

---

### Week 3 — User Profiles & Role Management

* Add Firebase Admin check in backend to verify tokens.
* Create `/users/me` endpoint and Postgres user entry.
* Implement profile page with role selection (student / teacher).

**Deliverables:** Profile page, backend sync working.

---

### Week 4 — DB Models & Core APIs

* Design and run initial Alembic migrations: Users, Notes, Groups, GroupMembers, Posts, ChatMessages, Tests, Questions, Results.
* Add base CRUD APIs for Notes and Groups.

**Deliverables:** Database schema, working CRUD endpoints.

---

### Week 5 — Notes Editor & File Uploads

* Integrate rich text editor (Tiptap/Quill) on the frontend.
* Upload files to Firebase Storage and save URLs in the DB.

**Deliverables:** Create/Edit notes UI; attachment uploads working.

---

### Week 6 — Groups: Create & Join

* Implement group creation flow and membership model.
* Add pages to list groups a user belongs to and group details.

**Deliverables:** Group creation UI and join flows.

---

### Week 7 — Group Posts & Resource Sharing

* Build group feed to post updates and attach notes/files.
* Implement backend posts CRUD and resource library per group.

**Deliverables:** Group feed, resource library with attachments.

---

### Week 8 — Real-Time Chat (Mandatory)

* Choose Pusher (fast) or Socket.IO + FastAPI WebSockets (custom).
* Implement chat room per group, message broadcasting, and persistence to DB.
* Add basic online user indicator.

**Deliverables:** Real-time group chat; stored message history.

---

### Week 9 — AI: Note Summaries & Flashcards

* Create `POST /ai/summarize` and `POST /ai/flashcards` endpoints.
* Integrate Gemini API calls with safe prompt templates and caching.

**Deliverables:** Summarize note and generate flashcards UI.

---

### Week 10 — Test Builder (Teacher) UI

* Implement test creation UI: title, instructions, duration, question types.
* Backend endpoints to store tests and questions and link to groups.

**Deliverables:** Test builder and storage.

---

### Week 11 — Test Runner & Auto-Grading

* Create test-taking interface with timer and submit flow.
* Auto-grade objective questions and store results.

**Deliverables:** Test runner + report page with scores.

---

### Week 12 — AI Test Generation & Study Plans

* Build `POST /ai/generate-test` and `POST /ai/studyplan` endpoints.
* Allow teacher review of AI-generated tests before publishing.

**Deliverables:** AI test drafts and personalized study plans.

---

### Week 13 — Redis Caching & Notifications

* Add Redis caching for AI responses and implement TTL (expire cache keys).
* Implement basic push notifications using Firebase Cloud Messaging.

**Deliverables:** Cached AI results; in-app or push notifications.

---

### Week 14 — Chat Improvements; Optional Gamification

* Add typing indicators, read receipts, and message reactions to chat.
* Optional: implement coins, badges, and streaks if time permits.

**Deliverables:** Polished chat UX; gamification (optional).

---

### Week 15 — Final Testing, Deployment & Documentation

* Perform end-to-end testing, fix bugs, and harden security checks.
* Deploy frontend to Vercel and backend to Render. Connect domain.
* Export final documentation, API notes, and demo link.

**Deliverables:** Live site links, deployment logs, final report PDF.

---

## Development & Submission Guidelines

* Create a PR at the end of each week with: summary, screenshots, and status.
* Keep secrets (API keys) in environment variables only.
* Use issue tracker for bugs and tasks, close issues when completed.
* Prepare a 5–7 minute demo video at Week 15 showing core flows.

---

## Useful Commands (Quick Start)

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Database migrations**

```bash
alembic upgrade head
```

---

## Notes & Tips

* Keep AI calls minimal during development to save quota; use cached mock responses where possible.
* For chat prototyping, Pusher speeds up development but switching to Socket.IO is easy once you need full control.
* Maintain separate `.env` files for local and production. Never commit secrets.

---

If you want this saved as `README.md` in your repo, I can create the file content for you or generate the file directly. Good luck — and feel free to ask for the PDF or a Gantt chart export.
