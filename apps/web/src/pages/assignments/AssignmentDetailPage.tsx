import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  AssignmentPublic,
  AssignmentSubmissionPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const isStudent = user?.roles?.includes('student');
  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentPublic>>(`/assignments/${id}`);
      return data.data!;
    },
  });

  const { data: mySubs = [] } = useQuery({
    queryKey: ['assignment', id, 'my'],
    enabled: !!id && !!isStudent,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentSubmissionPublic[]>>(
        `/assignments/${id}/my-submission`
      );
      return data.data ?? [];
    },
  });

  const submitMut = useMutation({
    mutationFn: async (asDraft: boolean) => {
      await api.post(`/assignments/${id}/submissions`, { body, asDraft });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      setBody('');
    },
  });

  if (isLoading || !assignment) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Loading…</div>
    );
  }

  const latest = mySubs[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/assignments" className="text-sm text-slate-500 hover:text-slate-800">
            Assignments
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-900 truncate">{assignment.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border p-5 space-y-2">
          <div className="flex gap-2 text-xs text-slate-500">
            <span className="uppercase">{assignment.status}</span>
            <span>{assignment.maxMarks} marks</span>
            {assignment.dueAt && <span>Due {new Date(assignment.dueAt).toLocaleString()}</span>}
          </div>
          {assignment.description && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignment.description}</p>
          )}
          {assignment.instructions && (
            <div className="text-sm text-slate-600 border-t pt-3 mt-3">
              <p className="font-medium text-slate-800 mb-1">Instructions</p>
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
          {canManage && (
            <Link
              to={`/assignments/${id}/submissions`}
              className="inline-block mt-2 text-sm text-primary-700"
            >
              View submissions →
            </Link>
          )}
        </div>

        {isStudent && assignment.status === 'published' && (
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-medium">Your submission</h2>
            {latest && (
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <p>
                  Status: <strong>{latest.status}</strong>
                  {latest.isLate && ' (late)'}
                </p>
                {latest.body && <p className="mt-2 whitespace-pre-wrap">{latest.body}</p>}
                {latest.marksAwarded != null && (
                  <p className="mt-2 text-primary-700">
                    Marks: {latest.marksAwarded}/{assignment.maxMarks}
                  </p>
                )}
                {latest.feedback && <p className="mt-1 text-slate-500">{latest.feedback}</p>}
              </div>
            )}
            {(!latest ||
              latest.status === 'draft' ||
              assignment.allowResubmission) && (
              <>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={6}
                  placeholder="Write your answer…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border text-sm"
                    onClick={() => submitMut.mutate(true)}
                    disabled={submitMut.isPending}
                  >
                    Save draft
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm"
                    onClick={() => submitMut.mutate(false)}
                    disabled={submitMut.isPending || !body.trim()}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
