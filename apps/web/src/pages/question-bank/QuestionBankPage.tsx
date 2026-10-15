import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  QBankSubjectPublic,
  QBankUnitPublic,
  QBankTopicPublic,
  QuestionPublic,
  QuestionType,
  Difficulty,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';

const QUESTION_TYPES: QuestionType[] = [
  'mcq',
  'multi_select',
  'true_false',
  'fill_blank',
  'short',
  'long',
  'numerical',
  'matching',
];

export function QuestionBankPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [form, setForm] = useState({
    stem: '',
    type: 'mcq' as QuestionType,
    marks: 1,
    difficulty: 'medium' as Difficulty,
    options: [
      { key: 'A', text: '', isCorrect: true },
      { key: 'B', text: '', isCorrect: false },
      { key: 'C', text: '', isCorrect: false },
      { key: 'D', text: '', isCorrect: false },
    ],
    correctAnswer: '',
  });

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: subjects = [] } = useQuery({
    queryKey: ['qb', 'subjects'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QBankSubjectPublic[]>>('/question-bank/subjects', {
        params: { limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ['qb', 'units', subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QBankUnitPublic[]>>('/question-bank/units', {
        params: { subjectId, limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['qb', 'topics', unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QBankTopicPublic[]>>('/question-bank/topics', {
        params: { unitId, limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['qb', 'questions', subjectId, unitId, topicId, typeFilter],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuestionPublic[]>>('/question-bank/questions', {
        params: {
          limit: 50,
          subjectId: subjectId || undefined,
          unitId: unitId || undefined,
          topicId: topicId || undefined,
          type: typeFilter || undefined,
        },
      });
      return data.data ?? [];
    },
  });

  const createSubject = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/question-bank/subjects', { name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qb', 'subjects'] });
      setNewSubject('');
    },
  });

  const createQuestion = useMutation({
    mutationFn: async () => {
      if (!subjectId) throw new Error('Select a subject');
      const payload: Record<string, unknown> = {
        subjectId,
        unitId: unitId || null,
        topicId: topicId || null,
        type: form.type,
        stem: form.stem,
        marks: form.marks,
        difficulty: form.difficulty,
      };
      if (['mcq', 'multi_select', 'true_false'].includes(form.type)) {
        payload.options = form.options;
      }
      if (['fill_blank', 'numerical', 'true_false', 'short'].includes(form.type)) {
        payload.correctAnswer = form.correctAnswer || form.options.find((o) => o.isCorrect)?.key;
      }
      await api.post('/question-bank/questions', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qb', 'questions'] });
      setShowForm(false);
      setForm((f) => ({ ...f, stem: '', correctAnswer: '' }));
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-900">Question Bank</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Subject</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm min-w-[160px]"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setUnitId('');
                setTopicId('');
              }}
            >
              <option value="">All</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Unit</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm min-w-[140px]"
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                setTopicId('');
              }}
              disabled={!subjectId}
            >
              <option value="">All</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {canManage && (
            <>
              <div className="flex gap-2 items-end">
                <input
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder="New subject name"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white"
                  onClick={() => newSubject && createSubject.mutate(newSubject)}
                >
                  + Subject
                </button>
              </div>
              <button
                className="ml-auto px-4 py-2 text-sm rounded-lg bg-primary-600 text-white"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Cancel' : 'New Question'}
              </button>
            </>
          )}
        </div>

        {showForm && canManage && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-medium text-slate-900">Create question</h2>
            {!subjectId && (
              <p className="text-sm text-amber-700">Select a subject first.</p>
            )}
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="Question stem"
              value={form.stem}
              onChange={(e) => setForm({ ...form, stem: e.target.value })}
            />
            <div className="flex flex-wrap gap-3">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 text-sm w-24"
                value={form.marks}
                min={0}
                onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
              />
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value as Difficulty })
                }
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
            {['mcq', 'multi_select'].includes(form.type) && (
              <div className="space-y-2">
                {form.options.map((o, i) => (
                  <div key={o.key} className="flex gap-2 items-center">
                    <input
                      type="radio"
                      name="correct"
                      checked={o.isCorrect}
                      onChange={() =>
                        setForm({
                          ...form,
                          options: form.options.map((opt, j) => ({
                            ...opt,
                            isCorrect: j === i,
                          })),
                        })
                      }
                    />
                    <span className="text-sm font-medium w-6">{o.key}</span>
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      value={o.text}
                      onChange={(e) => {
                        const options = [...form.options];
                        options[i] = { ...options[i], text: e.target.value };
                        setForm({ ...form, options });
                      }}
                      placeholder={`Option ${o.key}`}
                    />
                  </div>
                ))}
              </div>
            )}
            {['fill_blank', 'numerical', 'short', 'true_false'].includes(form.type) && (
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Correct answer"
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              />
            )}
            <button
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
              disabled={!subjectId || !form.stem || createQuestion.isPending}
              onClick={() => createQuestion.mutate()}
            >
              Save question
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
          {!isLoading && questions.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No questions yet.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="p-4 flex gap-4 justify-between">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <span className="text-xs uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {q.type}
                  </span>
                  <span className="text-xs text-slate-400">{q.difficulty}</span>
                  <span className="text-xs text-slate-400">{q.marks} marks</span>
                </div>
                <p className="text-sm text-slate-900">{q.stem}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{q.status}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
