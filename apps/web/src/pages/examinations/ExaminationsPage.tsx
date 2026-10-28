import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { listExams, createExam, publishExam, closeExam } from '../../lib/examsApi';
import { useAuthStore } from '../../stores/authStore';
import type { ExamPublic } from '@university-lms/shared';
import {
  CalendarDays,
  Clock,
  Plus,
  Play,
  Lock,
  FileText,
  Users,
  Loader2,
} from 'lucide-react';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-amber-100 text-amber-900',
    graded: 'bg-violet-100 text-violet-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${map[status] || 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  );
}

export function ExaminationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.roles?.includes('student');
  const canManage =
    user?.roles?.some((r) =>
      ['tenant_admin', 'university_admin', 'faculty', 'super_admin'].includes(r)
    ) ?? false;

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    code: '',
    durationMinutes: 60,
    startAt: '',
    endAt: '',
    mode: 'online' as const,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['exams', statusFilter],
    queryFn: () => listExams(statusFilter ? { status: statusFilter } : undefined),
  });

  const items: ExamPublic[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray((data as any).items)) return (data as any).items;
    return [];
  }, [data]);

  const createMut = useMutation({
    mutationFn: () =>
      createExam({
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      }),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: ['exams'] });
      setCreateOpen(false);
      navigate(`/examinations/${exam.id}`);
    },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });

  const closeMut = useMutation({
    mutationFn: (id: string) => closeExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Examinations"
        subtitle={
          isStudent
            ? 'Your allocated exams'
            : 'Schedule, allocate, and run online examinations'
        }
        actions={
          canManage ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New exam
            </button>
          ) : null
        }
      />

      {!isStudent && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['', 'draft', 'scheduled', 'live', 'closed'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading exams…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load examinations.
        </div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No examinations yet</p>
          <p className="mt-1 text-xs text-slate-400">
            {isStudent
              ? 'You will see exams here once you are allocated.'
              : 'Create a draft exam to get started.'}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/examinations/${exam.id}`}
                  className="truncate text-sm font-bold text-slate-900 hover:text-primary-700"
                >
                  {exam.title}
                </Link>
                {statusBadge(exam.status)}
                <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {exam.code}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(exam.startAt).toLocaleString()} –{' '}
                  {new Date(exam.endAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.durationMinutes} min
                </span>
                <span>
                  {exam.questionCount} Q · {exam.totalMarks} marks · {exam.mode}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isStudent && (exam.status === 'live' || exam.status === 'scheduled') && (
                <Link
                  to={`/examinations/${exam.id}/attempt`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  Attempt
                </Link>
              )}
              {canManage && exam.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => publishMut.mutate(exam.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Publish
                </button>
              )}
              {canManage && ['scheduled', 'live'].includes(exam.status) && (
                <button
                  type="button"
                  onClick={() => closeMut.mutate(exam.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Close
                </button>
              )}
              {canManage && (
                <Link
                  to={`/examinations/${exam.id}/allocate`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  Allocate
                </Link>
              )}
              <Link
                to={`/examinations/${exam.id}`}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Create examination</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Code
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">
                  Start
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  End
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-600">
                Duration (minutes)
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: Number(e.target.value) || 60 })
                  }
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.title || !form.code || !form.startAt || !form.endAt || createMut.isPending}
                onClick={() => createMut.mutate()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create draft'}
              </button>
            </div>
            {createMut.isError && (
              <p className="mt-2 text-xs text-red-600">
                {(createMut.error as any)?.response?.data?.error?.message || 'Create failed'}
              </p>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
