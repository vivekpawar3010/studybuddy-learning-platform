"use client";

import Link from "next/link";

const statusPills = [
  { label: "Auth ready", color: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30" },
  { label: "Protected routes", color: "bg-blue-500/10 text-blue-200 border border-blue-500/30" },
  { label: "DB check endpoint", color: "bg-amber-500/10 text-amber-200 border border-amber-500/30" },
];

const featureCards = [
  { icon: "🔐", title: "Firebase Auth", text: "Email/Google sign-in with protected routes." },
  { icon: "🗄️", title: "Supabase DB", text: "FastAPI + SQLAlchemy connected to PostgreSQL." },
  { icon: "⚡", title: "Next.js 16 + Tailwind", text: "Turbopack dev server with responsive UI." },
];

const quickLinks = [
  { label: "Frontend", status: "Running locally", url: "http://localhost:3000" },
  { label: "Backend", status: "FastAPI + /db-check", url: "http://127.0.0.1:8000" },
  { label: "Docs", status: "See README + docs/WEEK1_COMPLETE.md", url: "docs/WEEK1_COMPLETE.md" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            Week 2 • Auth + DB wiring • Ready to demo
          </span>
          <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
            StudyBuddy — Your AI-powered learning companion
          </h1>
          <p className="max-w-3xl text-base text-slate-200 md:text-lg">
            Sign up, explore your dashboard, and keep learning with Firebase auth and a FastAPI backend wired
            for Supabase/PostgreSQL.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-400"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800/50"
            >
              Sign In
            </Link>
            <Link
              href="https://github.com/vivekpawar3010/studybuddy-learning-platform"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-900/60 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-100 transition hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-500/20"
            >
              Repo & Docs
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {statusPills.map((pill) => (
              <span key={pill.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.color}`}>
                {pill.label}
              </span>
            ))}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/30 transition hover:-translate-y-1 hover:shadow-blue-500/20"
            >
              <div className="text-3xl">{card.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{card.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/30 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Week 2 verification checklist</h2>
            <ol className="space-y-2 text-sm text-slate-200">
              <li>1) Sign up or sign in (Google works too) and land on the dashboard.</li>
              <li>2) Hit <code className="rounded bg-slate-800 px-1">/dashboard</code> while logged out — expect redirect.</li>
              <li>3) Close and reopen the app — session should persist.</li>
              <li>4) Backend <code className="rounded bg-slate-800 px-1">/db-check</code> reflects your Supabase <code className="rounded bg-slate-800 px-1">DATABASE_URL</code> status.</li>
            </ol>
            <div className="mt-3 grid gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
              <div className="font-semibold text-slate-50">Dev commands</div>
              <div className="grid gap-1 text-xs text-slate-300">
                <div>Frontend: <code className="rounded bg-slate-800 px-1">npm run dev</code></div>
                <div>Backend: <code className="rounded bg-slate-800 px-1">python -m uvicorn app.main:app --reload</code></div>
                <div>DB check: <code className="rounded bg-slate-800 px-1">http://127.0.0.1:8000/db-check</code></div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200">
            <div className="font-semibold text-slate-100">Backend status</div>
            <p className="mt-1 text-slate-300">
              Ensure <code className="rounded bg-slate-800 px-1">DATABASE_URL</code> uses Supabase format:
              <code className="rounded bg-slate-800 px-1"> postgresql://postgres:&lt;PASSWORD&gt;@db.&lt;PROJECT&gt;.supabase.co:5432/postgres</code>.
            </p>
            <p className="mt-2 text-slate-300">
              Then restart uvicorn and re-run <code className="rounded bg-slate-800 px-1">/db-check</code>. Swagger is at{" "}
              <code className="rounded bg-slate-800 px-1">/docs</code>.
            </p>
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-blue-900/40 bg-blue-950/30 p-6 shadow-lg shadow-blue-900/30 md:grid-cols-3">
          {quickLinks.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 text-sm">
              <p className="text-slate-200">{item.label}</p>
              <p className="text-lg font-semibold text-white">{item.status}</p>
              <p className="text-xs text-blue-200 break-all">{item.url}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
