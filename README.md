<div align="center">

# 📚 StudyBuddy — AI-Powered Learning Platform

**A full-stack, role-based learning platform for students and teachers.**  
Built with React + Vite, Supabase, Firebase Auth, and Google Gemini AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

</div>

---

## ✨ Features at a Glance

| Module | What it does |
|---|---|
| 🏠 **Dashboard** | Live stats — notebooks, pages, communities, active test resume, quick navigation |
| 📝 **My Notes** | TipTap rich-text notebooks (tables, images, links, markdown export, PDF export) + AI side-panel |
| 🤖 **AI Tutor** | Multi-session Gemini AI chat — general study mode & note-context mode |
| 🧑‍🤝‍🧑 **Communities** | Real-time group & broadcast chats, DMs, invite codes, join requests, member management |
| 📊 **Assessments** | Full test builder (MCQ, true/false, short answer), anti-cheat fullscreen mode, session persistence, analytics |
| 🔔 **Notifications** | In-app notification centre with unread badge |
| 👤 **Profile** | Avatar upload, username, bio, location, college, GitHub/LinkedIn links |
| ⚙️ **Settings** | 6-theme engine, account info, password reset via email |
| 🎨 **Theme Engine** | 6 live themes with animated backgrounds — persists via `localStorage` |
| 🔒 **Auth + Roles** | Firebase Email/Password + Google Sign-In; one-time permanent role selection (Student / Teacher) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS v4, Framer Motion, CSS custom properties |
| **Database** | Supabase (PostgreSQL + Realtime subscriptions + Storage) |
| **Auth** | Firebase Authentication (Email/Password + Google OAuth) |
| **AI** | Google Gemini `gemini-2.0-flash` via `@google/genai` v1.x, dual API key rotation |
| **Editor** | TipTap v3 — rich text, tables, images, code blocks, highlights |
| **Charts** | Recharts |
| **Animations** | Framer Motion + Lottie (`@lottiefiles/dotlottie-react`) |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v7 |
| **Resizable panels** | `react-resizable-panels` |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Link |
|---|---|---|
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org/) |
| npm | 9 or higher | bundled with Node |
| Supabase account | free tier OK | [supabase.com](https://supabase.com/) |
| Firebase project | free tier OK | [console.firebase.google.com](https://console.firebase.google.com/) |
| Google Gemini API key | free tier OK | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

---

### Step 1 — Clone & Install

```bash
git clone https://github.com/vivekpawar3010/studybuddy-learning-platform.git
cd studybuddy-learning-platform
npm install
```

---

### Step 2 — Environment Variables

Copy the template and fill in your values:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and fill in every field:

```env
# ─── Google Gemini AI ──────────────────────────────────────────
# Required for AI Tutor and Notes AI panel
# Get free key: https://aistudio.google.com/app/apikey
# KEY_2 is optional — auto-used if KEY_1 hits quota (add from a second Google account)
VITE_GOOGLE_AI_API_KEY=your_gemini_api_key
VITE_GOOGLE_AI_API_KEY_2=your_backup_key    # optional but recommended

# ─── Firebase (Authentication only) ───────────────────────────
# Firebase Console → Project Overview → Project Settings → Your apps → Web app → Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456:web:abcdef

# ─── Supabase (Database + Realtime + Storage) ──────────────────
# Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ **`.env` is in `.gitignore` and will never be committed.**

---

### Step 3 — Set Up the Database (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → select your project
2. Go to **SQL Editor → New Query**
3. Paste the contents of **`supabase_schema.sql`** → click **Run**
4. *(Optional)* For sample data, also run **`seed_data.sql`**

> 📁 Both SQL files live locally only — they are in `.gitignore`.

**Enable Supabase Storage:**
- Dashboard → **Storage → Create a new bucket** → name it `avatars` → set to **public**

**Enable Supabase Realtime:**
- Dashboard → **Database → Replication** → enable the `messages` table

---

### Step 4 — Set Up Firebase Auth

1. [Firebase Console](https://console.firebase.google.com/) → select your project
2. **Build → Authentication → Get started**
3. **Sign-in method** tab → enable:
   - ✅ **Email/Password**
   - ✅ **Google**
4. **Settings → Authorized domains** → add `localhost`
5. Copy the Web App config to your `.env` (see Step 2)

---

### Step 5 — Run the Dev Server

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** 🎉

---

## 📁 Project Structure

```
studybuddy-learning-platform/
│
├── public/
│   └── animations/               # Lottie animation files (.lottie, .json)
│
├── src/
│   ├── components/               # Shared UI components
│   │   ├── AppBackground.tsx     # Live animated backgrounds (per theme)
│   │   ├── CodeBlock.tsx         # Syntax-highlighted code renderer (Prism)
│   │   ├── ConfirmDialog.tsx     # Reusable animated confirm modal
│   │   ├── Header.tsx            # Top nav bar — notifications, command palette
│   │   ├── HintTooltip.tsx       # Onboarding hint overlays
│   │   ├── LoadingScreen.tsx     # Lottie splash screen
│   │   ├── OnboardingWizard.tsx  # First-run guided walkthrough
│   │   ├── OverviewChart.tsx     # Recharts bar chart for dashboard
│   │   ├── ParticleBackground.tsx
│   │   └── ProgressRing.tsx      # SVG circular progress ring
│   │
│   ├── contexts/
│   │   ├── NotificationContext.tsx  # In-app notification state
│   │   └── ThemeContext.tsx         # 6-theme state → data-theme on <html>
│   │
│   ├── pages/
│   │   ├── Auth.tsx               # Login, Register, Google Sign-In
│   │   ├── Home.tsx               # Dashboard with live stats from Supabase
│   │   ├── AITutor.tsx            # Multi-session Gemini AI chat
│   │   ├── Settings.tsx           # Themes, account, password reset
│   │   ├── NotificationsPage.tsx  # Full notifications list
│   │   ├── ProfilePage.tsx        # Edit profile, avatar, social links
│   │   ├── ProgressPage.tsx       # Study progress tracker
│   │   ├── NotFound404.tsx        # Animated 404 page
│   │   ├── Communities/
│   │   │   ├── Communities.tsx       # Chat list / community browser
│   │   │   ├── ChatWindow.tsx        # Realtime message thread
│   │   │   ├── ChatList.tsx          # Conversation list sidebar
│   │   │   ├── MessageBubble.tsx     # Individual message UI
│   │   │   ├── MessageInput.tsx      # Send message + attach note
│   │   │   ├── GroupInfo.tsx         # Group settings, members, invite links
│   │   │   ├── AddMembersModal.tsx   # Search + invite members
│   │   │   ├── CreateCommunityModal.tsx
│   │   │   ├── CommunityJoinPage.tsx # Public join via URL/code
│   │   │   └── NotePicker.tsx        # Share a note into a chat
│   │   └── MyNotes/
│   │       ├── MyNotes.tsx           # Notebook browser + page manager
│   │       ├── Editor.tsx            # TipTap rich-text editor
│   │       ├── AIPanel.tsx           # Gemini AI side-panel for notes
│   │       └── SidebarColumn.tsx     # Notebook/section/page tree
│   │
│   ├── services/
│   │   ├── firebase.ts             # Firebase app + auth helpers
│   │   ├── supabase.ts             # Supabase client init
│   │   ├── auth-sync.ts            # Firebase → Supabase profile sync
│   │   ├── gemini.ts               # Gemini AI — dual key rotation ⭐
│   │   ├── notes-service.ts        # Notebooks, sections, pages CRUD
│   │   ├── communities-service.ts  # Communities, messages, members
│   │   ├── tests-service.ts        # Tests, questions, attempts, analytics
│   │   ├── onboarding-service.ts   # First-run onboarding state
│   │   └── seed-service.ts         # Dev seed helpers
│   │
│   ├── constants.ts               # App-wide constants
│   ├── types.ts                   # Shared TypeScript types
│   ├── utils.ts                   # Utility helpers
│   ├── App.tsx                    # Root app, router, auth gate, role picker
│   ├── index.tsx                  # React DOM entry point
│   └── index.css                  # Global CSS + all 6 theme CSS variables
│
├── .env.example                   # Environment variable template ✅ safe to commit
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Theme System

6 themes switchable instantly from **Settings → Appearance**:

| Theme | Type | Background |
|---|---|---|
| **Basic** | Light | Floating particle dots |
| **Light** | Light | Soft animated colour orbs |
| **Dark** | Dark | Glowing CSS grid |
| **Aurora** | Dark | Emerald + violet northern-light blobs |
| **Nebula** | Dark | Deep-space stars + indigo radial gradients |
| **Geometric** | Light | Animated wireframe CSS grid |

**How it works:**
- `ThemeContext` sets `data-theme="aurora"` on `<html>` and `dark` class for Tailwind
- `src/index.css` defines CSS variables for every theme (`--sb-bg`, `--sb-surface`, `--sb-text` etc.)
- `AppBackground.tsx` renders the live animated background layer matching the active theme
- Theme is persisted in `localStorage` under the key `sb_theme`

---

## 🤖 AI System

Both **AI Tutor** and **Notes AI Panel** use `src/services/gemini.ts`:

```
Request comes in
      ↓
Try Key 1 (VITE_GOOGLE_AI_API_KEY)
      │
      ├─ Success ────────────→ Return response ✅
      │
      └─ Quota / rate-limit error
              ↓
         Try Key 2 (VITE_GOOGLE_AI_API_KEY_2)
              │
              ├─ Success ──→ Return response ✅
              └─ Failure ──→ Show specific error to user ❌
```

**AI Tutor** (`/ai-tutor`):
- Multiple saved chat sessions, persisted in `localStorage`
- General mode + Note-context mode (attach any of your notes)
- Up to 10 messages of conversation history sent per request

**Notes AI Panel** (inside the editor):
- Note content sent as system instruction context
- Toolbar shortcuts: Summarize, Flashcards, Simplify, Quiz

---

## 🔑 Auth & Role Flow

```
User visits app
      ↓
Firebase Auth (Email or Google)
      ↓
auth-sync.ts → upsert profile in Supabase (profiles table)
      ↓
Profile exists?
  ├─ No  → One-time role picker (Student / Teacher) — permanent, stored in DB
  └─ Yes → Load role from Supabase → resume session
      ↓
New user? → Redirect to /profile to set username
      ↓
Show onboarding wizard (first login only)
      ↓
Normal app
```

> 📧 Password reset emails may arrive in your **Spam / Promotions** folder.

---

## 🧪 Available Scripts

```bash
npm run dev       # Start dev server → http://localhost:5173
npm run build     # Production build → ./dist
npm run preview   # Preview the production build locally
npm run lint      # TypeScript type check (zero-error gate)
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | 18 | UI framework |
| `typescript` | ~5.8 | Type safety |
| `vite` | ^6 | Build tool & dev server |
| `tailwindcss` | ^4 | Utility CSS |
| `@google/genai` | ^1.45 | Gemini AI SDK |
| `@supabase/supabase-js` | ^2 | Database, Realtime, Storage |
| `firebase` | ^12 | Firebase Authentication |
| `@tiptap/react` + extensions | ^3 | Rich text editor |
| `react-router-dom` | ^7 | Client-side routing |
| `framer-motion` | ^12 | Animations & transitions |
| `recharts` | ^3 | Charts |
| `react-markdown` | ^10 | Render AI markdown output |
| `react-syntax-highlighter` | ^16 | Code highlighting in AI chat |
| `react-resizable-panels` | ^2 | Split-pane layouts |
| `lucide-react` | ^0.561 | Icon library |
| `lottie-react` + `@lottiefiles/dotlottie-react` | latest | Animation assets |
| `html2pdf.js` | ^0.14 | PDF export from notes |
| `qrcode.react` | ^4 | QR codes for invite links |

---

## 🗺️ Roadmap

See [`15weeksPlan.md`](./15weeksPlan.md) for the full 15-week development plan.

---

## 🤝 Contributing

1. Fork this repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a clear message: `git commit -m "feat: describe your change"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request against `main`

---

## 📄 License

MIT © [Vivek Pawar](https://github.com/vivekpawar3010)
