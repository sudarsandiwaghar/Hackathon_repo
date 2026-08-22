import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Calendar,
  CreditCard,
  Clock,
  Shield,
  Trash2,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'leave_approved':
      case 'leave_rejected':
      case 'leave_request':
        return <Calendar className="w-5 h-5 text-[#4A1F45]" />;
      case 'payroll_processed':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'attendance_missing':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#6F3C68]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time automated updates on attendance reminders, leave approvals, and payroll releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
              className="text-rose-600 hover:bg-rose-50 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-[#4A1F45] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-[#4A1F45] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-xs">
          <EmptyState
            icon={<Bell className="w-8 h-8 text-gray-300" />}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="You are completely up to date with all HR workflows and updates."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item._id}
              onClick={() => !item.read && markAsRead(item._id)}
              className={`p-4 rounded-2xl border transition-all duration-150 flex items-start gap-4 cursor-pointer ${
                item.read
                  ? 'bg-white border-gray-200/80 hover:border-gray-300'
                  : 'bg-[#FAF7FA] border-[#A77BA3]/40 shadow-xs hover:border-[#6F3C68]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{item.title}</h4>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
              </div>

              {!item.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#4A1F45] flex-shrink-0 mt-2" title="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
