import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { getExam, listAllocations, allocateStudents } from '../../lib/examsApi';
import { api } from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { Loader2 } from 'lucide-react';

export function ExamAllocatePage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [studentIdsRaw, setStudentIdsRaw] = useState('');

  const { data: exam } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => getExam(id),
    enabled: !!id,
  });

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['exam-alloc', id],
    queryFn: () => listAllocations(id),
    enabled: !!id,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-min'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: Array<{ id: string; name: string; code: string }> }>>(
        '/courses',
        { params: { limit: 100 } }
      );
      return data.data?.items || [];
    },
  });

  const allocMut = useMutation({
    mutationFn: () => {
      const studentIds = studentIdsRaw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => /^[a-f\d]{24}$/i.test(s));
      return allocateStudents(id, {
        courseId: courseId || undefined,
        studentIds: studentIds.length ? studentIds : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-alloc', id] });
      setStudentIdsRaw('');
    },
  });

  return (
    <AppLayout>
      <ModuleHeader
        title={`Allocate · ${exam?.title || 'Exam'}`}
        subtitle="Assign students by course enrollment or student IDs"
        actions={
          <Link to={`/examinations/${id}`} className="text-sm font-semibold text-primary-600">
            Back to exam
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">From course enrollment</h3>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Select course…</option>
            {(courses || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Or paste student IDs</h3>
          <textarea
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            rows={3}
            placeholder="ObjectIds, comma or space separated"
            value={studentIdsRaw}
            onChange={(e) => setStudentIdsRaw(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={allocMut.isPending || (!courseId && !studentIdsRaw.trim())}
        onClick={() => allocMut.mutate()}
        className="mb-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {allocMut.isPending ? 'Allocating…' : 'Allocate students'}
      </button>

      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-bold">
            Allocations ({allocations?.length || 0})
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="py-2">Student</th>
                <th className="py-2">Code</th>
                <th className="py-2">Status</th>
                <th className="py-2">Seat</th>
              </tr>
            </thead>
            <tbody>
              {(allocations || []).map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2">{a.studentName || a.studentId}</td>
                  <td className="py-2 font-mono">{a.studentCode || '—'}</td>
                  <td className="py-2 capitalize">{a.status}</td>
                  <td className="py-2">{a.seatNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
