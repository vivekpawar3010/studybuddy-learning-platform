# StudyBuddy — 15-Week Step-by-Step Development Plan

**Project:** StudyBuddy — AI-Driven Study & Community Collaboration Platform

**Author:** Vivek Pawar

**Duration:** 15 weeks

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS v4, PostgreSQL (Supabase), Realtime WebSockets, TipTap (Rich Text), Google Gemini GenAI SDK, Vercel.

---

## Purpose

This document outlines the week-by-week plan to develop StudyBuddy from MVP to a deployed, production-ready version over 15 weeks. It aligns with our actual technology stack (React + Supabase) rather than the original hypothetical python backend.

---

## Prerequisites

* Node.js (v18+)
* Git & GitHub account
* Supabase account (Database, Auth, and Realtime)
* Firebase project (optional legacy auth/storage support)
* Google Gemini API Key
* Vercel account (for frontend hosting)

---

## Repo Structure

```text
studybuddy-learning-platform/
├── src/
│   ├── components/      # Shared UI components
│   ├── contexts/        # Theme + Notification contexts
│   ├── pages/           # All route-level page modules
│   └── services/        # Supabase, Firebase, Gemini AI
├── docs/                # Weekly completion reports
├── public/animations/   # Lottie animation assets
├── .env.example         # Safe env template
└── supabase_schema.sql  # Full DB schema (local only)
```

---

## Week-by-week Plan 

### Week 1 — Project Initialization & Core Tech Stack
* Initialize the repository and scaffold the base application using Vite and React.
* Configure strict TypeScript rules and Tailwind CSS (v4) for styling.
* Set up standard routing shells using React Router.
**Deliverables:** Repo skeleton, `package.json`, Vite configuration.

### Week 2 — Authentication System
* Integrate Auth providers (Email/Password & Google OAuth).
* Implement Firebase or Supabase auth wrappers and Context providers.
* Secure routing using Protected Route components.
**Deliverables:** Signup, Login flows; strictly Protected Dashboard routes.

### Week 3 — UI/UX Refinement & Dashboard Enhancement
* Build the primary responsive layout (Navbar, collapsable Sidebar).
* Implement generic UI components (Buttons, Modals, Cards).
* Add Framer Motion for snappy animations and Recharts for progress visualization.
**Deliverables:** A fully aesthetic, interactive frontend shell.

### Week 4 — MyNotes & Rich Text Editor
* Evaluate and integrate TipTap headless editor.
* Add support for rich features (Tables, image parsing, bold/italic markup).
* Develop HTML-to-PDF export capabilities using `html2pdf.js`.
**Deliverables:** Robust word processing interface.

### Week 5 — Community & Real-time Messaging
* Design Supabase PostgreSQL schema for Groups and Messages.
* Hook into WebSockets via Supabase Realtime subscriptions.
* Build the direct messaging interface and auto-scroll/optimistic UI updates.
**Deliverables:** Live updating chat system without page refreshes.

### Week 6 — Assessment System Foundation
* Build the database relational mappings for Tests, Questions, and Options.
* Develop the Teacher UI for test authoring (Multiple Choice, True/False).
* Implement `useReducer` to manage the massive nested state of a test.
**Deliverables:** Teacher test-builder portal.

### Week 7 — Secure Online Testing Environment
* Create the student test-taking portal.
* Implement a server-synced UTC countdown timer.
* Harness standard browser APIs (`visibilitychange`, `fullscreen`) to build anti-cheat tab-switching guards.
**Deliverables:** Highly secure online examination system.

### Week 8 — Member Management & Global Search
* Develop global platform search modals for inviting users.
* Implement deep debouncing logic to prevent API throttling on keystrokes.
* Add Postgres search functions to rapidly query usernames.
**Deliverables:** Group administration panel and platform search.

### Week 9 — Notifications & MyNotes Upgrades
* Implement a global WebSocket-powered notification Bell on the Navbar.
* Build draggable, resizable application panels.
* Rewrite Notes to support deeply nested folder arrays and drag-and-drop operations.
**Deliverables:** Quality of life structural upgrades.

### Week 10 — Gemini AI Integration
* Inject `@google/genai` logic into the frontend.
* Create a floating StudyBot chat widget.
* Provide context-aware payload construction (e.g. AI knows what test the user is taking).
**Deliverables:** Fully functioning LLM assistant with markdown streaming.

### Week 11 — Onboarding System & Polish
* Develop a step-by-step interactive Onboarding Wizard that highlights specific screen areas using Z-index overlays.
* Perform sweeping `<a target="_blank" rel="noopener noreferrer">` safety rewrites across the codebase.
**Deliverables:** User-friendly first-time login experience.

### Week 12 — Finalization, Seed Data & Testing
* Write massive raw SQL generation scripts to seed the database with mock test data.
* Squish any lingering TypeScript Warnings and run Vite bundle optimizations.
**Deliverables:** Stable, polished local application.

### Week 13 — Analytics & Teacher Reports (Planned)
* Build aggregate view dashboards for instructors to track overall student success across exams.
* Render success percentage distributions via Recharts.
**Deliverables:** Educator Insights.

### Week 14 — Theme Engine & UI Polish (Complete)
* Implement a 6-theme engine (Basic, Light, Dark, Aurora, Nebula, Geometric) with live animated backgrounds.
* Refine all CSS variables for deep UI consistency and mobile responsiveness.
**Deliverables:** Global theme system with localStorage persistence, smooth transitions, and animated backgrounds per theme.

### Week 15 — Final Deployment (Planned)
* Final edge caching strategies.
* Deploy frontend to Vercel production edge network.
* Ensure domain masking and CDN delivery logic is active.
**Deliverables:** Live, publicly accessible URL.

---

## Development Guidelines
* Keep secrets in `.env` only (never commit this).
* Maintain strict TypeScript adherence to prevent breaking runtime behavior.
* Make use of UI abstractions over raw utility repeating.
