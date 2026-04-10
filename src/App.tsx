import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Auth from './pages/Auth';
import OnboardingWizard from './components/OnboardingWizard';
import LoadingScreen from './components/LoadingScreen';
import NotFound404 from './pages/NotFound404';
import { onAuthChange, signOut as firebaseSignOut } from './services/firebase';
import { syncUserToSupabase, setUserRoleInDB } from './services/auth-sync';
import { shouldShowOnboarding, markOnboardingComplete, isNewUser } from './services/onboarding-service';
import { User } from 'firebase/auth';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';

// Pages — eager (small, needed immediately)
import Home from './pages/Home';
import Settings from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage';
import CommunityJoinPage from './pages/Communities/CommunityJoinPage';

// Pages — lazy loaded (heavy, not needed on first render)
const MyNotes      = lazy(() => import('./pages/MyNotes'));
const TestsQuizzes = lazy(() => import('./pages/TestsQuizzes'));
const Communities  = lazy(() => import('./pages/Communities'));
const AITutor      = lazy(() => import('./pages/AITutor'));
const ProfilePage  = lazy(() => import('./pages/ProfilePage'));

import { GraduationCap, Briefcase, Sparkles, Search, LogOut, Loader2 } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import AppBackground from './components/AppBackground';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted]   = useState(false);
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHints, setShowHints] = useState(false);

  // Role state — loaded from Supabase, never from just localStorage
  const [userRole, setUserRole]         = useState<'student' | 'teacher' | null>(null);
  const [selectingRole, setSelectingRole] = useState(false); // saving to DB
  const [roleError, setRoleError]       = useState<string | null>(null);

  const { unreadCount } = useNotifications();

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await syncUserToSupabase(firebaseUser);

        // Load role from Supabase profile (source of truth)
        if (profile?.role) {
          setUserRole(profile.role as 'student' | 'teacher');
          // Keep localStorage in sync for fast reads
          localStorage.setItem('studyBuddyRole', profile.role);
        } else {
          // Role not set yet — role picker will show
          setUserRole(null);
          localStorage.removeItem('studyBuddyRole');
        }

        // Redirect new users who haven't set up their profile yet
        if (profile?.isNewUser && (!profile?.username || profile?.username === '')) {
          navigate('/profile');
        }

        // Onboarding
        const needsOnboarding = await shouldShowOnboarding(firebaseUser.uid);
        setShowOnboarding(needsOnboarding);
        const newUserStatus = await isNewUser(firebaseUser.uid);
        setShowHints(newUserStatus);
      }
      setLoading(false);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Called once from role-picker screen — persists to Supabase permanently
  const handleSelectRole = async (role: 'student' | 'teacher') => {
    if (!user) return;
    setSelectingRole(true);
    setRoleError(null);
    try {
      await setUserRoleInDB(user.uid, role);
      setUserRole(role);
      localStorage.setItem('studyBuddyRole', role);
    } catch (err: any) {
      setRoleError(err.message || 'Failed to set role. Please try again.');
    } finally {
      setSelectingRole(false);
    }
  };

  const handleNavigate = (page: string) => {
    const pageToPath: Record<string, string> = {
      'Dashboard': '/',
      'My Notes': '/notes',
      'Tests': '/tests',
      'Communities': '/communities',
      'AI Tutor': '/ai-tutor',
      'Settings': '/settings',
      'Notifications': '/notifications',
      'Profile': '/profile'
    };
    navigate(pageToPath[page] || '/');
    setIsCommandPaletteOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('studyBuddyRole');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getCurrentPageName = () => {
    const pathToPage: Record<string, string> = {
      '/': 'Dashboard',
      '/notes': 'My Notes',
      '/tests': 'Tests',
      '/communities': 'Communities',
      '/ai-tutor': 'AI Tutor',
      '/settings': 'Settings',
      '/notifications': 'Notifications',
      '/profile': 'Profile'
    };
    return pathToPage[location.pathname] || 'Dashboard';
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <LoadingScreen
        message="Loading StudyBuddy..."
        subtitle="Setting up your workspace"
        variant="fullscreen"
      />
    );
  }

  // ── Not logged in ────────────────────────────────────────────
  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(true)} />;
  }

  // ── Role not yet set → one-time role picker ──────────────────
  if (!userRole && mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40
                      flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-100/50
                        max-w-md w-full overflow-hidden">

          {/* Top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center
                            justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles size={26} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Welcome to StudyBuddy</h1>
            <p className="text-sm text-slate-500 mb-2">
              Choose your role to personalise your experience.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200
                            text-amber-700 text-[11px] font-bold px-3 py-1.5 rounded-full mb-8">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4H7V5h2v3z"/>
              </svg>
              This choice is permanent and cannot be changed later
            </div>

            <div className="space-y-3 mb-8">
              {/* Student */}
              <button
                onClick={() => handleSelectRole('student')}
                disabled={selectingRole}
                className="group w-full p-5 bg-white border-2 border-slate-200
                           hover:border-blue-400 hover:bg-blue-50/40 rounded-2xl
                           transition-all text-left flex items-center gap-4
                           disabled:opacity-50 disabled:cursor-wait active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl
                                flex items-center justify-center text-blue-600 flex-shrink-0
                                transition-colors">
                  <GraduationCap size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900">I'm a Student</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Learn, track progress, take tests, and collaborate in study groups.
                  </p>
                </div>
                {selectingRole ? (
                  <Loader2 size={18} className="animate-spin text-blue-500 ml-auto flex-shrink-0" />
                ) : (
                  <div className="ml-auto w-5 h-5 rounded-full border-2 border-slate-200
                                  group-hover:border-blue-400 flex-shrink-0 transition-colors" />
                )}
              </button>

              {/* Teacher */}
              <button
                onClick={() => handleSelectRole('teacher')}
                disabled={selectingRole}
                className="group w-full p-5 bg-white border-2 border-slate-200
                           hover:border-indigo-400 hover:bg-indigo-50/40 rounded-2xl
                           transition-all text-left flex items-center gap-4
                           disabled:opacity-50 disabled:cursor-wait active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl
                                flex items-center justify-center text-indigo-600 flex-shrink-0
                                transition-colors">
                  <Briefcase size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900">I'm a Teacher</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create assessments, manage classes, and oversee student progress.
                  </p>
                </div>
                {selectingRole ? (
                  <Loader2 size={18} className="animate-spin text-indigo-500 ml-auto flex-shrink-0" />
                ) : (
                  <div className="ml-auto w-5 h-5 rounded-full border-2 border-slate-200
                                  group-hover:border-indigo-400 flex-shrink-0 transition-colors" />
                )}
              </button>
            </div>

            {/* Error */}
            {roleError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700
                              text-xs font-semibold rounded-xl text-left">
                ⚠️ {roleError}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors
                         flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogOut size={13} /> Sign out of {user.email}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFullWidthPage = location.pathname === '/notes' || location.pathname === '/communities';

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <AppBackground />
      <Header activePage={getCurrentPageName()} onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} notifCount={unreadCount} />

      <main className="flex-1 overflow-hidden flex flex-col min-h-0" style={{ backgroundColor: 'var(--sb-surface)' }}>
        <div className={`${isFullWidthPage ? 'flex-1 w-full flex flex-col overflow-hidden min-h-0' : 'max-w-7xl mx-auto p-3 md:p-4 lg:p-6 overflow-y-auto w-full'}`}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-40">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home onNavigate={handleNavigate} />} />
              <Route path="/notes" element={<MyNotes />} />
              <Route path="/tests" element={<TestsQuizzes role={userRole || 'student'} />} />
              <Route path="/communities" element={<Communities role={userRole || 'student'} />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              {/* Settings no longer receives onRoleChange — role is immutable */}
              <Route path="/settings" element={<Settings role={userRole || 'student'} />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage role={userRole || 'student'} />} />
              <Route path="/join/community/:inviteCode" element={<CommunityJoinPage />} />
              <Route path="*" element={<NotFound404 />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/20 backdrop-blur-sm" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search size={16} className="text-gray-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
              />
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Navigation</div>
              {['Dashboard', 'My Notes', 'AI Tutor', 'Communities', 'Tests'].map(page => (
                <button
                  key={page}
                  onClick={() => handleNavigate(page)}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Go to {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Wizard */}
      {showOnboarding && user && (
        <OnboardingWizard
          onComplete={async () => {
            setShowOnboarding(false);
            setShowHints(false);
            await markOnboardingComplete(user.uid);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
