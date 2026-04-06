import React, { useState } from 'react';
import { Bell, Moon, Lock, User, LogOut, Calendar, Globe, ShieldCheck, CheckCircle, Smartphone, GraduationCap, Briefcase, RotateCcw, ChevronRight, X, Play, Plus, AlertCircle } from 'lucide-react';
import { runBackendTests, seedRealisticData } from '../services/testBackend';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface SettingsProps {
  role: 'student' | 'teacher';
  onRoleChange: (role: 'student' | 'teacher') => void;
}

const Settings: React.FC<SettingsProps> = ({ role, onRoleChange }) => {
  const [activeTab, setActiveTab] = useState('Account');
  const [activeToggles, setActiveToggles] = useState({
    notifications: true,
    darkMode: localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark'),
    mfa: false
  });
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Vivek Pawar',
    username: 'vivekpawar',
    bio: 'Computer Science student passionate about AI and Web Development. Always learning and building.',
    location: 'Mumbai, India',
    education: 'IIT Bombay',
    github: 'vivekpawar93',
    linkedin: 'vivekpawar93'
  });
  const [editForm, setEditForm] = useState(profileData);
  const [roleForm, setRoleForm] = useState({
    targetRole: role === 'student' ? 'teacher' : 'student' as 'student' | 'teacher',
    reason: '',
    idNumber: '',
    department: '',
    confirm: false
  });

  const toggle = (key: keyof typeof activeToggles) => {
    const newValue = !activeToggles[key];
    setActiveToggles(prev => ({ ...prev, [key]: newValue }));
    
    if (key === 'darkMode') {
      if (newValue) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    }

    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const handleChangeRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.confirm) return;
    
    onRoleChange(roleForm.targetRole);
    setIsChangingRole(false);
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData(editForm);
    setIsEditingProfile(false);
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const handlePasswordReset = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      setPasswordResetSent(true);
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordResetSent(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Failed to send password reset email. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <>
            {/* Profile Card */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Profile Information</h4>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-6">
                <div className="relative group">
                  <div className="size-20 rounded-2xl border-2 border-white dark:border-gray-600 shadow-md group-hover:opacity-80 transition-opacity bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl uppercase">
                    {profileData.name.slice(0, 2)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Plus size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{profileData.name}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {role === 'student' ? 'Scholar' : 'Educator'} • @{profileData.username}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-1.5">
                      {role === 'student' ? <GraduationCap size={14} /> : <Briefcase size={14} />}
                      {role === 'student' ? 'Student Account' : 'Teacher Account'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditForm(profileData);
                    setIsEditingProfile(true);
                  }}
                  className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-gray-100 dark:shadow-none"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Role Change */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Account Type</h4>
              <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      Switch to {role === 'student' ? 'Teacher' : 'Student'}
                    </h3>
                    <p className="text-indigo-100 text-xs mt-1 font-medium max-w-[240px]">
                      Unlock specialized tools and dashboards for your new role.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsChangingRole(true)}
                    className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
                  >
                    Request Switch
                  </button>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">App Preferences</h4>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
                <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><Calendar size={20}/></div>
                    <div>
                      <span className="text-gray-900 dark:text-white font-bold text-sm block">Week Start</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Calendar View</span>
                    </div>
                  </div>
                  <select className="text-[10px] bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-4 py-2 font-black text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors uppercase tracking-widest">
                    <option>Monday</option>
                    <option>Sunday</option>
                  </select>
                </div>

                <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => toggle('darkMode')}>
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${activeToggles.darkMode ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                      <Moon size={20}/>
                    </div>
                    <div>
                      <span className="text-gray-900 dark:text-white font-bold text-sm block">Dark Mode</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Appearance</span>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all p-1 ${activeToggles.darkMode ? 'bg-indigo-600 shadow-inner' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    <div className={`size-4 bg-white rounded-full shadow-md transition-transform ${activeToggles.darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      case 'Notifications':
        return (
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Notification Settings</h4>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
              <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => toggle('notifications')}>
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${activeToggles.notifications ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    <Bell size={20}/>
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-bold text-sm block">Push Notifications</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Alerts & Updates</span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all p-1 ${activeToggles.notifications ? 'bg-indigo-600 shadow-inner' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`size-4 bg-white rounded-full shadow-md transition-transform ${activeToggles.notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>
          </section>
        );
      case 'Security':
        return (
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Security & Privacy</h4>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
              <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setIsChangingPassword(true)}>
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center"><Lock size={20}/></div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-bold text-sm block">Change Password</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Update your credentials</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          </section>
        );
      case 'Developer':
        return (
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Developer Tools</h4>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
              <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={runBackendTests}>
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center"><Play size={20}/></div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-bold text-sm block">Run Backend Tests</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verify database connections</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
              <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={seedRealisticData}>
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center"><Plus size={20}/></div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-bold text-sm block">Seed Realistic Data</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Populate app with sample content</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          </section>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Globe size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section Coming Soon</h3>
            <p className="text-sm text-gray-500 max-w-[240px] mt-1">We're working hard to bring you more customization options.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your account, preferences, and security</p>
        </div>
        {showSavedMsg && (
          <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle size={12} />
            <span>Changes Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {[
            { icon: User, label: 'Account' },
            { icon: Bell, label: 'Notifications' },
            { icon: ShieldCheck, label: 'Security' },
            { icon: RotateCcw, label: 'Developer' },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.label 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {activeTab === item.label && <ChevronRight size={16} className="ml-auto opacity-70" />}
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {renderContent()}

          {/* Danger Zone */}
          <section className="pt-4">
            <button className="w-full py-5 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] bg-white dark:bg-gray-800 border-2 border-dashed border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 transition-all flex items-center justify-center gap-3 active:scale-[0.99] group">
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span>Logout StudyBuddy</span>
            </button>
          </section>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Profile</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Update your public information</p>
              </div>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Username</label>
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Bio</label>
                <textarea 
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Location</label>
                  <input 
                    type="text" 
                    value={editForm.location}
                    onChange={e => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Education</label>
                  <input 
                    type="text" 
                    value={editForm.education}
                    onChange={e => setEditForm({...editForm, education: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">GitHub Username</label>
                  <input 
                    type="text" 
                    value={editForm.github}
                    onChange={e => setEditForm({...editForm, github: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">LinkedIn ID</label>
                  <input 
                    type="text" 
                    value={editForm.linkedin}
                    onChange={e => setEditForm({...editForm, linkedin: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Change Password</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Secure your account</p>
              </div>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {passwordResetSent ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center space-y-3">
                  <div className="size-12 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Reset Email Sent!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Please check your inbox at {auth.currentUser?.email} to reset your password.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                      For security reasons, we will send a password reset link to your registered email address.
                    </p>
                  </div>
                  <button 
                    onClick={handlePasswordReset}
                    className="w-full py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                  >
                    Send Reset Link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {isChangingRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Request Role Switch</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Switch to {roleForm.targetRole} account</p>
              </div>
              <button onClick={() => setIsChangingRole(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleChangeRole} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Reason for Switch</label>
                <textarea 
                  required
                  value={roleForm.reason}
                  onChange={e => setRoleForm({...roleForm, reason: e.target.value})}
                  placeholder="Tell us why you want to switch roles..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">ID Number / Verification</label>
                <input 
                  required
                  type="text" 
                  value={roleForm.idNumber}
                  onChange={e => setRoleForm({...roleForm, idNumber: e.target.value})}
                  placeholder="Enter your student/teacher ID"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <input 
                  type="checkbox" 
                  id="confirm-role"
                  checked={roleForm.confirm}
                  onChange={e => setRoleForm({...roleForm, confirm: e.target.checked})}
                  className="mt-1 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="confirm-role" className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                  I understand that switching roles will change my dashboard and available features.
                </label>
              </div>

              <button 
                type="submit"
                disabled={!roleForm.confirm}
                className="w-full py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
