import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, QuizPublic, QuestionPublic } from '@university-lms/shared';

export function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [subjectId, setSubjectId] = useState('');

  const { data: quiz } = useQuery({
    queryKey: ['quiz', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuizPublic>>(`/quizzes/${id}`);
      return data.data!;
    },
  });

  const { data: bank = [] } = useQuery({
    queryKey: ['qb', 'pick', subjectId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuestionPublic[]>>('/question-bank/questions', {
        params: { limit: 100, subjectId: subjectId || undefined, status: 'active' },
      });
      return data.data ?? [];
    },
  });

  const attachMut = useMutation({
    mutationFn: async () => {
      const existing = quiz?.questions?.map((q) => q.questionId) || [];
      const merged = [...new Set([...existing, ...selected])];
      await api.post(`/quizzes/${id}/questions`, {
        questions: merged.map((questionId, order) => ({ questionId, order })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', id] });
      setSelected([]);
    },
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      await api.post(`/quizzes/${id}/publish`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz', id] }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/quizzes" className="text-sm text-slate-500">
            Quizzes
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-900">Builder — {quiz?.title}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Attached questions ({quiz?.questions?.length || 0})</h2>
          <p className="text-xs text-slate-500">Total marks: {quiz?.totalMarks ?? 0}</p>
          <ul className="text-sm space-y-1 max-h-80 overflow-auto">
            {(quiz?.questions || []).map((q, i) => (
              <li key={q.questionId} className="border-b py-1.5 text-slate-700">
                #{i + 1} {q.questionId.slice(-6)} {q.marks != null ? `(${q.marks}m)` : ''}
              </li>
            ))}
          </ul>
          {quiz?.status === 'draft' && (
            <button
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm"
              onClick={() => publishMut.mutate()}
              disabled={!quiz?.questions?.length}
            >
              Publish quiz
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Pick from question bank</h2>
          <div className="max-h-80 overflow-auto space-y-1">
            {bank.map((q) => (
              <label
                key={q.id}
                className="flex gap-2 items-start text-sm p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(q.id)}
                  onChange={(e) => {
                    setSelected((prev) =>
                      e.target.checked ? [...prev, q.id] : prev.filter((x) => x !== q.id)
                    );
                  }}
                />
                <span>
                  <span className="text-xs uppercase text-slate-400 mr-2">{q.type}</span>
                  {q.stem.slice(0, 120)}
                </span>
              </label>
            ))}
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
            disabled={!selected.length || attachMut.isPending}
            onClick={() => attachMut.mutate()}
          >
            Attach selected ({selected.length})
          </button>
        </div>
      </main>
    </div>
  );
}
