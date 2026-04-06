import React, { useState } from 'react';
import { Search, Users, MoreVertical, PanelLeftClose, PanelLeft, MessageCirclePlus, User as UserIcon } from 'lucide-react';
import { ChatConversation } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { communitiesService } from '../../services/communities-service';
import { useNavigate } from 'react-router-dom';

interface ChatListProps {
  conversations: ChatConversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCreateGroup?: () => void;
  onStartDirectMessage?: (userId: string) => void;
  currentUser?: { full_name?: string; avatar_url?: string; username?: string } | null;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  activeChatId,
  onSelectChat,
  isCollapsed = false,
  onToggleCollapse,
  onCreateGroup,
  onStartDirectMessage,
  currentUser
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'groups' | 'direct'>('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await communitiesService.searchUsers(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = searchQuery.length === 0 || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'groups' ? (c.type === 'group' || c.type === 'broadcast') : c.type === 'direct');
    return matchesSearch && matchesFilter;
  });

  // Collapsed sidebar — just show avatar icons
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-[#f0f2f5] items-center py-4 gap-4 border-r border-[#d1d7db]">
        <button onClick={onToggleCollapse} className="p-2 text-gray-500 hover:text-gray-700 transition-colors mb-2">
          <PanelLeft size={20} />
        </button>
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-4 w-full px-2">
          {conversations.map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="relative group shrink-0 transition-transform hover:scale-105"
              title={chat.name}
            >
              {chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase shadow-sm">
                  {chat.name.slice(0, 2)}
                </div>
              )}
              {chat.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#f0f2f5]">
                  {chat.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // User avatar: real profile photo or initials fallback
  const userInitials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ME';

  return (
    <div className="flex flex-col h-full w-full bg-white border-r border-[#d1d7db] min-h-0 overflow-hidden">
      {/* Header */}
      <div className="h-[59px] bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db] shrink-0">
        <div className="flex items-center gap-3">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name || 'Me'}
              className="w-10 h-10 rounded-full object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {userInitials}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[#54656f]">
          <button
            onClick={onCreateGroup}
            className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors"
            title="New Community"
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              document.getElementById('chat-search-input')?.focus();
            }}
            className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors"
            title="New Direct Message"
          >
            <MessageCirclePlus size={20} />
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors"
            title="Settings"
          >
            <MoreVertical size={20} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors hidden md:block"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-[#d1d7db] px-3 py-2 shrink-0">
        <div className="bg-[#f0f2f5] rounded-xl flex items-center px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#d1d7db] transition-all">
          <Search size={16} className="text-[#54656f] mr-3 shrink-0" />
          <input
            id="chat-search-input"
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[15px] w-full placeholder-[#54656f] text-gray-800"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#54656f] hover:text-gray-800 transition-colors ml-1">
              <span className="text-[12px]">✕</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-2 px-1">
          {(['all', 'groups', 'direct'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-[13px] font-medium capitalize transition-colors ${
                filter === t
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {/* User search results section */}
        {searchQuery.length >= 2 && (
          <>
            {isSearching ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  People
                </div>
                {searchResults.map(user => (
                  <motion.button
                    key={`user-${user.firebase_uid}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      onStartDirectMessage?.(user.firebase_uid);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center px-4 py-3 transition-colors text-left border-b border-[#f2f2f2] last:border-0 hover:bg-[#f5f6f6]"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 mr-4"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase shrink-0 mr-4">
                        {(user.full_name || user.username || 'U').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-normal text-[#111b21] truncate">{user.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-[#667781] truncate">@{user.username || user.email}</p>
                    </div>
                    <span className="text-xs text-indigo-500 font-medium shrink-0 ml-2">Message</span>
                  </motion.button>
                ))}
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[14px] text-[#667781]">No users found for "<strong>{searchQuery}</strong>"</p>
                <p className="text-[12px] text-[#8696a0] mt-1">Try a different name, email, or username</p>
              </div>
            )}

            {/* Divider between search results and chats */}
            {filteredConversations.length > 0 && (
              <div className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-y border-gray-100">
                Chats
              </div>
            )}
          </>
        )}

        {/* Conversation list */}
        <AnimatePresence mode="popLayout">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(chat => (
              <motion.button
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={`conv-${chat.id}`}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-center px-3 py-3 transition-colors text-left border-b border-[#f2f2f2] last:border-0 ${
                  activeChatId === chat.id ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-[#f5f6f6]'
                }`}
              >
                <div className="relative shrink-0 mr-3">
                  {chat.avatar ? (
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase">
                      {chat.name.slice(0, 2)}
                    </div>
                  )}
                  {/* Pending DM indicator */}
                  {chat.type === 'direct' && chat.status === 'pending' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" title="Pending request" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[17px] font-normal text-[#111b21] truncate">{chat.name}</h3>
                    <span className={`text-xs ml-2 shrink-0 ${chat.unreadCount > 0 ? 'text-[#25d366] font-medium' : 'text-[#667781]'}`}>
                      {chat.lastMessageTime || ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}>
                      {chat.lastMessage
                        ? (chat.lastMessage.length > 50 ? chat.lastMessage.slice(0, 50) + '…' : chat.lastMessage)
                        : (chat.status === 'pending' ? '⏳ Pending request' : 'Tap to view chat')}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="w-[18px] h-[18px] bg-[#25d366] rounded-full flex items-center justify-center text-white text-[10px] font-bold ml-2 shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            searchQuery.length < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center flex flex-col items-center justify-center h-48"
              >
                <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#54656f]">
                  <Search size={24} />
                </div>
                <p className="text-[15px] text-[#667781]">No chats yet</p>
                <p className="text-[13px] text-[#8696a0] mt-1">Search for a person above to start chatting</p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatList;
