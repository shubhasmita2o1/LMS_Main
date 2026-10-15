import { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertCircle,
  Calendar,
  CreditCard,
  FileCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'Academic' | 'Exam' | 'Fee' | 'System';
  isRead: boolean;
  priority: 'urgent' | 'high' | 'normal';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Mid-Semester Timetable Published',
    message: 'The examination wing has published the official Mid-Term schedule for engineering batches.',
    timestamp: '15 mins ago',
    category: 'Exam',
    isRead: false,
    priority: 'urgent',
  },
  {
    id: 'n-2',
    title: 'Attendance Shortage Alert (< 75%)',
    message: '42 undergraduate students currently fall below the mandatory 75% threshold for final eligibility.',
    timestamp: '1 hour ago',
    category: 'Academic',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'n-3',
    title: 'Fee Payment Installment #2 Due',
    message: 'Fall Semester tuition fee due date reminder sent to 134 enrolled candidates.',
    timestamp: '3 hours ago',
    category: 'Fee',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'n-4',
    title: 'Syllabus OBE Revision Approved',
    message: 'Dr. Elizabeth Vance approved outcome mapping matrix for CS301 Operating Systems.',
    timestamp: 'Yesterday',
    category: 'Academic',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'n-5',
    title: 'System Security Audit Completed',
    message: 'Automated weekly penetration testing and role verification completed with 0 high-risk findings.',
    timestamp: '2 days ago',
    category: 'System',
    isRead: true,
    priority: 'normal',
  },
];

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Exam' | 'Fee'>('All');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const filtered = notifications.filter((item) => {
    if (filter === 'Unread') return !item.isRead;
    if (filter === 'Exam') return item.category === 'Exam';
    if (filter === 'Fee') return item.category === 'Fee';
    return true;
  });

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'Exam':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'Fee':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'Academic':
        return <FileCheck className="w-4 h-4 text-primary-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Notifications</h3>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread notices` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg text-xs font-semibold text-primary-600 hover:bg-primary-50 transition flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 mt-4">
            {(['All', 'Unread', 'Exam', 'Fee'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === tab
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No notifications found in this category
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkItemRead(item.id)}
                className={`p-3.5 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                  !item.isRead ? 'bg-primary-50/50 hover:bg-primary-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    {item.priority === 'urgent' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            View Notification Center Archive →
          </button>
        </div>
      </div>
    </div>
  );
}
export default NotificationDrawer;
