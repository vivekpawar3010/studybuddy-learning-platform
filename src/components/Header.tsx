import React, { useState, useRef, useEffect, memo } from 'react';
import { Search, Bell, ChevronDown, Menu, Sparkles, X, MoreHorizontal, LogOut, User as UserIcon, Settings as SettingsIcon, RotateCcw, MessageCircle, Users } from 'lucide-react';
import { MAIN_NAV_ITEMS, PROFILE_NAV_ITEMS } from '../constants';
import { User as FirebaseUser } from 'firebase/auth';
import { useNotifications } from '../contexts/NotificationContext';

interface HeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: FirebaseUser | null;
  onSignOut: () => void;
  notifCount?: number;
}

const Header: React.FC<HeaderProps> = ({ activePage, onNavigate, user, onSignOut }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 gap-6 w-full">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
          >
            <Menu size={20} />
          </button>
          
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate('Dashboard')}
          >
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white shadow-sm">
               <Sparkles size={16} />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">StudyBuddy</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 h-full">
          {MAIN_NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={`h-full px-1 flex items-center text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
                activePage === item.name 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Search, Notifications, Profile */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
          {/* Desktop Search */}
          <div className="hidden md:block w-full max-w-[200px] lg:max-w-[240px]">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={14} className="text-gray-400" />
              </span>
              <input
                type="text"
                className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Mobile Search Icon */}
          <button 
            onClick={() => setIsSearchOverlayOpen(true)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead(); }}
              className={`p-2 rounded-md transition-colors relative ${showNotifications ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-900 text-xs">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 20).map(notif => (
                      <div
                        key={notif.id}
                        className={`px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                          !notif.read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => {
                          markRead(notif.id);
                          if (notif.chatId) {
                            onNavigate('Communities');
                          } else {
                            onNavigate('Notifications');
                          }
                          setShowNotifications(false);
                        }}
                      >
                        {/* Avatar / Icon */}
                        <div className="shrink-0 mt-0.5">
                          {notif.senderAvatar ? (
                            <img src={notif.senderAvatar} alt={notif.senderName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              notif.type === 'dm' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {notif.type === 'dm' ? <MessageCircle size={14} /> : <Users size={14} />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-semibold truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-xs font-medium text-gray-500">All caught up!</p>
                      <p className="text-[10px] text-gray-400 mt-1">New messages will appear here</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 text-center">
                  <button
                    onClick={() => { onNavigate('Notifications'); setShowNotifications(false); }}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              {user?.photoURL ? (
                <img
                  className="h-7 w-7 rounded-full bg-gray-200 border border-gray-200 object-cover"
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
                  <UserIcon size={14} />
                </div>
              )}
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  {PROFILE_NAV_ITEMS.map((item) => (
                    <button 
                      key={item.name}
                      onClick={() => { onNavigate(item.name); setShowProfileMenu(false); }} 
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <item.icon size={14} /> {item.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white">
                   <Sparkles size={16} />
                </div>
                <span className="text-lg font-bold text-gray-900 tracking-tight">StudyBuddy</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {MAIN_NAV_ITEMS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => { onNavigate(item.name); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activePage === item.name 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} className={activePage === item.name ? 'text-blue-600' : 'text-gray-400'} />
                  {item.name}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                {user?.photoURL ? (
                  <img
                    className="h-10 w-10 rounded-full bg-gray-200 border border-gray-200 object-cover"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
                    <UserIcon size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-[110] bg-white animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 flex items-center px-4 gap-3 border-b border-gray-100">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Search notes, tests, communities..." 
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
            />
            <button onClick={() => setIsSearchOverlayOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</p>
            <div className="space-y-2">
              {['DNA Replication', 'Biology Quiz', 'Calculus Formulas'].map(term => (
                <button key={term} className="w-full flex items-center gap-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                  <RotateCcw size={14} className="text-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Header);