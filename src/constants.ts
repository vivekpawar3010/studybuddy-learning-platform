
import { Home, BookOpen, FileText, Users, Bot, Settings, Calendar, Trophy, User } from 'lucide-react';
import { NavItem, Note, TestItem, Community, StreakDay, Notification } from './types';

export const MAIN_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: Home },
  { name: 'My Notes', icon: BookOpen },
  { name: 'Communities', icon: Users },
  { name: 'Tests', icon: FileText },
  { name: 'AI Tutor', icon: Bot },
];

export const PROFILE_NAV_ITEMS: NavItem[] = [
  { name: 'Profile', icon: User },
  { name: 'Settings', icon: Settings },
];

export const CHART_DATA = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 50 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 70 },
  { name: 'Fri', value: 60 },
  { name: 'Sat', value: 85 },
  { name: 'Sun', value: 75 },
];

export const STREAK_DAYS: StreakDay[] = [
  { day: 'Mon', label: '18', status: 'complete' },
  { day: 'Tue', label: '19', status: 'complete' },
  { day: 'Wed', label: '20', status: 'complete' },
  { day: 'Thu', label: '21', status: 'complete' },
  { day: 'Fri', label: '22', status: 'complete' },
  { day: 'Sat', label: '23', status: 'pending' },
  { day: 'Sun', label: '24', status: 'pending' },
];

export const RECENT_NOTES: Note[] = [
  { 
    id: 1, 
    title: 'Genetics: DNA Structure', 
    folder: 'Biology',
    color: 'green', 
    date: 'Jan 25, 2023',
    content: 'The double helix structure of DNA was discovered by Watson and Crick. \n\nKey components:\n- Phosphate group\n- Sugar (Deoxyribose)\n- Nitrogenous base (A, T, C, G)'
  },
  { 
    id: 2, 
    title: 'Essay Outline: Industrial Rev', 
    folder: 'History',
    color: 'blue', 
    date: 'Jan 24, 2023',
    content: 'Thesis: The Industrial Revolution fundamentally shifted the social fabric of Europe.\n\n1. Urbanization\n2. Child Labor\n3. Economic Shift'
  },
  { 
    id: 3, 
    title: 'Calculus Formulas', 
    folder: 'Math',
    color: 'purple', 
    date: 'Jan 23, 2023',
    content: 'Derivatives:\n- Power Rule: d/dx(x^n) = nx^(n-1)\n- Chain Rule: f\'(g(x))g\'(x)\n\nIntegrals:\n- Reverse power rule...'
  },
  { 
    id: 4, 
    title: 'User Persona Research', 
    folder: 'Design Thinking',
    color: 'orange', 
    date: 'Jan 22, 2023',
    content: 'Persona 1: The Busy Student.\nNeeds: Quick access to notes, reminders for tests.\nFrustrations: Cluttered UI, slow loading times.'
  }
];

export const UPCOMING_TESTS: TestItem[] = [
  { id: 1, subject: 'Physics', name: 'Physics Midterm', date: 'Oct 25', month: 'Oct', day: '25' },
  { id: 2, subject: 'Literature', name: 'Literature Quiz', date: 'Nov 1', month: 'Nov', day: '01' }, 
  { id: 3, subject: 'Chemistry', name: 'Organic Chem Quiz', date: 'Nov 8', month: 'Nov', day: '08' },
];

export const COMMUNITIES: Community[] = [
  { 
    id: 1, 
    name: 'AP Chem Study Group', 
    members: '11 groups - 15 members', 
    color: 'blue',
    avatars: ['https://ui-avatars.com/api/?name=A+B&background=random', 'https://ui-avatars.com/api/?name=C+D&background=random', 'https://ui-avatars.com/api/?name=E+F&background=random']
  },
  { 
    id: 2, 
    name: 'Design Thinking Class', 
    members: '11 groups - 13 members', 
    color: 'green',
    avatars: [] 
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Exam Reminder', message: 'Physics Midterm is tomorrow at 10:00 AM.', time: '1 hour ago', type: 'alert', read: false },
  { id: 2, title: 'New Grade Posted', message: 'Your Literature Quiz grade has been updated: A-', time: '2 hours ago', type: 'success', read: false },
  { id: 3, title: 'Assignment Due', message: 'History Essay Draft due tonight by 11:59 PM.', time: '5 hours ago', type: 'info', read: true },
];
