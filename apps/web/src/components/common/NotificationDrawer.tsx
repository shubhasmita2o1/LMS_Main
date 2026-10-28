import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCheck,
  AlertCircle,
  MessageSquare,
  Megaphone,
  BookOpen,
} from 'lucide-react';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../lib/communicationApi';
import type { NotificationPublic } from '@university-lms/shared';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function relativeTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function iconFor(type: string) {
  switch (type) {
    case 'announcement':
      return <Megaphone className="w-4 h-4 text-indigo-600" />;
    case 'discussion_reply':
      return <MessageSquare className="w-4 h-4 text-sky-600" />;
    case 'assignment_due':
    case 'quiz_available':
    case 'grade_published':
      return <BookOpen className="w-4 h-4 text-emerald-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-slate-500" />;
  }
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'drawer'],
    queryFn: () => listNotifications({ limit: 15 }),
    enabled: isOpen,
    refetchInterval: isOpen ? 30000 : false,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!isOpen) return null;

  const items: NotificationPublic[] = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Notifications</h2>
            {unread > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAllMut.mutate()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              disabled={markAllMut.isPending || unread === 0}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="p-10 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">You&apos;re all caught up</p>
              <p className="text-xs text-slate-400 mt-1">No notifications yet</p>
            </div>
          )}
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const unreadItem = n.status !== 'read' && !n.readAt;
              const link = (n.data?.link as string) || '/notifications';
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 transition ${
                      unreadItem ? 'bg-indigo-50/40' : ''
                    }`}
                    onClick={() => {
                      if (unreadItem) markReadMut.mutate(n.id);
                      onClose();
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        {iconFor(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              unreadItem ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <Link
                          to={link}
                          className="text-[11px] font-semibold text-indigo-600 mt-1 inline-block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all notifications &amp; preferences
          </Link>
        </div>
      </div>
    </div>
  );
}
