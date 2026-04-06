import React from 'react';
import { Bell, CheckCircle, Info, AlertCircle, Check, MessageCircle, Users, Trash2 } from 'lucide-react';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';

const NotificationsPage: React.FC = () => {
  const { notifications, markAllRead, markRead, clearAll } = useNotifications();

  const getIcon = (notif: AppNotification) => {
    if (notif.senderAvatar) {
      return (
        <img
          src={notif.senderAvatar}
          alt={notif.senderName}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      );
    }
    switch (notif.type) {
      case 'dm': return (
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
          <MessageCircle size={18} />
        </div>
      );
      case 'group': return (
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
          <Users size={18} />
        </div>
      );
      case 'alert': return (
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
          <AlertCircle size={18} />
        </div>
      );
      case 'success': return (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500 shrink-0">
          <CheckCircle size={18} />
        </div>
      );
      default: return (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shrink-0">
          <Info size={18} />
        </div>
      );
    }
  };

  const getTypeLabel = (type: AppNotification['type']) => {
    switch (type) {
      case 'dm': return { label: 'Direct Message', color: 'bg-indigo-50 text-indigo-700' };
      case 'group': return { label: 'Group Message', color: 'bg-emerald-50 text-emerald-700' };
      case 'alert': return { label: 'Alert', color: 'bg-red-50 text-red-700' };
      case 'success': return { label: 'Success', color: 'bg-green-50 text-green-700' };
      default: return { label: 'Info', color: 'bg-blue-50 text-blue-700' };
    }
  };

  const unreadNotifs = notifications.filter(n => !n.read);
  const readNotifs = notifications.filter(n => n.read);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-gray-500">
            {notifications.length === 0
              ? 'All caught up!'
              : `${unreadNotifs.length} unread · ${notifications.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllRead}
                className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
              >
                <Check size={14} /> Mark all read
              </button>
              <button
                onClick={clearAll}
                className="text-[11px] text-red-500 font-bold uppercase tracking-wider hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <Bell size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">When someone messages you, it'll show up here</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Unread section */}
          {unreadNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  New — {unreadNotifs.length}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {unreadNotifs.map(notif => {
                  const typeInfo = getTypeLabel(notif.type);
                  return (
                    <div
                      key={notif.id}
                      className="p-4 flex items-start gap-3 bg-blue-50/30 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => markRead(notif.id)}
                    >
                      {getIcon(notif)}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate pr-2 flex items-center gap-2">
                            {notif.title}
                            <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block shrink-0" />
                          </h3>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">{notif.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{notif.message}</p>
                        <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Read section */}
          {readNotifs.length > 0 && (
            <>
              {unreadNotifs.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Earlier</p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {readNotifs.map(notif => {
                  const typeInfo = getTypeLabel(notif.type);
                  return (
                    <div
                      key={notif.id}
                      className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer opacity-70"
                    >
                      {getIcon(notif)}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-medium text-gray-700 truncate pr-2">{notif.title}</h3>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
                        <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;