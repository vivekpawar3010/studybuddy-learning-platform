import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Users, ShieldAlert, Camera } from 'lucide-react';
import { communitiesService } from '../../services/communities-service';
import { supabase } from '../../services/supabase';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      let avatar_url = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `community_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatar_url = publicUrl;
      }

      const result = await communitiesService.createCommunity(name, description, type, avatar_url);
      if (result) {
        onSuccess();
        onClose();
        setName('');
        setDescription('');
        setType('public');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setError('Failed to create community. Check your internet or login status.');
      }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.error?.message || JSON.stringify(err);
      setError(`Database Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Create Community</h2>
                    <p className="text-xs text-gray-500">Form a new study group</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer group"
                  >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed ${avatarPreview ? 'border-transparent' : 'border-gray-300 bg-gray-50 group-hover:bg-gray-100'} transition-all`}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-indigo-500">
                          <Camera size={24} />
                          <span className="text-[10px] font-bold mt-1">Add Icon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CS101 Advanced Study Group"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-sm"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this community about?"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-sm resize-none"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-semibold text-gray-700">Community Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('public')}
                      className={`p-3 rounded-xl border text-left transition-all ${type === 'public' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className={type === 'public' ? 'text-indigo-600' : 'text-gray-500'} />
                        <span className={`text-sm font-bold ${type === 'public' ? 'text-indigo-900' : 'text-gray-700'}`}>Public</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-tight">Anyone can join and view.</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setType('private')}
                      className={`p-3 rounded-xl border text-left transition-all ${type === 'private' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert size={16} className={type === 'private' ? 'text-indigo-600' : 'text-gray-500'} />
                        <span className={`text-sm font-bold ${type === 'private' ? 'text-indigo-900' : 'text-gray-700'}`}>Private</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-tight">Requires an invite link.</p>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center min-w-[120px]"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateCommunityModal;
