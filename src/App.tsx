import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Auth from './pages/Auth';
import OnboardingWizard from './components/OnboardingWizard';
import { onAuthChange, signOut as firebaseSignOut } from './services/firebase';
import { syncUserToSupabase } from './services/auth-sync';
import { shouldShowOnboarding, markOnboardingComplete, isNewUser } from './services/onboarding-service';
import { User } from 'firebase/auth';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';

// Pages
import Home from './pages/Home';
import MyNotes from './pages/MyNotes';
import TestsQuizzes from './pages/TestsQuizzes';
import Communities from './pages/Communities';
import AITutor from './pages/AITutor';
import Settings from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import CommunityJoinPage from './pages/Communities/CommunityJoinPage';
import { GraduationCap, Briefcase, Sparkles, Search, LogOut } from 'lucide-react';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(() => {
    return localStorage.getItem('studyBuddyRole') as 'student' | 'teacher' | null;
  });

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await syncUserToSupabase(firebaseUser);
        // Force new or incomplete profiles to complete setup
        if (profile?.isNewUser || !profile?.username || profile?.username === '') {
          navigate('/profile');
        }
        // Check onboarding status
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
  }, []);

  const selectRole = (role: 'student' | 'teacher') => {
    setUserRole(role);
    localStorage.setItem('studyBuddyRole', role);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading StudyBuddy...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(true)} />;
  }

  if (!userRole && mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-md w-full text-center">
           <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-6 flex items-center justify-center text-white shadow-sm">
              <Sparkles size={24} />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">StudyBuddy AI</h1>
           <p className="text-sm text-gray-500 mb-8">Professional AI-Driven Learning Platform</p>
           
           <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => selectRole('student')}
                className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center gap-4 text-left"
              >
                 <div className="p-2.5 bg-indigo-100 rounded-md text-indigo-600 group-hover:scale-105 transition-transform">
                    <GraduationCap size={20} />
                 </div>
                 <div>
                    <h2 className="text-sm font-semibold text-gray-900">I'm a Student</h2>
                    <p className="text-xs text-gray-500">Learn, track notes, and join groups.</p>
                 </div>
              </button>

              <button 
                onClick={() => selectRole('teacher')}
                className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50/30 transition-all flex items-center gap-4 text-left"
              >
                 <div className="p-2.5 bg-blue-100 rounded-md text-blue-600 group-hover:scale-105 transition-transform">
                    <Briefcase size={20} />
                 </div>
                 <div>
                    <h2 className="text-sm font-semibold text-gray-900">I'm a Teacher</h2>
                    <p className="text-xs text-gray-500">Create tests and manage classes.</p>
                 </div>
              </button>
           </div>
           
           <button 
             onClick={handleSignOut}
             className="mt-8 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 mx-auto"
           >
             <LogOut size={14} />
             Sign out of {user.email}
           </button>
        </div>
      </div>
    );
  }

  const isFullWidthPage = location.pathname === '/notes' || location.pathname === '/communities';

  const { unreadCount } = useNotifications();

  return (
    <div className={`h-screen w-screen overflow-hidden bg-gray-50 flex flex-col transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <Header activePage={getCurrentPageName()} onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} notifCount={unreadCount} />

      <main className="flex-1 overflow-hidden bg-white flex flex-col min-h-0">
        <div className={`${isFullWidthPage ? 'flex-1 w-full flex flex-col overflow-hidden min-h-0' : 'max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto w-full'}`}>
          <Routes>
            <Route path="/" element={<Home onNavigate={handleNavigate} />} />
            <Route path="/notes" element={<MyNotes />} />
            <Route path="/tests" element={<TestsQuizzes role={userRole || 'student'} />} />
            <Route path="/communities" element={<Communities role={userRole || 'student'} />} />
            <Route path="/ai-tutor" element={<AITutor />} />
            <Route path="/settings" element={<Settings role={userRole || 'student'} onRoleChange={selectRole} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage role={userRole || 'student'} />} />
            <Route path="/join/community/:inviteCode" element={<CommunityJoinPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Command Palette Placeholder */}
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
      {/* Onboarding Wizard — first login only */}
      {showOnboarding && user && (
        <OnboardingWizard
          onComplete={async () => {
            setShowOnboarding(false);
            await markOnboardingComplete(user.uid);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  </BrowserRouter>
);

export default App;
