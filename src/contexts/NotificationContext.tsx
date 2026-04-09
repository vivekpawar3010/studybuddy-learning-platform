import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'dm' | 'group' | 'alert' | 'info' | 'success';
  read: boolean;
  chatId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: Date;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const channelsRef = useRef<(() => void)[]>([]);

  const addNotification = useCallback((notif: AppNotification) => {
    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 50); // keep max 50
    });

    // Browser push notification if tab is not focused
    if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: notif.senderAvatar || '/favicon.ico',
        tag: notif.id,
      });
    }
  }, []);

  useEffect(() => {
    // Request browser notification permission once
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void)[] = [];

    const attachChannels = (userId: string) => {
      // Tear down any existing channels before setting up new ones
      cleanup.forEach(fn => fn());
      cleanup = [];

      // --- Listen for incoming Direct Messages ---
      const dmChannel = supabase
        .channel(`notifications:dm:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          async (payload) => {
            const msg = payload.new as any;
            if (msg.sender_id === userId) return;

            const { data: conv } = await supabase
              .from('conversations')
              .select('id, user1_id, user2_id')
              .eq('id', msg.conversation_id)
              .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
              .maybeSingle();

            if (!conv) return;

            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('firebase_uid', msg.sender_id)
              .maybeSingle();

            const senderName = sender?.full_name || 'Someone';
            addNotification({
              id: msg.id,
              title: `New message from ${senderName}`,
              message: msg.message_text?.length > 80
                ? msg.message_text.slice(0, 80) + '…'
                : msg.message_text || '📎 Attachment',
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'dm',
              read: false,
              chatId: conv.id,
              senderId: msg.sender_id,
              senderName,
              senderAvatar: sender?.avatar_url,
              createdAt: new Date(msg.created_at),
            });
          }
        )
        .subscribe();

      // --- Listen for incoming Group Messages ---
      const groupChannel = supabase
        .channel(`notifications:group:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            const msg = payload.new as any;
            if (msg.sender_id === userId) return;

            const { data: membership } = await supabase
              .from('community_members')
              .select('community_id')
              .eq('community_id', msg.community_id)
              .eq('user_id', userId)
              .maybeSingle();

            if (!membership) return;

            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('firebase_uid', msg.sender_id)
              .maybeSingle();

            const { data: community } = await supabase
              .from('communities')
              .select('name')
              .eq('id', msg.community_id)
              .maybeSingle();

            const senderName = sender?.full_name || 'Someone';
            const communityName = community?.name || 'a group';

            addNotification({
              id: msg.id,
              title: `${senderName} in ${communityName}`,
              message: msg.message_text?.length > 80
                ? msg.message_text.slice(0, 80) + '…'
                : msg.message_text || '📎 Attachment',
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'group',
              read: false,
              chatId: msg.community_id,
              senderId: msg.sender_id,
              senderName,
              senderAvatar: sender?.avatar_url,
              createdAt: new Date(msg.created_at),
            });
          }
        )
        .subscribe();

      cleanup = [
        () => supabase.removeChannel(dmChannel),
        () => supabase.removeChannel(groupChannel),
      ];
    };

    // Subscribe to Firebase auth state — channels attach only AFTER login is confirmed
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.uid) {
        attachChannels(firebaseUser.uid);
      } else {
        // User logged out — tear down channels
        cleanup.forEach(fn => fn());
        cleanup = [];
      }
    });

    channelsRef.current = [() => { unsubAuth(); cleanup.forEach(fn => fn()); }];

    return () => {
      channelsRef.current.forEach(unsub => unsub());
      channelsRef.current = [];
    };
  }, [addNotification]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
