import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Search, X, AlertTriangle } from 'lucide-react';
import { ChatConversation, ChatMessage } from '../../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { motion, AnimatePresence } from 'framer-motion';
import { communitiesService } from '../../services/communities-service';
import { auth } from '../../services/firebase';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  chat: ChatConversation;
  onBack: () => void;
  onToggleInfo: () => void;
  isMobile: boolean;
  onStatusChange?: (convId: string, status: 'accepted' | 'blocked') => void;
  onNewMessage?: (convId: string, preview: string, time: string) => void;
}

// Groups messages by date for date separators
const getDateLabel = (isoDate: string): string => {
  const d = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack, onToggleInfo, isMobile, onStatusChange, onNewMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchMessages = async () => {
      setLoading(true);
      const isDirect = chat.type === 'direct';
      const data = await communitiesService.getCommunityMessages(chat.id, isDirect);
      setMessages(data);
      setLoading(false);

      // Start real-time listener after initial fetch
      unsubscribe = communitiesService.subscribeToMessages(chat.id, (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) {
            // Replace temp/optimistic message with real one
            return prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg, status: 'sent' as const } : m);
          }
          // New incoming message from the other user
          const incoming = { ...newMsg, status: 'sent' as const };
          // Notify parent to update sidebar preview
          onNewMessage?.(chat.id, newMsg.content, newMsg.timestamp);
          return [...prev, incoming];
        });
      }, isDirect);
    };

    fetchMessages();
    setSearchOpen(false);
    setSearchTerm('');

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string, type: 'text' | 'note' | 'file' | 'link' = 'text', extra?: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Optimistic UI — add message with 'sending' status immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: userId,
      senderName: 'Me',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString(),
      type,
      status: 'sending',
      ...extra
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      let finalMetadata = { ...extra };
      let finalContent = content;

      if (type === 'file' && extra?.file) {
        const uploadResult = await communitiesService.uploadFile(extra.file);
        finalMetadata = { ...finalMetadata, fileUrl: uploadResult.url, fileName: uploadResult.name };
        finalContent = uploadResult.name;
        delete finalMetadata.file;
      }

      const isDirect = chat.type === 'direct';
      const saved = await communitiesService.sendMessage(chat.id, userId, finalContent, type, finalMetadata, isDirect);

      // Replace temp message with the real one from DB
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: saved.id, status: 'sent', content: finalContent, ...finalMetadata }
          : m
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark as failed
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const handleUpdateStatus = async (status: 'accepted' | 'blocked') => {
    const success = await communitiesService.updateConversationStatus(chat.id, status);
    if (success && onStatusChange) {
      onStatusChange(chat.id, status);
    }
    setShowBlockConfirm(false);
  };

  // Filtered messages for in-chat search
  const displayMessages = searchTerm
    ? messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  // Build date-grouped message list
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

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2] relative overflow-hidden min-h-0">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'url("https://w0.peakpx.com/wallpaper/508/873/HD-wallpaper-whatsapp-background-doodles-pattern-drawings.jpg")',
          backgroundSize: '400px'
        }}
      />

      {/* Header */}
      <div className="h-[59px] px-4 bg-[#f0f2f5] flex items-center justify-between z-20 shrink-0 border-b border-[#d1d7db]">
        <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={onToggleInfo}>
          {isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="p-2 -ml-2 text-[#54656f] hover:bg-[#d1d7db] rounded-full transition-colors shrink-0"
            >
              <span className="material-icons opacity-70">arrow_back</span>
            </button>
          )}
          {chat.avatar ? (
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase shrink-0">
              {chat.name.slice(0, 2)}
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-[16px] text-[#111b21] truncate leading-5 font-medium">{chat.name}</h3>
            <p className="text-[13px] text-[#667781] truncate leading-4">
              {chat.type === 'group'
                ? 'Group · tap for info'
                : chat.type === 'broadcast'
                ? 'Broadcast Channel'
                : 'Direct Message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#54656f] shrink-0">
          <button
            onClick={() => { setSearchOpen(s => !s); setSearchTerm(''); }}
            className={`p-2 hover:bg-[#d1d7db] rounded-full transition-colors ${searchOpen ? 'bg-[#d1d7db]' : ''}`}
            title="Search messages"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <button onClick={onToggleInfo} className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* In-chat search bar */}
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
              className="w-full bg-[#f0f2f5] rounded-lg px-3 py-1.5 text-[14px] outline-none placeholder-[#8696a0] text-[#111b21]"
            />
            {searchTerm && (
              <p className="text-[12px] text-[#667781] mt-1">
                {displayMessages.length} result{displayMessages.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-[5%] md:px-[9%] py-4 custom-scrollbar z-10 relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white/80 rounded-xl px-6 py-4 shadow-sm">
              <p className="text-[14px] text-[#54656f]">No messages yet. Say hello! 👋</p>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {groupedMessages.map(group => (
                <div key={group.dateLabel}>
                  {/* Date Separator */}
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1.5 bg-white text-[#54656f] text-[12.5px] rounded-lg shadow-sm font-medium">
                      {group.dateLabel}
                    </span>
                  </div>

                  {group.messages.map((msg, index) => {
                    const isSelf = msg.senderId === auth.currentUser?.uid;
                    const prevMsg = group.messages[index - 1];
                    const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
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
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5]">
        {chat.type === 'broadcast' && chat.userRole !== 'admin' ? (
          /* Broadcast — non-admin cannot send */
          <div className="px-4 py-4 text-center">
            <p className="text-[14px] text-[#54656f] bg-white mx-auto max-w-sm rounded-[10px] py-1.5 shadow-sm">
              Only admins can send messages in this channel
            </p>
          </div>

        ) : chat.type === 'direct' && chat.status === 'blocked' ? (
          /* Blocked — neither side can send */
          <div className="px-4 py-4 text-center">
            <p className="text-[14px] text-[#ea4335] bg-white mx-auto max-w-sm rounded-[10px] py-1.5 shadow-sm font-medium">
              This conversation has been blocked.
            </p>
          </div>

        ) : chat.type === 'direct' && chat.status === 'pending' && chat.initiatorId !== auth.currentUser?.uid ? (
          /* Receiver — see messages first, then Accept/Block banner above input */
          <div>
            {/* Accept/Block banner */}
            <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {chat.avatar ? (
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase shrink-0">
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
                  className="px-4 py-1.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 text-[13px] font-medium transition-colors"
                >
                  Block
                </button>
                <button
                  onClick={() => handleUpdateStatus('accepted')}
                  className="px-5 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-[13px] font-medium transition-colors shadow-sm"
                >
                  Accept
                </button>
              </div>
            </div>
            {/* Receiver can also reply — it auto-accepts on reply in the future */}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>

        ) : (
          /* Normal send — sender (in pending or accepted) + receiver after accepting */
          <div>
            {/* Tiny hint for the sender that it's a pending request */}
            {chat.type === 'direct' && chat.status === 'pending' && chat.initiatorId === auth.currentUser?.uid && (
              <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-2 text-center">
                <p className="text-[12px] text-[#667781]">
                  ⏳ Message request sent — waiting for <strong>{chat.name}</strong> to accept
                </p>
              </div>
            )}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#111b21]">Block {chat.name}?</h3>
              </div>
              <p className="text-[14px] text-[#667781] mb-6">
                They won't be able to send you messages. You can unblock them later from settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-[#54656f] text-[14px] font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus('blocked')}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[14px] font-medium hover:bg-red-600 transition-colors"
                >
                  Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;
