# StudyBuddy — Complete Setup & Installation Guide

**Project:** StudyBuddy — AI-Powered Learning Platform  
**Author:** Vivek Pawar  
**Date:** April 2026


## 1. Project Overview

StudyBuddy is a full-stack, AI-assisted learning platform built for students and teachers. It includes:

- **My Notes** — Rich text notebook with an AI assistant
- **AI Tutor** — Multi-session Google Gemini AI chat
- **Communities** — Real-time group and broadcast chats
- **Tests & Quizzes** — Full assessment system with anti-cheat mode
- **Settings** — 6 live animated themes
- **Profile** — Avatar, bio, and social links

**Technology Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Realtime + Storage) |
| Authentication | Firebase (Email/Password + Google Sign-In) |
| AI | Google Gemini API |

---

## 2. System Requirements

Before you begin, make sure your computer has:

| Tool | Minimum Version | How to Check |
|---|---|---|
| Node.js | 18.0 or higher | Run: `node --version` |
| npm | 9.0 or higher | Run: `npm --version` |
| Internet connection | Required for first install | — |

> **Note:** If you do not have Node.js installed, continue to Step 1. If you already have it, skip to Step 2.

---

## 3. Step 1 — Install Node.js

1. Open your browser and go to: **https://nodejs.org**
2. Click the **"LTS"** version button (recommended for most users)
3. Download and run the installer for your operating system
4. Follow the installer steps — keep all default options
5. When installation is complete, open a **terminal** (Command Prompt on Windows, Terminal on Mac/Linux)
6. Type the following and press Enter to confirm installation:

```
node --version
npm --version
```

Both commands should print a version number (e.g. `v20.11.0` and `10.2.4`).

---

## 4. Step 2 — Extract the Project Files

1. Locate the project ZIP file you received — it is named **`studybuddy-learning-platform.zip`**
2. Right-click the ZIP file and choose:
   - **Windows:** "Extract All..." → choose a destination folder (e.g. your Desktop) → click **"Extract"**
   - **macOS:** Double-click the ZIP file — it extracts automatically
3. After extraction, you will see a folder named **`studybuddy-learning-platform`**
4. Open your terminal and navigate into the folder:

   **Windows (Command Prompt or PowerShell):**
   ```
   cd Desktop\studybuddy-learning-platform
   ```

   **macOS / Linux:**
   ```
   cd Desktop/studybuddy-learning-platform
   ```

5. Confirm you are in the right place — you should see a list of files:
   ```
   dir        (Windows)
   ls         (macOS / Linux)
   ```
   You should see `package.json`, `README.md`, `src`, `docs`, and other project files.

---

## 5. Step 3 — Get Your Google Gemini API Key

The Gemini API key powers the AI Tutor and the Notes AI assistant. It is **free** to create.

### 5.1 Create the Key

1. Open your browser and go to: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account (any Gmail account)
3. Click **"Create API Key"**
4. Select **"Create API key in new project"**
5. Your new API key will appear on screen — it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXX`
6. **Copy this key** and save it somewhere safe (e.g. a Notepad file)

> **Important:** Do not share this key publicly. It is tied to your Google account.

### 5.2 Optional — Second API Key (Recommended)

The free Gemini tier allows **15 requests per minute**. If you or your students use the AI heavily, you may hit this limit. Adding a second key from a different Google account gives a backup:

1. Open a different Google account (or ask a colleague)
2. Repeat the steps above to generate a second key
3. Keep both keys — you will use them in Step 7

---

## 6. Step 4 — Create a Firebase Project

Firebase handles user authentication (login, sign-up, Google Sign-In, password reset). It is **free** for this use case.

### 6.1 Create the Project

1. Go to: **https://console.firebase.google.com**
2. Sign in with your Google account
3. Click **"Add project"**
4. Enter a project name, e.g. `studybuddy-production`
5. Disable Google Analytics (not needed) and click **"Create project"**
6. Wait for setup to complete, then click **"Continue"**

### 6.2 Register a Web App

1. From the Firebase project dashboard, click the **web icon** (`</>`)
2. Enter an app nickname, e.g. `StudyBuddy Web`
3. Leave "Firebase Hosting" unchecked
4. Click **"Register app"**
5. You will see a config block like this — **copy all of these values**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "1:1234567890:web:abcdef1234"
};
```

6. Click **"Continue to console"**

### 6.3 Enable Authentication

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Under the **"Sign-in method"** tab, enable:
   - Click **"Email/Password"** → toggle **Enable** → Save
   - Click **"Google"** → toggle **Enable** → set a support email → Save
4. Click the **"Settings"** tab → **"Authorized domains"**
5. Confirm `localhost` is in the list (it should be by default)

---

## 7. Step 5 — Create a Supabase Project

Supabase is the database that stores all notes, tests, communities, profiles, and messages. It is **free** for this use case.

### 7.1 Create an Account and Project

1. Go to: **https://supabase.com**
2. Click **"Start your project"** and sign up (GitHub sign-in is easiest)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `studybuddy` (or any name you like)
   - **Database Password:** choose a strong password and **save it** somewhere safe
   - **Region:** choose the nearest region to you
5. Click **"Create new project"**
6. Wait 1–2 minutes for the project to be ready

### 7.2 Get Your API Credentials

1. In the left sidebar, click **"Project Settings"** (gear icon at the bottom)
2. Click **"API"**
3. You will see:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **Project API Keys → anon public** — a long string starting with `eyJhbGci...`
4. **Copy both values** and save them

### 7.3 Enable Storage

1. In the left sidebar, click **"Storage"**
2. Click **"Create a new bucket"**
3. Name it exactly: `avatars`
4. Check **"Public bucket"**
5. Click **"Create bucket"**

### 7.4 Enable Realtime

1. In the left sidebar, click **"Database"**
2. Click **"Replication"**
3. Find the `messages` table in the list and toggle it **ON**

---

## 8. Step 6 — Set Up the Database Schema

The database schema creates all the required tables (profiles, notebooks, pages, tests, communities, messages, etc.).

### 8.1 Run the Schema Script

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase_schema.sql` from the project folder on your computer
4. Select all the text in the file (`Ctrl+A` or `Cmd+A`)
5. Copy it (`Ctrl+C`)
6. Paste it into the Supabase SQL Editor
7. Click **"Run"** (or press `Ctrl+Enter`)
8. Wait for the success message: `Success. No rows returned`

### 8.2 (Optional) Load Sample Data

If you want the app pre-loaded with sample notebooks, tests, and communities for demonstration:

1. Repeat the steps above using the file `seed_data.sql` instead

> **Note:** The `supabase_schema.sql` and `seed_data.sql` files are located in the project root folder on your computer. They are kept locally and are not uploaded to GitHub for security reasons.

---

## 9. Step 7 — Configure Environment Variables

The `.env` file tells the application your secret API keys. It is never uploaded to GitHub.

### 9.1 Create the File

1. In the project root folder, find the file named `.env.example`
2. Make a copy of it and rename the copy to `.env`
   - **Windows:** Right-click → Copy → Paste → Rename
   - **Terminal:** `copy .env.example .env` (Windows) or `cp .env.example .env` (Mac/Linux)

### 9.2 Fill In the Values

Open `.env` in any text editor (Notepad, VS Code, etc.) and fill in each line:

```
# ── Google Gemini AI ─────────────────────────────────────────────
VITE_GOOGLE_AI_API_KEY=paste_your_key_1_from_step_3_here
VITE_GOOGLE_AI_API_KEY_2=paste_your_key_2_from_step_3_here

# ── Firebase ─────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY=paste_the_apiKey_from_step_4_here
VITE_FIREBASE_AUTH_DOMAIN=paste_the_authDomain_from_step_4_here
VITE_FIREBASE_PROJECT_ID=paste_the_projectId_from_step_4_here
VITE_FIREBASE_APP_ID=paste_the_appId_from_step_4_here

# ── Supabase ──────────────────────────────────────────────────────
VITE_SUPABASE_URL=paste_the_project_url_from_step_5_here
VITE_SUPABASE_ANON_KEY=paste_the_anon_key_from_step_5_here
```

### 9.3 Example of a Correctly Filled .env File

```
VITE_GOOGLE_AI_API_KEY=AIzaSyBP1QlaqRqAsPPV-OP8IKuH7B9xqDtemyE
VITE_GOOGLE_AI_API_KEY_2=AIzaSyAnotherKeyFromSecondAccount123456
VITE_FIREBASE_API_KEY=AIzaSyBcXEdsIVqM4u6BCX3XbJT6ZbMfDFXqhLs
VITE_FIREBASE_AUTH_DOMAIN=studybuddy-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studybuddy-ai
VITE_FIREBASE_APP_ID=1:646205170420:web:54337a370815f054c6f4a1
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Important:** Do not add quotes around the values. Do not leave any value blank (except `VITE_GOOGLE_AI_API_KEY_2` which is optional).

---

## 10. Step 8 — Install Dependencies & Run

### 10.1 Install Packages

In your terminal, make sure you are inside the project folder, then run:

```bash
npm install
```

This downloads all required packages. It may take 1–3 minutes depending on your internet speed.

### 10.2 Start the Application

```bash
npm run dev
```

You will see output like:

```
  VITE v6.x.x  ready in 400 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

### 10.3 Open in Browser

Open your browser and go to: **http://localhost:3000**

The StudyBuddy login screen will appear.

> **To stop the server:** Press `Ctrl + C` in the terminal.

---

## 11. Step 9 — First Login & Role Selection

### 11.1 Create an Account

1. On the login screen, click **"Sign up"**
2. Enter your email address and a password (minimum 6 characters)
3. Click **"Create Account"**

Alternatively, click **"Sign in with Google"** for one-click setup.

### 11.2 Select Your Role

On your very first login, you will be asked to choose a role:

- **Student** — Access notes, AI tutor, communities, and take tests
- **Teacher** — Create and manage tests, view student submissions, all student features

> **Important:** This choice is permanent and cannot be changed later. Choose carefully.

### 11.3 Set Up Your Profile

After selecting your role, you will be redirected to the Profile page to set a username.

### 11.4 Onboarding Wizard

A guided 4-step wizard will appear to walk you through the platform's main features. Click **"Next"** through each step to complete it.

---

## 12. Troubleshooting

### "API quota exceeded" error in AI Tutor

This means your Gemini API key has hit its free-tier limit (15 requests per minute).

**Solutions:**
- Wait 1 minute and try again
- Add a second API key (`VITE_GOOGLE_AI_API_KEY_2` in your `.env` file) — the app will switch to it automatically
- The free tier resets every minute — it is not a permanent block

### Login not working / Google Sign-In error

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Confirm `localhost` is listed
3. If using a deployed URL instead of localhost, add that URL to the list

### Messages not updating in real-time

1. Go to Supabase Dashboard → Database → Replication
2. Confirm the `messages` table toggle is ON

### "relation does not exist" or database errors

This means the schema was not run correctly.

1. Go to Supabase → SQL Editor
2. Run the contents of `supabase_schema.sql` again

### AI Tutor shows blank / no response

1. Check your `.env` file — make sure `VITE_GOOGLE_AI_API_KEY` has a valid key with no quotes
2. Restart the dev server after any `.env` changes: stop with `Ctrl+C`, then run `npm run dev` again
3. Open browser DevTools (F12) → Console tab — the error message will be shown there

### npm install fails

Make sure Node.js 18+ is installed:
```bash
node --version
```
If it shows a version below 18, reinstall Node.js from https://nodejs.org

---

## 13. Summary Checklist

Use this checklist to confirm everything is set up correctly before running the app:

| # | Task | Done? |
|---|---|---|
| 1 | Node.js 18+ installed | ☐ |
| 2 | ZIP file extracted into project folder | ☐ |
| 3 | Google Gemini API Key obtained | ☐ |
| 4 | Firebase project created | ☐ |
| 5 | Firebase Email/Password authentication enabled | ☐ |
| 6 | Firebase Google authentication enabled | ☐ |
| 7 | Firebase Web App registered and config copied | ☐ |
| 8 | Supabase project created | ☐ |
| 9 | Supabase URL and anon key copied | ☐ |
| 10 | Supabase `avatars` storage bucket created (public) | ☐ |
| 11 | Supabase Realtime enabled for `messages` table | ☐ |
| 12 | `supabase_schema.sql` executed in SQL Editor | ☐ |
| 13 | `.env` file created from `.env.example` | ☐ |
| 14 | All 8 values filled in `.env` file | ☐ |
| 15 | `npm install` completed successfully | ☐ |
| 16 | `npm run dev` running — app opens on http://localhost:3000 | ☐ |
| 17 | Created an account and selected a role | ☐ |

---

*If you encounter any issue not covered in this guide, check the browser DevTools console (F12 → Console) for the exact error message — it will identify the problem precisely.*

---

**StudyBuddy — Setup Guide v1.0 | April 2026**
