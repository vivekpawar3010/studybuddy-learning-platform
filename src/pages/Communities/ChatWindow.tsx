import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Search, X, ArrowDown } from 'lucide-react';
import { ChatConversation, ChatMessage } from '../../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { motion, AnimatePresence } from 'framer-motion';
import { communitiesService } from '../../services/communities-service';
import { auth } from '../../services/firebase';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

interface ChatWindowProps {
  chat: ChatConversation;
  onBack: () => void;
  onToggleInfo: () => void;
  isMobile: boolean;
  onStatusChange?: (convId: string, status: 'accepted' | 'blocked') => void;
  onNewMessage?: (convId: string, preview: string, time: string) => void;
}

const getDateLabel = (isoDate: string): string => {
  const d = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

// Threshold (px from bottom) below which we consider the user "at the bottom"
const SCROLL_THRESHOLD = 120;

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat, onBack, onToggleInfo, isMobile, onStatusChange, onNewMessage,
}) => {
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  // Number of unread messages that arrived while scrolled up
  const [newMsgCount, setNewMsgCount]   = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef           = useRef<HTMLDivElement>(null);
  // Track whether we are near the bottom so we know when to auto-scroll
  const isAtBottomRef       = useRef(true);
  // Set of IDs we've already processed so the real-time subscription
  // doesn't duplicate messages we just sent (optimistic)
  const knownTempIds        = useRef<Set<string>>(new Set());

  // ── Scroll helpers ────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    setNewMsgCount(0);
  }, []);

  const checkIfAtBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom <= SCROLL_THRESHOLD;
    if (isAtBottomRef.current) setNewMsgCount(0);
  }, []);

  // ── Load + subscribe ──────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      setLoading(true);
      setMessages([]);
      setNewMsgCount(0);
      knownTempIds.current.clear();

      const isDirect = chat.type === 'direct';
      const data = await communitiesService.getCommunityMessages(chat.id, isDirect);
      setMessages(data);
      setLoading(false);

      // Scroll instantly on initial load (no animation needed)
      requestAnimationFrame(() => scrollToBottom('instant' as ScrollBehavior));

      // ── Real-time: only append genuinely new messages ─────────
      unsubscribe = communitiesService.subscribeToMessages(chat.id, (newMsg) => {
        setMessages(prev => {
          // 1. If this is our own optimistic message coming back — replace it
          const tempMatch = prev.find(
            m => m.id.startsWith('temp-') && m.senderId === newMsg.senderId
              && m.content === newMsg.content
          );
          if (tempMatch) {
            // Remove from knownTempIds so we don't re-block future real msgs
            knownTempIds.current.delete(tempMatch.id);
            return prev.map(m =>
              m.id === tempMatch.id ? { ...newMsg, status: 'sent' as const } : m
            );
          }

          // 2. Already have this exact ID
          if (prev.some(m => m.id === newMsg.id)) {
            return prev.map(m =>
              m.id === newMsg.id ? { ...m, ...newMsg, status: 'sent' as const } : m
            );
          }

          // 3. Genuinely new message from another user
          onNewMessage?.(chat.id, newMsg.content, newMsg.timestamp);

          if (!isAtBottomRef.current) {
            setNewMsgCount(c => c + 1);
          }

          return [...prev, { ...newMsg, status: 'sent' as const }];
        });

        // Auto-scroll only if already at the bottom
        if (isAtBottomRef.current) {
          requestAnimationFrame(() => scrollToBottom('smooth'));
        }
      }, isDirect);
    };

    init();
    setSearchOpen(false);
    setSearchTerm('');

    return () => unsubscribe?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  // ── Send ──────────────────────────────────────────────────────
  const handleSendMessage = async (
    content: string,
    type: 'text' | 'note' | 'file' | 'link' = 'text',
    extra?: any
  ) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const tempId = `temp-${Date.now()}`;
    knownTempIds.current.add(tempId);

    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: userId,
      senderName: 'Me',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString(),
      type,
      status: 'sending',
      ...extra,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    // Always scroll when you send your own message
    requestAnimationFrame(() => scrollToBottom('smooth'));

    try {
      let finalMeta = { ...extra };
      let finalContent = content;

      if (type === 'file' && extra?.file) {
        const up = await communitiesService.uploadFile(extra.file);
        finalMeta = { ...finalMeta, fileUrl: up.url, fileName: up.name };
        finalContent = up.name;
        delete finalMeta.file;
      }

      const isDirect = chat.type === 'direct';
      const saved = await communitiesService.sendMessage(
        chat.id, userId, finalContent, type, finalMeta, isDirect
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...m, id: saved.id, status: 'sent' as const, content: finalContent, ...finalMeta }
            : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, status: 'error' as const } : m)
      );
    }
  };

  const handleUpdateStatus = async (status: 'accepted' | 'blocked') => {
    const ok = await communitiesService.updateConversationStatus(chat.id, status);
    if (ok && onStatusChange) onStatusChange(chat.id, status);
    setShowBlockConfirm(false);
  };

  // ── Derived ───────────────────────────────────────────────────
  const displayMessages = searchTerm
    ? messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const groupedMessages: { dateLabel: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  displayMessages.forEach(msg => {
    const label = msg.date ? getDateLabel(msg.date) : 'Today';
    if (label !== currentDate) {
      currentDate = label;
      groupedMessages.push({ dateLabel: label, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2] relative overflow-hidden min-h-0">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #a0a0a0 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="h-[59px] px-4 bg-[#f0f2f5] flex items-center justify-between z-20 shrink-0 border-b border-[#d1d7db]">
        <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={onToggleInfo}>
          {isMobile && (
            <button
              onClick={e => { e.stopPropagation(); onBack(); }}
              className="p-2 -ml-2 text-[#54656f] hover:bg-[#d1d7db] rounded-full transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {chat.avatar ? (
            <img src={chat.avatar} alt={chat.name}
                 className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center
                            text-indigo-600 font-bold text-sm uppercase shrink-0">
              {chat.name.slice(0, 2)}
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-[15px] text-[#111b21] truncate leading-5 font-semibold">{chat.name}</h3>
            <p className="text-[12px] text-[#667781] truncate leading-4">
              {chat.type === 'group' ? 'Group · tap for info'
                : chat.type === 'broadcast' ? 'Broadcast Channel'
                : 'Direct Message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#54656f] shrink-0">
          <button
            onClick={() => { setSearchOpen(s => !s); setSearchTerm(''); }}
            className={`p-2 hover:bg-[#d1d7db] rounded-full transition-colors ${searchOpen ? 'bg-[#d1d7db]' : ''}`}
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
          <button onClick={onToggleInfo} className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors">
            <MoreVertical size={19} />
          </button>
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-[#d1d7db] px-4 py-2 z-20 shrink-0 overflow-hidden"
          >
            <input
              autoFocus
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#f0f2f5] rounded-lg px-3 py-1.5 text-[14px] outline-none
                         placeholder-[#8696a0] text-[#111b21]"
            />
            {searchTerm && (
              <p className="text-[11px] text-[#667781] mt-1">
                {displayMessages.length} result{displayMessages.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages area ──────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={checkIfAtBottom}
        className="flex-1 overflow-y-auto px-[5%] md:px-[9%] py-4 z-10 relative"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#c1c1c1 transparent' }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white/80 rounded-xl px-6 py-4 shadow-sm">
              <p className="text-[14px] text-[#54656f]">No messages yet. Say hello! 👋</p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map(group => (
              <div key={group.dateLabel}>
                {/* Date separator */}
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-white/90 text-[#54656f] text-[11.5px]
                                   rounded-lg shadow-sm font-medium">
                    {group.dateLabel}
                  </span>
                </div>

                {group.messages.map((msg, index) => {
                  const isSelf       = msg.senderId === auth.currentUser?.uid;
                  const prevMsg      = group.messages[index - 1];
                  const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      layout
                    >
                      <MessageBubble
                        message={msg}
                        isSelf={isSelf}
                        isConsecutive={!!isConsecutive}
                        showSenderName={chat.type !== 'direct' && !isSelf && !isConsecutive}
                        onSenderClick={onToggleInfo}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Scroll-to-bottom FAB ────────────────────────────────── */}
      <AnimatePresence>
        {newMsgCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-20 right-5 z-30 flex items-center gap-1.5
                       bg-white text-[#111b21] text-[12px] font-semibold
                       px-3 py-2 rounded-full shadow-lg border border-[#d1d7db]
                       hover:bg-[#f0f2f5] transition-colors"
          >
            <ArrowDown size={14} className="text-indigo-600" />
            {newMsgCount} new
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input area ─────────────────────────────────────────── */}
      <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5]">
        {chat.type === 'broadcast' && chat.userRole !== 'admin' ? (
          <div className="px-4 py-3 text-center">
            <p className="text-[13px] text-[#54656f] bg-white mx-auto max-w-sm rounded-[10px] py-1.5 shadow-sm">
              Only admins can send messages in this channel
            </p>
          </div>

        ) : chat.type === 'direct' && chat.status === 'blocked' ? (
          <div className="px-4 py-3 text-center">
            <p className="text-[13px] text-red-500 bg-white mx-auto max-w-sm rounded-[10px] py-1.5 shadow-sm font-medium">
              This conversation has been blocked.
            </p>
          </div>

        ) : chat.type === 'direct' && chat.status === 'pending' && chat.initiatorId !== auth.currentUser?.uid ? (
          <div>
            <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center
                                  text-indigo-600 font-bold text-xs uppercase shrink-0">
                    {chat.name.slice(0, 2)}
                  </div>
                )}
                <p className="text-[13px] text-amber-800 font-medium truncate">
                  <strong>{chat.name}</strong> sent you a message request
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  className="px-4 py-1.5 rounded-full border border-red-300 text-red-600
                             hover:bg-red-50 text-[13px] font-medium transition-colors"
                >Block</button>
                <button
                  onClick={() => handleUpdateStatus('accepted')}
                  className="px-5 py-1.5 rounded-full bg-indigo-600 text-white
                             hover:bg-indigo-700 text-[13px] font-medium transition-colors shadow-sm"
                >Accept</button>
              </div>
            </div>
            <MessageInput onSendMessage={handleSendMessage} />
          </div>

        ) : (
          <div>
            {chat.type === 'direct' && chat.status === 'pending' && chat.initiatorId === auth.currentUser?.uid && (
              <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-1.5 text-center">
                <p className="text-[12px] text-[#667781]">
                  ⏳ Waiting for <strong>{chat.name}</strong> to accept
                </p>
              </div>
            )}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        )}
      </div>

      {/* ── Block confirm dialog ────────────────────────────────── */}
      <ConfirmDialog
        open={showBlockConfirm}
        variant="warning"
        title={`Block ${chat.name}?`}
        message="They won't be able to send you messages. You can unblock them later from settings."
        confirmLabel="Block"
        onConfirm={() => handleUpdateStatus('blocked')}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </div>
  );
};

export default ChatWindow;

