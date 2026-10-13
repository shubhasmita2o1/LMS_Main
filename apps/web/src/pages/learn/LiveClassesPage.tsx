import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, LiveClassPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function LiveClassesPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    meetingProvider: 'custom' as const,
    meetingUrl: '',
    passcode: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['learn', 'live', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LiveClassPublic[]>>('/learn/live-classes', {
        params: { courseId },
      });
      return data.data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      await api.post('/learn/live-classes', {
        courseId,
        title: form.title,
        description: form.description || null,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        scheduledEnd: new Date(form.scheduledEnd).toISOString(),
        meetingProvider: form.meetingProvider,
        meetingUrl: form.meetingUrl || null,
        passcode: form.passcode || null,
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        scheduledStart: '',
        scheduledEnd: '',
        meetingProvider: 'custom',
        meetingUrl: '',
        passcode: '',
      });
      queryClient.invalidateQueries({ queryKey: ['learn', 'live', courseId] });
    },
  });

  const actionMut = useMutation({
    mutationFn: async ({
      id,
      action,
      recordingUrl,
    }: {
      id: string;
      action: 'start' | 'complete';
      recordingUrl?: string;
    }) => {
      if (action === 'start') await api.post(`/learn/live-classes/${id}/start`);
      else await api.post(`/learn/live-classes/${id}/complete`, { recordingUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn', 'live', courseId] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/learn/courses/${courseId}`}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Course
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="font-semibold text-slate-900">Live classes</h1>
          </div>
          <Can resource="course" action="manage">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white"
            >
              {showForm ? 'Cancel' : 'Schedule'}
            </button>
          </Can>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
          >
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">
                Start
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledStart}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledStart: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-slate-500">
                End
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledEnd}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledEnd: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
            <input
              placeholder="Meeting URL (Zoom / Meet / Teams)"
              value={form.meetingUrl}
              onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Passcode (optional)"
              value={form.passcode}
              onChange={(e) => setForm((f) => ({ ...f, passcode: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={createMut.isPending}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white"
            >
              Schedule class
            </button>
          </form>
        )}

        {isLoading && <p className="text-slate-400 text-center">Loading…</p>}

        <ul className="space-y-3">
          {data?.map((lc) => (
            <li
              key={lc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-slate-900">{lc.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      lc.status === 'live'
                        ? 'bg-red-100 text-red-700'
                        : lc.status === 'completed'
                          ? 'bg-slate-100 text-slate-600'
                          : lc.status === 'cancelled'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {lc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(lc.scheduledStart).toLocaleString()} –{' '}
                  {new Date(lc.scheduledEnd).toLocaleString()}
                </p>
                {lc.meetingUrl && (
                  <a
                    href={lc.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline mt-1 inline-block"
                  >
                    Join meeting
                  </a>
                )}
                {lc.recordingUrl && (
                  <a
                    href={lc.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:underline mt-1 block"
                  >
                    Recording
                  </a>
                )}
              </div>
              <Can resource="course" action="manage">
                <div className="flex gap-2">
                  {lc.status === 'scheduled' && (
                    <button
                      onClick={() => actionMut.mutate({ id: lc.id, action: 'start' })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white"
                    >
                      Start
                    </button>
                  )}
                  {(lc.status === 'live' || lc.status === 'scheduled') && (
                    <button
                      onClick={() => {
                        const url = window.prompt('Recording URL (optional)') || undefined;
                        actionMut.mutate({ id: lc.id, action: 'complete', recordingUrl: url });
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </Can>
            </li>
          ))}
          {data && data.length === 0 && (
            <li className="text-center text-slate-400 py-10">No live classes scheduled.</li>
          )}
        </ul>
      </main>
    </div>
  );
}
