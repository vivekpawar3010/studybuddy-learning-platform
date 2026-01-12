# StudyBuddy Learning Platform

Full-stack learning platform with **Next.js** frontend and **FastAPI** backend. Backend is wired for Supabase/PostgreSQL via SQLAlchemy with a `/db-check` endpoint to verify connectivity.

---

## Project Structure

```
studybuddy-learning-platform/
├── frontend/      # Next.js 16 + Tailwind
├── backend/       # FastAPI + SQLAlchemy + Pydantic
├── docs/          # Documentation assets
├── 15weeksPlan.md # Long-term roadmap (kept as-is)
└── README.md      # You are here
```

---

## Prerequisites
- Node.js 18+ and npm
- Python 3.13
- Supabase (or PostgreSQL) connection string

---

## Backend Setup (FastAPI)
```bash
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env` (not committed):
```
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT>.supabase.co:5432/postgres
```

Run dev server:
```bash
.\.venv\Scripts\activate
python -m uvicorn app.main:app --reload
```
- API: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs
- DB check: http://127.0.0.1:8000/db-check

---

## Frontend Setup (Next.js + Firebase Auth)
```bash
cd frontend
npm install
npm run dev
```
- App: http://localhost:3000 (Next.js may select another port if busy)
- If multiple lockfiles warning appears, keep using `frontend/package-lock.json`; the root lockfile has been removed.

### Authentication (Week 2 ✅)
- **Firebase Authentication** enabled with Email/Password and Google Sign-In
- **Protected routes** via Next.js middleware and ProtectedRoute component
- **AuthContext** for global auth state management
- **Dashboard** with user info and logout functionality

For Firebase setup, see [FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md)
For testing auth flow, see [WEEK2_TESTING_GUIDE.md](WEEK2_TESTING_GUIDE.md)

---

## Environment Files
- Backend: `backend/.env` with `DATABASE_URL`
- Frontend: `frontend/.env.local` with Firebase credentials and `NEXT_PUBLIC_API_URL`
  - **Note:** Already configured with valid Firebase project credentials

---

## Useful Scripts
- Backend: `python -m uvicorn app.main:app --reload`, `pytest`
- Frontend: `npm run dev`, `npm run lint`, `npm run build`

---

## Notes on Database Connectivity
- `/db-check` performs a simple `SELECT 1` using `SQLAlchemy 2.0.36` + `psycopg2-binary`.
- If you see “could not translate host name”, re-check your `DATABASE_URL` host format (`db.<PROJECT>.supabase.co`) and credentials.

---

## Cleanups Done
- Removed unused root and backend `package-lock.json` files.
- Replaced legacy README with this consolidated guide.
- Added `.gitignore` for Python, Node, and environment files.

---

## Roadmap
- See `15weeksPlan.md` for the detailed 15-week plan (left untouched).

