import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface Page {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
  tags: string[];
}

export interface Section {
  id: string;
  title: string;
  pages: Page[];
}

export interface Notebook {
  id: string;
  title: string;
  icon?: string;
  color: string;
  sections: Section[];
}

export interface Note {
  id: number;
  title: string;
  folder: string; // Subject or 'Other'
  content: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'gray';
  date: string;
}

export interface TestItem {
  id: number;
  subject: string;
  name: string;
  date: string;
  month: string;
  day: string;
  completed?: boolean;
}

export interface Community {
  id: number;
  name: string;
  members: string; // e.g., "11 groups - 15 members"
  color: 'blue' | 'green' | 'purple';
  avatars: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  date?: string; // ISO string for date grouping
  type: 'text' | 'note' | 'file' | 'link';
  status?: 'sending' | 'sent' | 'error'; // optimistic UI
  noteId?: string;
  fileUrl?: string;
  fileName?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar: string | null;
  type: 'direct' | 'group' | 'broadcast';
  /** Original DB privacy type for communities: 'public' | 'private' | 'broadcast' */
  communityType?: 'public' | 'private' | 'broadcast';
  /** Invite code for joining via link (communities only) */
  inviteCode?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  members: string[];
  description?: string;
  userRole?: 'admin' | 'member';
  status?: 'pending' | 'accepted' | 'blocked';
  initiatorId?: string;
}

export interface StreakDay {
  day: string;
  label: string;
  status: 'complete' | 'missed' | 'pending';
  value?: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'info' | 'success';
  read: boolean;
}