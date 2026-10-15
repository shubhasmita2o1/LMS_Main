import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  AssignmentPublic,
  AssignmentSubmissionPublic,
} from '@university-lms/shared';

export function AssignmentSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [marks, setMarks] = useState(0);
  const [feedback, setFeedback] = useState('');

  const { data: assignment } = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentPublic>>(`/assignments/${id}`);
      return data.data!;
    },
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['assignment', id, 'subs'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentSubmissionPublic[]>>(
        `/assignments/${id}/submissions`,
        { params: { limit: 100 } }
      );
      return data.data ?? [];
    },
  });

  const gradeMut = useMutation({
    mutationFn: async () => {
      if (!gradingId) return;
      await api.post(`/assignments/submissions/${gradingId}/grade`, {
        marksAwarded: marks,
        feedback,
        status: 'graded',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment', id, 'subs'] });
      setGradingId(null);
      setFeedback('');
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to={`/assignments/${id}`} className="text-sm text-slate-500">
            ← Assignment
          </Link>
          <h1 className="font-semibold text-slate-900">
            Submissions {assignment ? `— ${assignment.title}` : ''}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border divide-y">
          {isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
          {!isLoading && submissions.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No submissions yet.</p>
          )}
          {submissions.map((s) => (
            <div key={s.id} className="p-4 space-y-2">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{s.studentName || s.studentId}</p>
                  <p className="text-xs text-slate-500">
                    Attempt {s.attemptNumber} · {s.status}
                    {s.isLate ? ' · late' : ''}
                    {s.submittedAt && ` · ${new Date(s.submittedAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-sm">
                  {s.marksAwarded != null ? (
                    <span className="text-primary-700 font-medium">
                      {s.marksAwarded}/{assignment?.maxMarks}
                    </span>
                  ) : (
                    <button
                      className="text-sm px-3 py-1 rounded border"
                      onClick={() => {
                        setGradingId(s.id);
                        setMarks(0);
                        setFeedback('');
                      }}
                    >
                      Grade
                    </button>
                  )}
                </div>
              </div>
              {s.body && (
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                  {s.body}
                </p>
              )}
              {gradingId === s.id && (
                <div className="flex flex-wrap gap-2 items-end border-t pt-3">
                  <div>
                    <label className="text-xs text-slate-500">Marks</label>
                    <input
                      type="number"
                      className="block border rounded px-2 py-1 text-sm w-24"
                      value={marks}
                      max={assignment?.maxMarks}
                      min={0}
                      onChange={(e) => setMarks(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Feedback</label>
                    <input
                      className="block w-full border rounded px-2 py-1 text-sm"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <button
                    className="px-3 py-1.5 rounded bg-primary-600 text-white text-sm"
                    onClick={() => gradeMut.mutate()}
                  >
                    Save grade
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
