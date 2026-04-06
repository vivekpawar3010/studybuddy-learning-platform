import React, { useState, useEffect, useRef } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import GroupInfo from './GroupInfo';
import CreateCommunityModal from './CreateCommunityModal';
import { ChatConversation } from '../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Loader2, MessageSquarePlus, Users2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { communitiesService } from '../../services/communities-service';
import { auth } from '../../services/firebase';
import { syncUserToSupabase } from '../../services/auth-sync';
import { supabase } from '../../services/supabase';

interface CommunitiesProps {
  role: 'student' | 'teacher';
}

const Communities: React.FC<CommunitiesProps> = ({ role }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  const fetchCommunities = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const data = await communitiesService.getUserCommunities(userId);
      setConversations(data);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const initializeCommunities = async () => {
      setLoading(true);
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const profile = await syncUserToSupabase(firebaseUser);
        setCurrentUser(profile);
        await fetchCommunities();
      }
      setLoading(false);
    };
    initializeCommunities();

    // Subscribe to conversation status changes (e.g. pending → accepted)
    const userId = auth.currentUser?.uid;
    let convChannel: any;
    if (userId) {
      convChannel = supabase
        .channel(`conv-status:${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        }, (payload: any) => {
          const updated = payload.new;
          setConversations(prev =>
            prev.map(c => c.id === updated.id ? { ...c, status: updated.status } : c)
          );
        })
        .subscribe();
    }

    return () => {
      if (convChannel) supabase.removeChannel(convChannel);
    };
  }, []);

  const activeChat = conversations.find(c => c.id === activeChatId);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setShowGroupInfo(false);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  const handleBackToList = () => {
    setActiveChatId(null);
  };

  const handleStartDirectMessage = async (targetUserId: string) => {
    const convId = await communitiesService.startDirectMessage(targetUserId);
    if (!convId) return;

    // Check if already in our list
    const existing = conversations.find(c => c.id === convId);
    if (existing) {
      setActiveChatId(convId);
      return;
    }

    // Re-fetch to get the new conversation with full metadata
    await fetchCommunities();

    // Use functional setter to pick from the freshly fetched list
    setActiveChatId(convId);
  };

  // Local state update for DM accept/block — no full re-fetch needed
  const handleConversationStatusChange = (convId: string, newStatus: 'accepted' | 'blocked') => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, status: newStatus } : c)
    );
  };

  // Update sidebar last message preview live (called by ChatWindow when new message arrives)
  const handleNewMessage = (convId: string, preview: string, time: string) => {
    setConversations(prev =>
      prev.map(c => c.id === convId
        ? { ...c, lastMessage: preview, lastMessageTime: time, unreadCount: c.unreadCount + 1 }
        : c
      )
    );
  };

  // Remove community from sidebar after leaving
  const handleLeaveGroup = (communityId: string) => {
    setConversations(prev => prev.filter(c => c.id !== communityId));
    setActiveChatId(null);
  };

  // Sync group name/description/type/avatar in the sidebar after admin edits
  const handleGroupUpdated = (communityId: string, updates: { name?: string; description?: string; type?: string; avatar_url?: string | null }) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== communityId) return c;
        const next = { ...c };
        if (updates.name)        next.name        = updates.name;
        if (updates.description !== undefined) next.description = updates.description;
        if (updates.avatar_url !== undefined)  next.avatar = updates.avatar_url;
        // Sync communityType so GroupInfo permission check stays correct
        if (updates.type) {
          next.communityType = updates.type as 'public' | 'private' | 'broadcast';
          next.type = updates.type === 'broadcast' ? 'broadcast' : 'group';
        }
        return next as ChatConversation;
      })
    );
  };

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (isSidebarOpen) {
        panel.collapse();
      } else {
        panel.expand();
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full flex bg-white overflow-hidden relative min-h-0">
      <PanelGroup direction="horizontal" className="h-full w-full min-h-0">
        {/* Left Panel: Chat List */}
        <Panel
          ref={sidebarPanelRef}
          defaultSize={25}
          minSize={15}
          maxSize={40}
          collapsible={true}
          collapsedSize={4}
          onCollapse={() => setIsSidebarOpen(false)}
          onExpand={() => setIsSidebarOpen(true)}
          className={`${isMobile && activeChatId ? 'hidden' : ''} border-r border-gray-200 flex flex-col bg-white z-20`}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <ChatList
              conversations={conversations}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              isCollapsed={!isSidebarOpen}
              onToggleCollapse={toggleSidebar}
              onCreateGroup={() => setIsCreateModalOpen(true)}
              onStartDirectMessage={handleStartDirectMessage}
              currentUser={currentUser}
            />
          )}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize z-30" />

        {/* Right Panel: Chat Window */}
        <Panel
          defaultSize={75}
          className={`${isMobile && !activeChatId ? 'hidden' : 'flex-1'} flex flex-col bg-[#f0f2f5] relative`}
        >
          {activeChat ? (
            <div className="flex h-full overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow
                  chat={activeChat}
                  onBack={handleBackToList}
                  onToggleInfo={() => setShowGroupInfo(!showGroupInfo)}
                  isMobile={isMobile}
                  onStatusChange={handleConversationStatusChange}
                  onNewMessage={handleNewMessage}
                />
              </div>

              {/* Group Info Sidebar */}
              <AnimatePresence>
                {showGroupInfo && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-y-0 right-0 w-full md:w-80 bg-white border-l border-gray-200 z-30 shadow-xl"
                  >
                    <GroupInfo
                      chat={activeChat}
                      onClose={() => setShowGroupInfo(false)}
                      isAdmin={activeChat.userRole === 'admin'}
                      allConversations={conversations}
                      onLeaveGroup={handleLeaveGroup}
                      onGroupUpdated={handleGroupUpdated}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-white">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                <Sparkles size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">StudyBuddy Communities</h2>
              <p className="max-w-xs text-sm text-gray-500">
                Connect with your classmates, join study groups, and share resources in real-time.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-left hover:bg-indigo-50 hover:border-indigo-100 transition-colors group"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-2 group-hover:bg-indigo-200 transition-colors">
                    <Users2 size={16} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Study Groups</h4>
                  <p className="text-xs text-gray-500 mt-1">Join subject-specific groups to collaborate.</p>
                </button>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-2">
                    <MessageSquarePlus size={16} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Direct Chat</h4>
                  <p className="text-xs text-gray-500 mt-1">Search a user above to message directly.</p>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCommunities}
      />
    </div>
  );
};

export default Communities;
