import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { Plus, Megaphone, Send, Archive } from 'lucide-react';
import {
  listAnnouncements,
  createAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
} from '../../lib/communicationApi';
import { useAuthStore } from '../../stores/authStore';
import type { AnnouncementAudience, AnnouncementPublic } from '@university-lms/shared';

export function CommunicationPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = (user?.roles || []).some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    audienceType: 'tenant' as AnnouncementAudience,
    publishNow: true,
    emailChannel: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => listAnnouncements({ limit: 50 }),
  });

  const createMut = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setComposerOpen(false);
      setForm({
        title: '',
        body: '',
        audienceType: 'tenant',
        publishNow: true,
        emailChannel: false,
      });
    },
  });

  const publishMut = useMutation({
    mutationFn: publishAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const archiveMut = useMutation({
    mutationFn: archiveAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const items: AnnouncementPublic[] = data?.items ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    const channels: Array<'in_app' | 'email'> = ['in_app'];
    if (form.emailChannel) channels.push('email');
    createMut.mutate({
      title: form.title.trim(),
      body: form.body.trim(),
      audienceType: form.audienceType,
      channels,
      status: form.publishNow ? 'published' : 'draft',
    });
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Communication"
        subtitle="Campus announcements and targeted bulletins"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communication' },
        ]}
        stats={[
          { label: 'Announcements', value: data?.total ?? items.length, variant: 'primary' },
        ]}
        primaryAction={
          canManage
            ? {
                label: 'New announcement',
                onClick: () => setComposerOpen(true),
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {composerOpen && canManage && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Compose announcement</h3>
          <form onSubmit={submit} className="space-y-3">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={300}
              required
            />
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[120px]"
              placeholder="Body (plain text / markdown-friendly)"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              maxLength={20000}
              required
            />
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-xs font-semibold text-slate-600">
                Audience{' '}
                <select
                  className="ml-2 rounded-lg border border-slate-200 px-2 py-1"
                  value={form.audienceType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      audienceType: e.target.value as AnnouncementAudience,
                    }))
                  }
                >
                  <option value="tenant">Entire campus</option>
                  <option value="role">By role</option>
                  <option value="course">Course</option>
                  <option value="program">Program</option>
                  <option value="section">Section</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={form.publishNow}
                  onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))}
                />
                Publish immediately
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={form.emailChannel}
                  onChange={(e) => setForm((f) => ({ ...f, emailChannel: e.target.checked }))}
                />
                Also email (if prefs allow)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMut.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {form.publishNow ? 'Publish' : 'Save draft'}
              </button>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
            {createMut.isError && (
              <p className="text-xs text-rose-600">Failed to create announcement</p>
            )}
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {isLoading && (
          <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
        )}
        {error && (
          <div className="p-8 text-center text-sm text-rose-600">Failed to load announcements</div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-12 text-center">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No announcements yet</p>
          </div>
        )}
        {items.map((a) => (
          <div key={a.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : a.status === 'draft'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-[10px] text-slate-400">{a.audienceType}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap line-clamp-4">
                  {a.body}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {a.publishedAt
                    ? `Published ${new Date(a.publishedAt).toLocaleString()}`
                    : `Created ${new Date(a.createdAt).toLocaleString()}`}
                </p>
              </div>
              {canManage && (
                <div className="flex flex-col gap-1 shrink-0">
                  {a.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => publishMut.mutate(a.id)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Publish
                    </button>
                  )}
                  {a.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => archiveMut.mutate(a.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
                    >
                      <Archive className="w-3 h-3" />
                      Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

export default CommunicationPage;
