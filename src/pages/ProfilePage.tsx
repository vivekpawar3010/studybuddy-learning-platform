import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  GraduationCap, 
  Github, 
  Linkedin, 
  Edit3, 
  ExternalLink,
  BookOpen,
  X,
  Save,
  Trophy,
  Target,
  Clock as ClockIcon,
  Loader2,
  User as UserIcon,
  Camera
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { auth } from '../services/firebase';

interface ProfileData {
  full_name: string;
  username: string;
  bio: string;
  location: string;
  college: string;
  github: string;
  linkedin: string;
  avatar_url: string;
}

interface ProfilePageProps {
  role: 'student' | 'teacher';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ role }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    college: '',
    github: '',
    linkedin: '',
    avatar_url: ''
  });

  const [editForm, setEditForm] = useState<ProfileData>(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('firebase_uid', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          const profileData = {
            full_name: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
            location: data.location || '',
            college: data.college || '',
            github: data.github || '',
            linkedin: data.linkedin || '',
            avatar_url: data.avatar_url || ''
          };
          setProfile(profileData);
          setEditForm(profileData);
          
          // Force open edit modal if profile is completely empty
          if (!data.username || data.username.trim() === '') {
            setIsEditing(true);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      setUploadingImg(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('firebase_uid', userId);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio,
          location: editForm.location,
          college: editForm.college,
          github: editForm.github,
          linkedin: editForm.linkedin
        })
        .eq('firebase_uid', userId);

      if (error) throw error;

      setProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Avatar */}
                <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="size-28 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center relative">
                    {uploadingImg ? (
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    ) : profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'User'} 
                        className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon size={48} className="text-gray-400 group-hover:opacity-50 transition-opacity" />
                    )}
                    
                    {!uploadingImg && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </div>

                {/* Name & Username */}
                <div className="space-y-1 w-full flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.full_name || <span className="text-gray-300 italic">No Name Set</span>}
                    </h1>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {role}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {profile.username ? `@${profile.username}` : <span className="italic">No username set</span>}
                  </p>
                </div>

                {/* Bio */}
                <p className={`mt-4 text-sm leading-relaxed ${profile.bio ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                  {profile.bio || 'Please edit your profile to add a bio.'}
                </p>

                {/* Edit Button */}
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              </div>

              {/* Details Section */}
              <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <span className={`text-sm font-medium ${!profile.location ? 'text-gray-400 italic' : ''}`}>
                    {profile.location || 'Location missing'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <span className={`text-sm font-medium leading-tight ${!profile.college ? 'text-gray-400 italic' : ''}`}>
                    {profile.college || 'Education details missing'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <Github size={16} />
                  </div>
                  {profile.github ? (
                    <a 
                      href={`https://github.com/${profile.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      {profile.github}
                      <ExternalLink size={12} className="opacity-50" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No GitHub tied</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <Linkedin size={16} />
                  </div>
                  {profile.linkedin ? (
                    <a 
                      href={`https://linkedin.com/in/${profile.linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      LinkedIn Profile
                      <ExternalLink size={12} className="opacity-50" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No LinkedIn tied</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats (Disabled for Empty Users by default, but left structurally intact) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Study Statistics</h3>
            {!profile.username ? (
              <div className="text-center py-12 px-4 rounded-xl bg-gray-50 border border-gray-100 border-dashed">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Complete your profile setup to start tracking your learning progress!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100/50 opacity-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <BookOpen size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Notes Created</p>
                  </div>
                  <p className="text-4xl font-black text-indigo-700">0</p>
                  <p className="mt-2 text-[10px] text-indigo-400 font-medium">Start writing! 📝</p>
                </div>
                
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100/50 opacity-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <ClockIcon size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Study Hours</p>
                  </div>
                  <p className="text-4xl font-black text-emerald-700">0</p>
                  <p className="mt-2 text-[10px] text-emerald-400 font-medium">Time to learn 📚</p>
                </div>

                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100/50 opacity-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <Trophy size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Tests Completed</p>
                  </div>
                  <p className="text-4xl font-black text-amber-700">0</p>
                  <p className="mt-2 text-[10px] text-amber-400 font-medium">Take a quiz ✅</p>
                </div>

                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100/50 opacity-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                      <Target size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Avg. Score</p>
                  </div>
                  <p className="text-4xl font-black text-rose-700">0%</p>
                  <p className="mt-2 text-[10px] text-rose-400 font-medium">Room to grow 🎯</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Configure Profile</h3>
              {profile.username && (
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
                <input 
                  type="text" 
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username *</label>
                <input 
                  type="text" 
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="john_doe_24"
                />
                <p className="text-[10px] text-gray-400 mt-1 pl-1">Lowercase letters, numbers, and underscores only.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bio</label>
                <textarea 
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                  placeholder="Tell your classmates about yourself!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
                  <input 
                    type="text" 
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="New York, USA"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GitHub Username</label>
                  <input 
                    type="text" 
                    value={editForm.github}
                    onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="octocat"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Education/College</label>
                <input 
                  type="text" 
                  value={editForm.college}
                  onChange={(e) => setEditForm({...editForm, college: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="State University"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LinkedIn ID</label>
                <input 
                  type="text" 
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="johndoe123"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
              {profile.username && (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSave}
                disabled={isSaving || !editForm.full_name || !editForm.username}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    <Save size={16} />
                    {profile.username ? 'Save Changes' : 'Complete Setup'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
