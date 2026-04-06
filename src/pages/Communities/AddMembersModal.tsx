import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Users, UserPlus, Check, Loader2,
  MessageCircle, AlertCircle, RefreshCw, Link2, Copy, CheckCheck, ExternalLink
} from 'lucide-react';
import { communitiesService } from '../../services/communities-service';
import { ChatConversation } from '../../types';
import { auth } from '../../services/firebase';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  communityType: 'public' | 'private' | 'broadcast';   // DB privacy type
  inviteCode?: string;                                   // for share-link tab
  currentMemberIds: string[];
  dmConversations: ChatConversation[];     // contacts from DMs
  onMemberAdded: () => void;
}

type Tab = 'search' | 'contacts' | 'link';

const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  communityId,
  communityName,
  communityType,
  inviteCode,
  currentMemberIds,
  dmConversations,
  onMemberAdded,
}) => {
  const currentUserId = auth.currentUser?.uid;

  const [tab, setTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [adding, setAdding]             = useState<Record<string, boolean>>({});
  const [added,  setAdded]              = useState<Record<string, boolean>>({});
  const [error,  setError]              = useState<string | null>(null);
  const [copiedLink, setCopiedLink]     = useState(false);

  // ── Invite link ─────────────────────────────────────────────────────
  const inviteLink = inviteCode
    ? `${window.location.origin}/join/community/${inviteCode}`
    : `${window.location.origin}/join/community/${communityId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // ── Contacts from DMs ────────────────────────────────────────────────
  const contacts = dmConversations
    .filter(c => c.type === 'direct')
    .map(c => {
      const otherUserId = currentUserId
        ? (c.members.find(id => id !== currentUserId) ?? c.members[0])
        : c.members[0];
      return { firebase_uid: otherUserId, full_name: c.name, avatar_url: c.avatar };
    })
    .filter((c, i, self) => c.firebase_uid && self.findIndex(x => x.firebase_uid === c.firebase_uid) === i)
    .filter(c => !currentMemberIds.includes(c.firebase_uid));

  // ── Search debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'search' || searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await communitiesService.searchUsers(searchQuery);
        setSearchResults(res.filter((u: any) =>
          !currentMemberIds.includes(u.firebase_uid) && u.firebase_uid !== currentUserId
        ));
      } catch { /* silent */ }
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, tab, currentMemberIds, currentUserId]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTab('search');
      setSearchQuery('');
      setSearchResults([]);
      setAdded({});
      setError(null);
      setCopiedLink(false);
    }
  }, [isOpen]);

  // ── Add handler ──────────────────────────────────────────────────────
  const handleAdd = async (userId: string, name: string) => {
    if (!userId) { setError('Could not resolve user ID.'); return; }
    setAdding(prev => ({ ...prev, [userId]: true }));
    setError(null);
    try {
      await communitiesService.addMemberDirectly(communityId, userId);
      setAdded(prev => ({ ...prev, [userId]: true }));
      onMemberAdded();
    } catch (err: any) {
      setError(err?.message || `Failed to add ${name}. Please try again.`);
    } finally {
      setAdding(prev => ({ ...prev, [userId]: false }));
    }
  };

  // ── Row renderer ─────────────────────────────────────────────────────
  const renderUser = (user: { firebase_uid: string; full_name: string; avatar_url?: string | null; username?: string | null }) => {
    const isAdded  = added[user.firebase_uid];
    const isAdding = adding[user.firebase_uid];
    const avatar   = user.avatar_url;

    return (
      <div key={user.firebase_uid} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
        {avatar ? (
          <img src={avatar} alt={user.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 rounded-full border border-gray-100 shrink-0 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
            {(user.full_name || 'U').slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || 'Unknown'}</p>
          {user.username && <p className="text-xs text-gray-500 truncate">@{user.username}</p>}
        </div>
        <button
          onClick={() => handleAdd(user.firebase_uid, user.full_name)}
          disabled={isAdding || isAdded}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
            isAdded  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' :
            isAdding ? 'bg-indigo-200 text-indigo-400 cursor-wait' :
                       'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {isAdding ? <Loader2 size={12} className="animate-spin" /> :
           isAdded  ? <><Check size={12}/> Added</> :
                      <><UserPlus size={12}/> Add</>}
        </button>
      </div>
    );
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'search',   label: 'Search',    icon: <Search size={14}/> },
    { key: 'contacts', label: 'Contacts',  icon: <MessageCircle size={14}/> },
    { key: 'link',     label: 'Invite Link', icon: <Link2 size={14}/> },
  ].filter(t => t.key !== 'link' || communityType === 'public') as { key: Tab; label: string; icon: React.ReactNode }[];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
          >

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Users size={18}/>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Add Members</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">to {communityName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18}/>
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-100 bg-gray-50">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearchQuery(''); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
                    tab === t.key
                      ? 'text-indigo-600 border-indigo-600 bg-white'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.key === 'contacts' && contacts.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {contacts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Error Banner ── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mt-3 px-3 py-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                    <span className="flex-1 font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600"><X size={12}/></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Body ── */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">

              {/* ─ Search Tab ─ */}
              {tab === 'search' && (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <Search size={15} className="text-gray-400 shrink-0"/>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search by name, email or @username…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-800"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <X size={13}/>
                        </button>
                      )}
                    </div>
                  </div>

                  {isSearching ? (
                    <div className="py-12 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin"/>
                      <p className="text-xs text-gray-400">Searching…</p>
                    </div>
                  ) : searchQuery.length < 2 ? (
                    <div className="py-10 text-center px-6">
                      <Search size={28} className="text-gray-200 mx-auto mb-3"/>
                      <p className="text-sm font-medium text-gray-500">Search for anyone</p>
                      <p className="text-xs text-gray-400 mt-1">Type at least 2 characters to find users by name, email or username</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-10 text-center px-6">
                      <p className="text-sm font-medium text-gray-600">No results for "<strong>{searchQuery}</strong>"</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different name or email</p>
                      <button onClick={() => setSearchQuery('')} className="mt-3 flex items-center gap-1 mx-auto text-xs text-indigo-500 hover:text-indigo-700">
                        <RefreshCw size={11}/> Clear search
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                      </div>
                      {searchResults.map(u => renderUser(u))}
                    </>
                  )}
                </>
              )}

              {/* ─ Contacts Tab ─ */}
              {tab === 'contacts' && (
                contacts.length === 0 ? (
                  <div className="py-12 text-center px-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                      <MessageCircle size={24}/>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No contacts available</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      People you've DM'd who aren't in this group will appear here.
                    </p>
                    <button
                      onClick={() => setTab('search')}
                      className="mt-4 px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-colors"
                    >
                      Search for people instead
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                      <Check size={12} className="text-amber-600 shrink-0"/>
                      <p className="text-xs text-amber-700 font-medium">Members join immediately — they can leave anytime.</p>
                    </div>
                    {contacts.map(c => renderUser(c))}
                  </>
                )
              )}

              {/* ─ Invite Link Tab ─ */}
              {tab === 'link' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Link2 size={20}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Share Invite Link</p>
                      <p className="text-xs text-gray-500">Anyone with this link can request to join</p>
                    </div>
                  </div>

                  {/* Link display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                    <Link2 size={14} className="text-gray-400 shrink-0"/>
                    <p className="text-xs text-gray-600 truncate flex-1 font-mono">{inviteLink}</p>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={handleCopyLink}
                    className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      copiedLink
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-[0.98]'
                    }`}
                  >
                    {copiedLink ? <><CheckCheck size={16}/> Copied!</> : <><Copy size={15}/> Copy Link</>}
                  </button>

                  {communityType === 'public' ? (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <ExternalLink size={12}/> Public Group
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Anyone with this link can join directly without admin approval.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                        <ExternalLink size={12}/> Private Group
                      </p>
                      <p className="text-xs text-indigo-600 mt-0.5">
                        The link sends a join request — an admin must approve it.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-[11px] text-gray-400 text-center">
                {communityType === 'private'
                  ? '🔒 Private group — only admins can add members directly.'
                  : '🌐 Public group — any member can add others.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddMembersModal;
