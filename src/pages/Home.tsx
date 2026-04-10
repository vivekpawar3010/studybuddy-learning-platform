import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, FlaskConical, Users, Bot,
  Zap, Sparkles, FileText, ArrowRight,
  AlertCircle, Plus, MessageSquare, GraduationCap,
  ChevronRight, Save
} from 'lucide-react';
import { auth } from '../services/firebase';
import { supabase } from '../services/supabase';

// ─── Types ─────────────────────────────────────────────────────
interface DashboardData {
  userName: string;
  role: string;
  notebookCount: number;
  pageCount: number;
  communityCount: number;
  recentPages: { id: string; title: string; notebookTitle: string; notebookColor: string; updatedAt: string }[];
  tests: { id: string; title: string; subject: string; duration: number; status: string }[];
  communities: { id: string; name: string; type: string; memberCount: number }[];
  activeAttempt: { id: string; testTitle: string; timeRemaining: number | null } | null;
}

interface HomeProps { onNavigate: (page: string) => void; }

// ─── Helpers ───────────────────────────────────────────────────
const NOTEBOOK_COLORS: Record<string, string> = {
  '#10b981': 'bg-emerald-100 text-emerald-700',
  '#6366f1': 'bg-indigo-100 text-indigo-700',
  '#f59e0b': 'bg-amber-100 text-amber-700',
  '#3b82f6': 'bg-blue-100 text-blue-700',
  '#ec4899': 'bg-pink-100 text-pink-700',
  '#8b5cf6': 'bg-violet-100 text-violet-700',
};
const nbColor = (hex: string) => NOTEBOOK_COLORS[hex] ?? 'bg-blue-100 text-blue-700';

function timeAgo(ts: string): string {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtMin(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ─── Skeleton ──────────────────────────────────────────────────
const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-5 pb-8">
    {/* Hero */}
    <Sk className="h-28 rounded-2xl" />
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <Sk className="w-10 h-10 rounded-xl" />
          <Sk className="h-7 w-16" />
          <Sk className="h-3 w-24" />
        </div>
      ))}
    </div>
    {/* Main grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Sk className="lg:col-span-2 h-64 rounded-2xl" />
      <div className="space-y-5">
        <Sk className="h-36 rounded-2xl" />
        <Sk className="h-24 rounded-2xl" />
      </div>
    </div>
    <Sk className="h-32 rounded-2xl" />
  </div>
);

// ─── Sub-components ────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ElementType; label: string; value: number | string;
  sub: string; iconBg: string; iconColor: string; onClick?: () => void;
}> = ({ icon: Icon, label, value, sub, iconBg, iconColor, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left bg-white border border-slate-200 rounded-2xl p-5
               hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={17} className={iconColor} />
      </div>
      <ArrowRight size={13} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
    </div>
    <p className="text-2xl font-bold text-slate-900 mb-0.5 tabular-nums">{value}</p>
    <p className="text-sm font-medium text-slate-600 leading-tight">{label}</p>
    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
  </button>
);

const Empty: React.FC<{
  icon: React.ElementType; title: string; desc: string;
  cta?: string; onCta?: () => void;
}> = ({ icon: Icon, title, desc, cta, onCta }) => (
  <div className="flex flex-col items-center py-9 text-center px-4">
    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
      <Icon size={18} className="text-blue-400" />
    </div>
    <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
    <p className="text-xs text-slate-400 mb-4 max-w-[180px]">{desc}</p>
    {cta && onCta && (
      <button
        onClick={onCta}
        className="flex items-center gap-1 text-xs font-semibold text-blue-600
                   border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
      >
        <Plus size={11} />{cta}
      </button>
    )}
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────
const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    const uid = user.uid;

    // ── 5 queries fired simultaneously ──────────────────────────
    const [profileRes, notebooksRes, memberRes, testsRes, attemptRes] =
      await Promise.all([
        supabase.from('profiles')
          .select('full_name, role')
          .eq('firebase_uid', uid)
          .maybeSingle(),

        supabase.from('notebooks')
          .select('id, title, color')
          .eq('user_id', uid),

        // join communities directly
        supabase.from('community_members')
          .select('community_id, communities(id, name, type)')
          .eq('user_id', uid)
          .limit(3),

        supabase.from('tests')
          .select('id, title, subject, duration, status')
          .eq('status', 'published')
          .limit(5),

        supabase.from('test_attempts')
          .select('id, time_remaining, tests(title)')
          .eq('student_id', uid)
          .eq('status', 'in_progress')
          .maybeSingle(),
      ]);

    const notebooks  = notebooksRes.data ?? [];
    const nbIds      = notebooks.map(n => n.id);
    const notebookMap = Object.fromEntries(notebooks.map(n => [n.id, n]));

    // ── 2 queries in parallel (depends on nbIds) ─────────────────
    const [sectionsRes, pagesCountRes] = await Promise.all([
      nbIds.length > 0
        ? supabase.from('sections').select('id, notebook_id').in('notebook_id', nbIds)
        : Promise.resolve({ data: [] as any[] }),
      // empty placeholder, pages counted after we have section IDs
      Promise.resolve(null),
    ]);

    const sections   = sectionsRes.data ?? [];
    const secIds     = sections.map((s: any) => s.id);
    const sectionMap = Object.fromEntries(sections.map((s: any) => [s.id, s.notebook_id]));

    // ── 2 more parallel: recent pages + all pages count ──────────
    const [recentRes, allPagesRes, memberCountsRes] = await Promise.all([
      secIds.length > 0
        ? supabase.from('pages')
            .select('id, title, section_id, updated_at')
            .in('section_id', secIds)
            .order('updated_at', { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [] as any[] }),

      secIds.length > 0
        ? supabase.from('pages').select('id', { count: 'exact', head: true }).in('section_id', secIds)
        : Promise.resolve({ count: 0, data: [] }),

      // Get member counts for all joined communities in ONE query using group-by trick:
      // We pull all members for the communities we belong to, then count in JS
      (memberRes.data ?? []).length > 0
        ? supabase.from('community_members')
            .select('community_id')
            .in('community_id', (memberRes.data ?? []).map((m: any) => m.community_id).filter(Boolean))
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Build community member count map in JS (no extra round trips)
    const countMap: Record<string, number> = {};
    for (const row of (memberCountsRes.data ?? []) as any[]) {
      countMap[row.community_id] = (countMap[row.community_id] ?? 0) + 1;
    }

    const communities = (memberRes.data ?? [])
      .filter((m: any) => m.communities)
      .slice(0, 3)
      .map((m: any) => ({
        id:          m.communities.id,
        name:        m.communities.name,
        type:        m.communities.type,
        memberCount: countMap[m.communities.id] ?? 0,
      }));

    const recentPages = (recentRes.data ?? []).map((p: any) => {
      const nbId = sectionMap[p.section_id];
      const nb   = notebookMap[nbId];
      return {
        id:            p.id,
        title:         p.title,
        notebookTitle: nb?.title      ?? 'Notebook',
        notebookColor: nb?.color      ?? '#3b82f6',
        updatedAt:     p.updated_at,
      };
    });

    const profile = profileRes.data;
    const attempt = attemptRes.data as any;

    setData({
      userName:       profile?.full_name?.split(' ')[0] ?? user.displayName?.split(' ')[0] ?? 'there',
      role:           profile?.role ?? 'student',
      notebookCount:  notebooks.length,
      pageCount:      allPagesRes.count ?? 0,
      communityCount: (memberRes.data ?? []).length,
      recentPages,
      tests: (testsRes.data ?? []).map((t: any) => ({
        id:       t.id,
        title:    t.title,
        subject:  t.subject ?? '',
        duration: t.duration,
        status:   t.status,
      })),
      communities,
      activeAttempt: attempt ? {
        id:            attempt.id,
        testTitle:     attempt.tests?.title ?? 'Untitled Test',
        timeRemaining: attempt.time_remaining,
      } : null,
    });

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <DashboardSkeleton />;

  const d = data;
  const g = greeting();

  return (
    <div className="space-y-5 pb-8">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl
                      bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
                      px-6 py-7 md:px-8 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-48 h-24 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-1">{g} 👋</p>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-snug">
              {d?.userName ? `Welcome back, ${d.userName}!` : 'Welcome back!'}
            </h1>
            <p className="text-blue-200 text-xs mt-1.5 max-w-sm">
              {d?.role === 'teacher'
                ? `${d?.tests.length ?? 0} active test${d?.tests.length !== 1 ? 's' : ''} published.`
                : `${d?.notebookCount ?? 0} notebook${d?.notebookCount !== 1 ? 's' : ''} · ${d?.pageCount ?? 0} pages of notes.`}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => onNavigate('My Notes')}
              className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-xs
                         px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
            >
              <BookOpen size={14} /> Open Notes
            </button>
            <button
              onClick={() => onNavigate('AI Tutor')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white
                         font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
            >
              <Bot size={14} /> Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Test Alert ────────────────────────────────────── */}
      {d?.activeAttempt && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <AlertCircle size={17} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 truncate">{d.activeAttempt.testTitle}</p>
            <p className="text-xs text-amber-600">
              {d.activeAttempt.timeRemaining != null
                ? `${fmtMin(Math.ceil(d.activeAttempt.timeRemaining / 60))} remaining`
                : 'In progress'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('Tests')}
            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200
                       px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1"
          >
            Resume <ChevronRight size={11} />
          </button>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}      label="Notebooks"       value={d?.notebookCount ?? 0}     sub={`${d?.pageCount ?? 0} total pages`}       iconBg="bg-blue-50"    iconColor="text-blue-600"   onClick={() => onNavigate('My Notes')} />
        <StatCard icon={FileText}      label="Pages"           value={d?.pageCount ?? 0}          sub="across all subjects"                        iconBg="bg-indigo-50"  iconColor="text-indigo-600" onClick={() => onNavigate('My Notes')} />
        <StatCard icon={Users}         label="Communities"     value={d?.communityCount ?? 0}     sub="groups joined"                              iconBg="bg-sky-50"     iconColor="text-sky-600"    onClick={() => onNavigate('Communities')} />
        <StatCard
          icon={d?.role === 'teacher' ? GraduationCap : FlaskConical}
          label={d?.role === 'teacher' ? 'Tests Created' : 'Available Tests'}
          value={d?.tests.length ?? 0}
          sub={d?.role === 'teacher' ? 'published' : 'ready to take'}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          onClick={() => onNavigate('Tests')}
        />
      </div>

      {/* ── Main 2‑col Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Notes ── spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Pages</h2>
            </div>
            <button
              onClick={() => onNavigate('My Notes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              All <ChevronRight size={13} />
            </button>
          </div>

          {(!d?.recentPages?.length) ? (
            <Empty icon={BookOpen} title="No pages yet" desc="Create your first notebook and start writing."
                   cta="Open Notes" onCta={() => onNavigate('My Notes')} />
          ) : (
            <div className="divide-y divide-slate-50">
              {d.recentPages.map(p => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('My Notes')}
                  className="w-full flex items-center gap-3.5 px-5 py-3 hover:bg-blue-50/40
                             transition-colors text-left group"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${nbColor(p.notebookColor)}`}>
                    <FileText size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{p.notebookTitle}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(p.updatedAt)}</span>
                  <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex border-t border-slate-100">
            <button
              onClick={() => onNavigate('My Notes')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold
                         text-blue-600 hover:bg-blue-50 border-r border-slate-100 transition-colors"
            >
              <Plus size={12} /> New Note
            </button>
            <button
              onClick={() => onNavigate('AI Tutor')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold
                         text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Sparkles size={12} /> AI Summary
            </button>
          </div>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-5">

          {/* Tests */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-violet-600" />
                <h2 className="text-sm font-bold text-slate-900">Tests</h2>
              </div>
              <button
                onClick={() => onNavigate('Tests')}
                className="text-xs font-semibold text-blue-600 flex items-center gap-0.5"
              >
                All <ChevronRight size={13} />
              </button>
            </div>

            {(!d?.tests?.length) ? (
              <Empty icon={FlaskConical} title="No tests"
                     desc={d?.role === 'teacher' ? 'Create a test.' : 'No tests published yet.'} />
            ) : (
              <div className="divide-y divide-slate-50">
                {d.tests.slice(0, 4).map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => onNavigate('Tests')}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-violet-50/40 transition-colors text-left"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0
                      ${i % 3 === 0 ? 'bg-violet-100 text-violet-700' : i % 3 === 1 ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'}`}>
                      {t.subject ? t.subject.substring(0, 2).toUpperCase() : `T${i + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{fmtMin(t.duration)}</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                      live
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Tutor CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot size={15} className="text-blue-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">AI Tutor</span>
              </div>
              <p className="text-sm font-bold mb-1">Need help studying?</p>
              <p className="text-xs text-blue-200 mb-4 leading-relaxed">
                Ask questions, get explanations, generate quizzes instantly.
              </p>
              <button
                onClick={() => onNavigate('AI Tutor')}
                className="w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25
                           border border-white/20 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Zap size={13} /> Start a Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Communities ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">My Communities</h2>
          </div>
          <button
            onClick={() => onNavigate('Communities')}
            className="text-xs font-semibold text-blue-600 flex items-center gap-0.5"
          >
            All <ChevronRight size={13} />
          </button>
        </div>

        {(!d?.communities?.length) ? (
          <Empty icon={Users} title="No communities" desc="Join a study group to collaborate with others."
                 cta="Explore" onCta={() => onNavigate('Communities')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-100">
            {d.communities.map((c, i) => (
              <button
                key={c.id}
                onClick={() => onNavigate('Communities')}
                className="group bg-white px-5 py-4 hover:bg-sky-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${i % 3 === 0 ? 'bg-blue-100 text-blue-700' : i % 3 === 1 ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{c.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{c.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Users size={9} /> {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}
                  </span>
                  <MessageSquare size={11} className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'New Note',  icon: BookOpen,      page: 'My Notes',     cls: 'text-blue-600   bg-blue-50   hover:bg-blue-100   border-blue-100'   },
          { label: 'Take Test', icon: FlaskConical,  page: 'Tests',        cls: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-100' },
          { label: 'Chat',      icon: MessageSquare, page: 'Communities',  cls: 'text-sky-600    bg-sky-50    hover:bg-sky-100    border-sky-100'    },
          { label: 'Ask AI',    icon: Bot,           page: 'AI Tutor',     cls: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100' },
        ] as const).map(({ label, icon: Icon, page, cls }) => (
          <button
            key={label}
            onClick={() => onNavigate(page)}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border
                        text-sm font-semibold transition-all ${cls}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

    </div>
  );
};

export default Home;