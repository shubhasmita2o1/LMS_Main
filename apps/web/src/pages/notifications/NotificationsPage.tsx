import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import {
  CheckCheck,
  Calendar,
  CreditCard,
  FileCheck,
  Sliders,
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
  { id: 'n-1', title: 'Mid-Semester Timetable Published', message: 'The examination wing has published the official Mid-Term schedule for engineering batches.', timestamp: '15 mins ago', category: 'Exam', isRead: false, priority: 'urgent' },
  { id: 'n-2', title: 'Attendance Shortage Alert (< 75%)', message: '42 undergraduate students currently fall below the mandatory 75% threshold for final eligibility.', timestamp: '1 hour ago', category: 'Academic', isRead: false, priority: 'high' },
  { id: 'n-3', title: 'Fee Payment Installment #2 Due', message: 'Fall Semester tuition fee due date reminder sent to 134 enrolled candidates.', timestamp: '3 hours ago', category: 'Fee', isRead: false, priority: 'high' },
  { id: 'n-4', title: 'Syllabus OBE Revision Approved', message: 'Dr. Elizabeth Vance approved outcome mapping matrix for CS301 Operating Systems.', timestamp: 'Yesterday', category: 'Academic', isRead: true, priority: 'normal' },
  { id: 'n-5', title: 'System Security Audit Completed', message: 'Automated weekly penetration testing and role verification completed with 0 high-risk findings.', timestamp: '2 days ago', category: 'System', isRead: true, priority: 'normal' },
  { id: 'n-6', title: 'Google Placement Registration Closing', message: 'Registration for Cloud Systems SDE-1 closes at 5:00 PM today.', timestamp: '3 days ago', category: 'Academic', isRead: true, priority: 'normal' },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Academic' | 'Exam' | 'Fee'>('All');
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
  const [smsUrgentEnabled, setSmsUrgentEnabled] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'Unread') return !item.isRead;
    if (activeTab === 'Academic') return item.category === 'Academic';
    if (activeTab === 'Exam') return item.category === 'Exam';
    if (activeTab === 'Fee') return item.category === 'Fee';
    return true;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Notification Center & Alert Preferences"
        subtitle="Manage real-time push alerts, academic reminders, examination notices, and dispatch channels"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Notifications' }]}
        stats={[
          { label: 'Unread Alerts', value: unreadCount, variant: 'primary' },
          { label: 'Delivery Channels', value: 'In-App + Email', variant: 'success' },
          { label: 'Weekly Velocity', value: '18 Notices', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Mark All as Read',
          onClick: handleMarkAllRead,
          icon: <CheckCheck className="w-4 h-4" />,
        }}
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Feed */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'Unread', 'Academic', 'Exam', 'Fee'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab} {tab === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition ${
                  !item.isRead ? 'bg-primary-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    {item.category === 'Exam' ? (
                      <Calendar className="w-4 h-4 text-purple-600" />
                    ) : item.category === 'Fee' ? (
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      {item.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                    <span className="text-[11px] text-slate-400 mt-2 block">{item.timestamp}</span>
                  </div>
                </div>

                {!item.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600 mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preferences Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs h-fit space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Alert Delivery Channels
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">In-App Browser Push</span>
                <span className="text-slate-400">Desktop notifications when active</span>
              </div>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={() => setInAppEnabled(!inAppEnabled)}
                className="w-4 h-4 rounded text-primary-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Daily Email Digest</span>
                <span className="text-slate-400">Summary of circulars & fee notices</span>
              </div>
              <input
                type="checkbox"
                checked={emailDigestEnabled}
                onChange={() => setEmailDigestEnabled(!emailDigestEnabled)}
                className="w-4 h-4 rounded text-primary-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Urgent SMS Alerts</span>
                <span className="text-slate-400">Reserved for emergency weather & exams</span>
              </div>
              <input
                type="checkbox"
                checked={smsUrgentEnabled}
                onChange={() => setSmsUrgentEnabled(!smsUrgentEnabled)}
                className="w-4 h-4 rounded text-primary-600"
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default NotificationsPage;
