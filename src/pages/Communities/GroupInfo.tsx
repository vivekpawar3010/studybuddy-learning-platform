import React, { useState, useEffect, useRef } from 'react';
import {
  X, UserPlus, LogOut, Trash2, Edit2,
  AlertTriangle, Check, Loader2, Bell, BellOff, Users,
  Globe, Lock, Radio, Copy, CheckCheck, ChevronDown, Camera, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatConversation } from '../../types';
import { communitiesService } from '../../services/communities-service';
import { auth } from '../../services/firebase';
import { supabase } from '../../services/supabase';
import AddMembersModal from './AddMembersModal';

// ─────────────────────────────────────────────────────────────────────────────
interface GroupInfoProps {
  chat: ChatConversation;
  onClose: () => void;
  isAdmin: boolean;
  allConversations?: ChatConversation[];
  onLeaveGroup?: (communityId: string) => void;
  onGroupUpdated?: (communityId: string, updates: { name?: string; description?: string; type?: string; avatar_url?: string | null }) => void;
}

interface Member {
  firebase_uid: string;
  full_name: string;
  avatar_url: string | null;
  username: string | null;
  role: string;
}

type CommunityDbType = 'public' | 'private' | 'broadcast';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; desc: string; badge: string }> = {
  public:    { label: 'Public',    icon: <Globe  size={12}/>, desc: 'Any member can add others', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  private:   { label: 'Private',   icon: <Lock   size={12}/>, desc: 'Only admins can add members', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  broadcast: { label: 'Broadcast', icon: <Radio  size={12}/>, desc: 'Only admins can post', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
};

// ─────────────────────────────────────────────────────────────────────────────
const GroupInfo: React.FC<GroupInfoProps> = ({
  chat,
  onClose,
  isAdmin,
  allConversations = [],
  onLeaveGroup,
  onGroupUpdated,
}) => {
  const currentUserId  = auth.currentUser?.uid;
  const communityType  = (chat.communityType || 'public') as CommunityDbType;
  const isGroup        = chat.type === 'group' || chat.type === 'broadcast';
  const isBroadcast    = chat.type === 'broadcast';

  // Any member can add in public; only admin in private
  const canAddMembers  = isAdmin || communityType === 'public';

  // ── State ────────────────────────────────────────────────────────────────
  const [members,        setMembers]        = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingId,     setRemovingId]     = useState<string | null>(null);

  const [showAddMembers,  setShowAddMembers]  = useState(false);
  const [joinRequests,    setJoinRequests]    = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [isEditing,  setIsEditing]  = useState(false);
  const [editName,   setEditName]   = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [editType,   setEditType]   = useState<'public' | 'private'>('public');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError,  setEditError]  = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isLeaving,       setIsLeaving]       = useState(false);
  const [leaveError,      setLeaveError]      = useState<string | null>(null);

  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reportSending,     setReportSending]     = useState(false);
  const [reportDone,        setReportDone]        = useState(false);

  const [muted,      setMuted]      = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Fetch members ────────────────────────────────────────────────────────
  const fetchMembers = async () => {
    if (!isGroup) return;
    setLoadingMembers(true);
    const data = await communitiesService.getCommunityMembers(chat.id);
    setMembers(data);
    setLoadingMembers(false);
  };

  const fetchJoinRequests = async () => {
    if (!isAdmin || !isGroup) return;
    setLoadingRequests(true);
    const data = await communitiesService.getJoinRequests(chat.id);
    setJoinRequests(data || []);
    setLoadingRequests(false);
  };

  useEffect(() => { 
    fetchMembers(); 
    fetchJoinRequests();
  }, [chat.id, isAdmin]);

  const handleJoinResponse = async (requestId: string, userId: string, approve: boolean) => {
    try {
      await communitiesService.respondToJoinRequest(requestId, chat.id, userId, approve);
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      if (approve) fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to process join request.');
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditName(chat.name);
    setEditDesc(chat.description || '');
    setEditType(communityType === 'private' ? 'private' : 'public');
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      let avatar_url: string | null = undefined;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `community_${chat.id}_${Date.now()}.${fileExt}`;
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

      await communitiesService.updateCommunityDetails(chat.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        type: editType,
        ...(avatar_url !== undefined && { avatar_url })
      });
      
      onGroupUpdated?.(chat.id, { 
        name: editName.trim(), 
        description: editDesc.trim(), 
        type: editType,
        ...(avatar_url !== undefined && { avatar_url })
      });
      
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveMember = async (uid: string) => {
    setRemovingId(uid);
    await communitiesService.removeMember(chat.id, uid);
    setMembers(prev => prev.filter(m => m.firebase_uid !== uid));
    setRemovingId(null);
  };

  const handleLeaveGroup = async () => {
    setIsLeaving(true);
    setLeaveError(null);
    try {
      const ok = await communitiesService.leaveGroup(chat.id);
      if (ok) { onLeaveGroup?.(chat.id); onClose(); }
    } catch (err: any) {
      setLeaveError(err?.message || 'Failed to leave. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleReport = () => {
    setReportSending(true);
    setTimeout(() => {
      setReportSending(false);
      setReportDone(true);
      setTimeout(() => { setShowReportConfirm(false); setReportDone(false); }, 1800);
    }, 900);
  };

  const handleCopyInviteCode = () => {
    if (chat.inviteCode) {
      navigator.clipboard.writeText(chat.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyInviteLink = () => {
    if (chat.inviteCode) {
      const link = `${window.location.origin}/join/community/${chat.inviteCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentMemberIds = members.map(m => m.firebase_uid);
  const dmConversations  = allConversations.filter(c => c.type === 'direct');
  const typeMeta         = TYPE_META[communityType] || TYPE_META.public;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full bg-[#f0f2f5]">

        {/* ── Top bar ── */}
        <div className="px-4 py-3.5 bg-white flex items-center gap-3 border-b border-gray-200 shrink-0">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={18}/>
          </button>
          <h2 className="text-sm font-bold text-gray-900 flex-1 truncate">
            {isGroup ? 'Group Info' : 'Contact Info'}
          </h2>
          {isAdmin && isGroup && !isEditing && (
            <button
              onClick={openEdit}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Edit2 size={13}/> Edit
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ══ HERO ══ */}
          <div className="bg-white px-6 py-6 flex flex-col items-center text-center mb-2 shadow-sm">
            <div className={`relative mb-4 ${isEditing ? 'cursor-pointer group' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              )}
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
                />
              ) : chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className={`w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md ${isEditing ? 'group-hover:opacity-60 transition-opacity' : ''}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-indigo-100 border-4 border-indigo-50 shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl uppercase ${isEditing ? 'group-hover:opacity-60 transition-opacity' : ''}`}>
                  {chat.name.slice(0, 2)}
                </div>
              )}
              {isEditing && !avatarPreview && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>

            {/* ── EDIT FORM ── */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="w-full max-w-xs space-y-3 text-left">
                <div>
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Group Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-900 border-2 border-indigo-300 rounded-xl bg-white outline-none px-3 py-2 focus:border-indigo-500 transition-colors"
                    maxLength={50}
                    required
                    autoFocus
                    placeholder="Group name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="What is this group about?"
                    rows={2}
                    maxLength={200}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl bg-white outline-none resize-none px-3 py-2 focus:border-indigo-400 transition-colors"
                  />
                </div>

                {!isBroadcast && (
                  <div>
                    <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Privacy</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['public', 'private'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditType(t)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold justify-center transition-all ${
                            editType === t
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {TYPE_META[t].icon} {TYPE_META[t].label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{TYPE_META[editType].desc}</p>
                  </div>
                )}

                {editError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                    <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5"/>
                    <p className="text-xs text-red-600">{editError}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingEdit || !editName.trim()} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:bg-indigo-200 transition-colors flex items-center justify-center gap-1.5">
                    {savingEdit ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>} Save
                  </button>
                </div>
              </form>

            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{chat.name}</h3>
                {isGroup ? (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeMeta.badge}`}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>
                    {!isBroadcast && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Users size={11}/> {loadingMembers ? '…' : members.length} member{members.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Direct Contact</p>
                )}
              </>
            )}
          </div>

          {/* ══ DESCRIPTION ══ */}
          {!isEditing && (
            <div className="bg-white px-4 py-3.5 mb-2 shadow-sm">
              <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">About</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {chat.description || 'No description provided.'}
              </p>
            </div>
          )}

          {/* ══ ADD MEMBER BUTTON — prominent card ══ */}
          {isGroup && !isEditing && canAddMembers && (
            <div className="bg-white mb-2 shadow-sm px-4 py-3">
              <button
                id="add-member-btn"
                onClick={() => setShowAddMembers(true)}
                className="w-full flex items-center gap-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl transition-all shadow-md shadow-indigo-200 font-bold text-sm"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <UserPlus size={17}/>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold">Add Member</p>
                  <p className="text-[10px] text-indigo-200 font-normal">Search, contacts or invite link</p>
                </div>
                <ChevronDown size={15} className="opacity-70 rotate-[-90deg]"/>
              </button>

              {/* Invite code quick copy (admin only for public groups) */}
              {isAdmin && chat.inviteCode && communityType === 'public' && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 font-medium flex-1 truncate">
                    Code: <span className="font-mono text-gray-700">{chat.inviteCode}</span>
                  </span>
                  <button
                    onClick={handleCopyInviteCode}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors border-r border-gray-200 pr-2"
                  >
                    {copiedCode ? <><CheckCheck size={11}/> Copied</> : <><Copy size={11}/> Code</>}
                  </button>
                  <button
                    onClick={handleCopyInviteLink}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors pl-1"
                  >
                    {copiedLink ? <><CheckCheck size={11}/> Link Copied</> : <><Link2 size={11}/> Link</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ JOIN REQUESTS ══ */}
          {isAdmin && isGroup && !isEditing && joinRequests.length > 0 && (
            <div className="bg-amber-50 mx-4 mb-4 rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-100 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus size={12}/> Pending Requests
                </h4>
                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {joinRequests.length}
                </span>
              </div>
              <div className="divide-y divide-amber-100">
                {joinRequests.map(req => (
                  <div key={req.id} className="p-4 flex items-center gap-3">
                    {req.profiles?.avatar_url ? (
                      <img src={req.profiles.avatar_url} className="w-9 h-9 rounded-full object-cover border border-amber-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                        {(req.profiles?.full_name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-900 truncate">{req.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-[9px] text-amber-600 truncate">@{req.profiles?.username || 'user'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleJoinResponse(req.id, req.user_id, true)}
                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                        title="Approve"
                      >
                        <Check size={14}/>
                      </button>
                      <button 
                        onClick={() => handleJoinResponse(req.id, req.user_id, false)}
                        className="p-1.5 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ QUICK ACTIONS ══ */}
          {!isEditing && (
            <div className="bg-white mb-2 shadow-sm divide-y divide-gray-50">
              <button
                onClick={() => setMuted(m => !m)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-gray-700">
                  {muted ? <BellOff size={16} className="text-gray-400"/> : <Bell size={16} className="text-indigo-500"/>}
                  <span className="text-xs font-semibold">{muted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${muted ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                  {muted ? 'Muted' : 'On'}
                </span>
              </button>
            </div>
          )}

          {/* ══ MEMBERS LIST ══ */}
          {isGroup && !isEditing && (
            <div className="bg-white mb-2 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  {loadingMembers ? 'Members' : `${members.length} Member${members.length !== 1 ? 's' : ''}`}
                </h4>
              </div>

              <div className="divide-y divide-gray-50">
                {loadingMembers ? (
                  <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-indigo-500"/></div>
                ) : members.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users size={24} className="text-gray-300 mx-auto mb-2"/>
                    <p className="text-xs text-gray-400">No members found</p>
                    {canAddMembers && (
                      <button onClick={() => setShowAddMembers(true)} className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-colors">
                        Add first member
                      </button>
                    )}
                  </div>
                ) : (
                  <AnimatePresence>
                    {members.map(member => {
                      const isSelf = member.firebase_uid === currentUserId;
                      const isAdm  = member.role === 'admin';
                      const avatar = member.avatar_url;

                      return (
                        <motion.div
                          key={member.firebase_uid}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          {avatar ? (
                            <img src={avatar} alt={member.full_name} className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0" referrerPolicy="no-referrer"/>
                          ) : (
                            <div className="w-9 h-9 rounded-full border border-gray-100 shrink-0 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                              {member.full_name.slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {member.full_name}
                              {isSelf && <span className="ml-1 text-indigo-400 font-normal text-[10px]">(You)</span>}
                            </p>
                            {member.username && <p className="text-[10px] text-gray-400 truncate">@{member.username}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAdm && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded border border-indigo-100 uppercase tracking-wide">
                                Admin
                              </span>
                            )}
                            {/* Admin can remove others */}
                            {isAdmin && !isSelf && (
                              <button
                                onClick={() => handleRemoveMember(member.firebase_uid)}
                                disabled={removingId === member.firebase_uid}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title={`Remove ${member.full_name}`}
                              >
                                {removingId === member.firebase_uid
                                  ? <Loader2 size={13} className="animate-spin"/>
                                  : <Trash2  size={13}/>}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

          {/* ══ DANGER ZONE ══ */}
          {!isEditing && (
            <div className="bg-white shadow-sm mb-6 divide-y divide-gray-50">
              {isGroup && (
                <button
                  id="exit-group-btn"
                  onClick={() => setShowExitConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16}/>
                  <div className="text-left">
                    <p className="text-xs font-semibold">Exit Group</p>
                    <p className="text-[10px] text-red-400">Leave and stop receiving messages</p>
                  </div>
                </button>
              )}
              <button
                id="report-btn"
                onClick={() => setShowReportConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-4 text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <AlertTriangle size={16}/>
                <div className="text-left">
                  <p className="text-xs font-semibold">Report {isGroup ? 'Group' : 'Contact'}</p>
                  <p className="text-[10px] text-orange-400">Flag for moderation review</p>
                </div>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ════ AddMembers Modal ════ */}
      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        communityId={chat.id}
        communityName={chat.name}
        communityType={communityType}
        inviteCode={chat.inviteCode}
        currentMemberIds={currentMemberIds}
        dmConversations={dmConversations}
        onMemberAdded={fetchMembers}
      />

      {/* ════ Exit Confirm ════ */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
                  <LogOut size={20}/>
                </div>
                <h3 className="text-base font-bold text-gray-900">Exit "{chat.name}"?</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2 ml-[52px]">
                You'll leave this group and stop receiving messages. An admin can re-add you later.
              </p>
              {leaveError && <p className="text-xs text-red-500 ml-[52px] mb-2">{leaveError}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowExitConfirm(false); setLeaveError(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Stay
                </button>
                <button
                  onClick={handleLeaveGroup}
                  disabled={isLeaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:bg-red-300 transition-colors flex items-center justify-center gap-2"
                >
                  {isLeaving ? <Loader2 size={15} className="animate-spin"/> : <LogOut size={14}/>} Exit Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ Report Confirm ════ */}
      <AnimatePresence>
        {showReportConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              {reportDone ? (
                <div className="py-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                    <Check size={24}/>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Report Submitted</p>
                  <p className="text-xs text-gray-400 mt-1">Our team will review it shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                      <AlertTriangle size={20}/>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Report {isGroup ? 'Group' : 'Contact'}?</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-[52px] mb-4">This flags "<strong>{chat.name}</strong>" for moderation review. No immediate action is taken.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowReportConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={reportSending}
                      className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {reportSending ? <Loader2 size={14} className="animate-spin"/> : <AlertTriangle size={13}/>} Report
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupInfo;
