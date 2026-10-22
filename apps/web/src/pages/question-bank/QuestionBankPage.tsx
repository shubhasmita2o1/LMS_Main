import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  QBankSubjectPublic,
  QBankUnitPublic,
  QuestionPublic,
  QuestionType,
  Difficulty,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  PageShell,
  SectionHeader,
  SurfaceCard,
  PillButton,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import { BookOpen, Plus } from 'lucide-react';

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
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Question Repository"
          subtitle="Curate Bloom-taxonomy tagged questions by subject, syllabus unit, and cognitive difficulty"
          actions={
            canManage && (
              <PillButton
                variant={showForm ? 'secondary' : 'primary'}
                icon={Plus}
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Cancel' : 'New Question'}
              </PillButton>
            )
          }
        />

        {/* Filters Card */}
        <SurfaceCard padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Subject
              </label>
              <select
                className="px-3.5 py-1.5 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setUnitId('');
                  setTopicId('');
                }}
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Unit
              </label>
              <select
                className="px-3.5 py-1.5 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 min-w-[140px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                value={unitId}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  setTopicId('');
                }}
                disabled={!subjectId}
              >
                <option value="">All units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Question Type
              </label>
              <select
                className="px-3.5 py-1.5 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {canManage && (
              <div className="ml-auto flex items-end gap-2 pt-3 sm:pt-0">
                <input
                  className="px-3 py-1.5 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  placeholder="New subject name…"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <PillButton
                  variant="secondary"
                  size="sm"
                  disabled={!newSubject || createSubject.isPending}
                  loading={createSubject.isPending}
                  onClick={() => newSubject && createSubject.mutate(newSubject)}
                >
                  + Add Subject
                </PillButton>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Question Creation Form */}
        {showForm && canManage && (
          <SurfaceCard className="border-[#165239]/30 bg-[#eaf5ee]/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Item to Question Bank</h3>
            {!subjectId && (
              <p className="text-xs text-amber-700 font-semibold">Please select a subject from the filters above first.</p>
            )}

            <textarea
              className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              rows={3}
              placeholder="Question prompt / problem stem…"
              value={form.stem}
              onChange={(e) => setForm({ ...form, stem: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 capitalize focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  className="w-full px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={form.marks}
                  min={0}
                  onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Difficulty
                </label>
                <select
                  className="w-full px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 capitalize focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value as Difficulty })
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {['mcq', 'multi_select'].includes(form.type) && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">MCQ Options (Check the correct answer)</span>
                {form.options.map((o, i) => (
                  <div key={o.key} className="flex gap-2.5 items-center">
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
                      className="accent-[#165239]"
                    />
                    <span className="text-xs font-mono font-bold w-5">{o.key}.</span>
                    <input
                      className="flex-1 px-3 py-1.5 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                      value={o.text}
                      onChange={(e) => {
                        const options = [...form.options];
                        options[i] = { ...options[i], text: e.target.value };
                        setForm({ ...form, options });
                      }}
                      placeholder={`Option ${o.key} text…`}
                    />
                  </div>
                ))}
              </div>
            )}

            {['fill_blank', 'numerical', 'short', 'true_false'].includes(form.type) && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Correct Answer Key
                </label>
                <input
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  placeholder="Expected answer or numerical target…"
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <PillButton
                variant="primary"
                disabled={!subjectId || !form.stem || createQuestion.isPending}
                loading={createQuestion.isPending}
                onClick={() => createQuestion.mutate()}
              >
                Save to Repository
              </PillButton>
            </div>
          </SurfaceCard>
        )}

        {/* Questions Roster */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading questions…</div>
          )}

          {!isLoading && questions.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="No Questions in Repository"
              description="No questions match the selected subject, unit, or type filter."
            />
          )}

          {!isLoading && questions.length > 0 && (
            <div className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-5 flex gap-4 justify-between items-start hover:bg-slate-50/70 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239] uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                      <StatusBadge
                        label={q.difficulty}
                        variant={
                          q.difficulty === 'easy'
                            ? 'success'
                            : q.difficulty === 'hard'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      />
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                      {q.stem}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0">
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
export default QuestionBankPage;
