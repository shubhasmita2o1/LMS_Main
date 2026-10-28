import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import {
  getExam,
  publishExam,
  closeExam,
  attachQuestions,
  listAttempts,
} from '../../lib/examsApi';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { ApiResponse, QuestionPublic } from '@university-lms/shared';
import { Loader2, Users, Play, Lock } from 'lucide-react';

export function ExamDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.roles?.some((r) =>
      ['tenant_admin', 'university_admin', 'faculty', 'super_admin'].includes(r)
    ) ?? false;
  const isStudent = user?.roles?.includes('student');

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => getExam(id),
    enabled: !!id,
  });

  const { data: attempts } = useQuery({
    queryKey: ['exam-attempts', id],
    queryFn: () => listAttempts(id),
    enabled: !!id && canManage,
  });

  const [bankQ, setBankQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const searchQ = useQuery({
    queryKey: ['qbank-search', bankQ],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: QuestionPublic[] }>>(
        '/question-bank/questions',
        { params: { q: bankQ, limit: 20 } }
      );
      return data.data?.items || [];
    },
    enabled: canManage && bankQ.length >= 2,
  });

  const attachMut = useMutation({
    mutationFn: () =>
      attachQuestions(
        id,
        picked.map((qid, i) => ({ questionBankId: qid, order: i }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam', id] });
      setPicked([]);
    },
  });

  const publishMut = useMutation({
    mutationFn: () => publishExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam', id] }),
  });

  const closeMut = useMutation({
    mutationFn: () => closeExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam', id] }),
  });

  if (isLoading || !exam) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ModuleHeader
        title={exam.title}
        subtitle={`${exam.code} · ${exam.mode} · ${exam.durationMinutes} min · ${exam.totalMarks} marks`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isStudent && (
              <Link
                to={`/examinations/${id}/attempt`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Play className="h-4 w-4" /> Attempt
              </Link>
            )}
            {canManage && (
              <>
                <Link
                  to={`/examinations/${id}/allocate`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                >
                  <Users className="h-4 w-4" /> Allocate
                </Link>
                {exam.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => publishMut.mutate()}
                    className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Publish
                  </button>
                )}
                {['scheduled', 'live'].includes(exam.status) && (
                  <button
                    type="button"
                    onClick={() => closeMut.mutate()}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"
                  >
                    <Lock className="h-4 w-4" /> Close
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
          <p className="mt-1 text-lg font-bold capitalize text-slate-900">{exam.status}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Window</p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {new Date(exam.startAt).toLocaleString()}
            <br />→ {new Date(exam.endAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Questions</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{exam.questionCount}</p>
        </div>
      </div>

      {canManage && exam.status === 'draft' && (
        <div className="mb-6 rounded-xl border bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Attach from question bank</h3>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Search questions…"
            value={bankQ}
            onChange={(e) => setBankQ(e.target.value)}
          />
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {(searchQ.data || []).map((q) => (
              <li key={q.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={picked.includes(q.id)}
                    onChange={(e) =>
                      setPicked((prev) =>
                        e.target.checked ? [...prev, q.id] : prev.filter((x) => x !== q.id)
                      )
                    }
                  />
                  <span>
                    <span className="font-mono text-[10px] text-slate-400">{q.type}</span>{' '}
                    {q.stem.slice(0, 120)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!picked.length || attachMut.isPending}
            onClick={() => attachMut.mutate()}
            className="mt-3 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Attach {picked.length} question(s)
          </button>
        </div>
      )}

      {canManage && attempts && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Attempts ({attempts.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Suspicion</th>
                  <th className="py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-2 pr-3 font-mono text-[11px]">{a.studentId.slice(-6)}</td>
                    <td className="py-2 pr-3">{a.attemptNumber}</td>
                    <td className="py-2 pr-3 capitalize">{a.status}</td>
                    <td className="py-2 pr-3">
                      {a.marksObtained != null ? a.marksObtained : '—'}
                    </td>
                    <td className="py-2 pr-3">{a.suspicionScore}</td>
                    <td className="py-2">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
