import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { CheckCheck, Bell } from 'lucide-react';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUnreadCount,
} from '../../lib/communicationApi';
import type { NotificationPreferenceMap, NotificationType } from '@university-lms/shared';

const TYPE_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  assignment_due: 'Assignment',
  quiz_available: 'Quiz',
  exam_reminder: 'Exam',
  grade_published: 'Grade',
  attendance_alert: 'Attendance',
  discussion_reply: 'Discussion',
  system: 'System',
  custom: 'Custom',
};

export function NotificationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', tab],
    queryFn: () =>
      listNotifications({ limit: 50, unreadOnly: tab === 'unread' }),
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
  });

  const { data: prefs } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: getNotificationPreferences,
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const prefsMut = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });

  const items = data?.items ?? [];
  const preferences = prefs?.preferences ?? {};

  const togglePref = (type: NotificationType, channel: 'in_app' | 'email', value: boolean) => {
    const next: NotificationPreferenceMap = {
      ...preferences,
      [type]: {
        ...(preferences[type] || {}),
        [channel]: value,
      },
    };
    prefsMut.mutate(next);
  };

  const prefTypes: NotificationType[] = [
    'announcement',
    'discussion_reply',
    'assignment_due',
    'exam_reminder',
    'grade_published',
    'system',
  ];

  return (
    <AppLayout>
      <ModuleHeader
        title="Notifications"
        subtitle="In-app alerts, email delivery, and channel preferences"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Notifications' },
        ]}
        stats={[
          { label: 'Unread', value: unread, variant: 'primary' },
          { label: 'Total shown', value: items.length, variant: 'default' },
        ]}
        primaryAction={{
          label: 'Mark all read',
          onClick: () => markAllMut.mutate(),
          icon: <CheckCheck className="w-4 h-4" />,
        }}
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex gap-1">
            {(['all', 'unread'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  tab === t
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {isLoading && (
              <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
            )}
            {!isLoading && items.length === 0 && (
              <div className="p-12 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">No notifications</p>
              </div>
            )}
            {items.map((n) => {
              const unreadItem = n.status !== 'read' && !n.readAt;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`w-full text-left px-5 py-4 hover:bg-slate-50 ${
                    unreadItem ? 'bg-indigo-50/30' : ''
                  }`}
                  onClick={() => {
                    if (unreadItem) markReadMut.mutate(n.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {TYPE_LABELS[n.type] || n.type}
                        </span>
                        {unreadItem && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${unreadItem ? 'font-bold' : 'font-medium'} text-slate-900`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap line-clamp-3">
                        {n.body}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sticky top-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Channel preferences</h3>
            <p className="text-xs text-slate-500 mb-4">
              In-app is recommended on. Email requires{' '}
              <code className="text-[10px] bg-slate-100 px-1 rounded">EMAIL_PROVIDER_API_KEY</code>{' '}
              on the API.
            </p>
            <div className="space-y-3">
              {prefTypes.map((type) => {
                const row = preferences[type] || {};
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-xs font-semibold text-slate-700">
                      {TYPE_LABELS[type] || type}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={row.in_app !== false}
                          onChange={(e) => togglePref(type, 'in_app', e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        In-app
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!row.email}
                          onChange={(e) => togglePref(type, 'email', e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Email
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            {prefsMut.isPending && (
              <p className="text-[11px] text-slate-400 mt-3">Saving…</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;
