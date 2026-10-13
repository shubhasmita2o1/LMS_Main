import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, CoursePublic, ProgramPublic } from '@university-lms/shared';
import { useAuth } from '../../hooks/useAuth';

const emptyForm = {
  programId: '',
  departmentId: '',
  code: '',
  name: '',
  shortName: '',
  description: '',
  courseType: 'core' as string,
  creditsTheory: 3,
  creditsPractical: 0,
  lectureHours: 0,
  labHours: 0,
  tutorialHours: 0,
  status: 'draft' as string,
  isElective: false,
  isLab: false,
  maxSeats: '' as string | number,
  syllabusOutline: '',
  learningOutcomes: [] as Array<{ code?: string; description: string }>,
};

export function CourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [outcomeText, setOutcomeText] = useState('');
  const [error, setError] = useState('');

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['courses', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CoursePublic>>(`/courses/${id}`);
      return data.data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        programId: existing.programId || '',
        departmentId: existing.departmentId || '',
        code: existing.code || '',
        name: existing.name || '',
        shortName: existing.shortName || '',
        description: existing.description || '',
        courseType: existing.courseType || 'core',
        creditsTheory: existing.credits?.theory ?? 0,
        creditsPractical: existing.credits?.practical ?? 0,
        lectureHours: existing.lectureHours ?? 0,
        labHours: existing.labHours ?? 0,
        tutorialHours: existing.tutorialHours ?? 0,
        status: existing.status || 'draft',
        isElective: existing.isElective ?? false,
        isLab: existing.isLab ?? false,
        maxSeats: existing.maxSeats ?? '',
        syllabusOutline: existing.syllabusOutline || '',
        learningOutcomes: existing.learningOutcomes || [],
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        programId: form.programId,
        departmentId: form.departmentId || null,
        code: form.code,
        name: form.name,
        shortName: form.shortName || undefined,
        description: form.description || undefined,
        courseType: form.courseType,
        credits: {
          theory: Number(form.creditsTheory) || 0,
          practical: Number(form.creditsPractical) || 0,
          total: (Number(form.creditsTheory) || 0) + (Number(form.creditsPractical) || 0),
        },
        lectureHours: Number(form.lectureHours) || undefined,
        labHours: Number(form.labHours) || undefined,
        tutorialHours: Number(form.tutorialHours) || undefined,
        status: form.status,
        isElective: form.isElective,
        isLab: form.isLab,
        maxSeats: form.maxSeats === '' ? null : Number(form.maxSeats),
        syllabusOutline: form.syllabusOutline || undefined,
        learningOutcomes: form.learningOutcomes,
      };
      if (isEdit) {
        const { data } = await api.patch<ApiResponse<CoursePublic>>(`/courses/${id}`, payload);
        return data.data;
      }
      const { data } = await api.post<ApiResponse<CoursePublic>>('/courses', payload);
      return data.data;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate(`/courses/${course?.id || id}`);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    },
  });

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const addOutcome = () => {
    if (!outcomeText.trim()) return;
    setForm((f) => ({
      ...f,
      learningOutcomes: [...f.learningOutcomes, { description: outcomeText.trim() }],
    }));
    setOutcomeText('');
  };

  const removeOutcome = (idx: number) => {
    setForm((f) => ({
      ...f,
      learningOutcomes: f.learningOutcomes.filter((_, i) => i !== idx),
    }));
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/courses" className="text-sm text-slate-600 hover:text-slate-900">
              ← Courses
            </Link>
            <span className="font-semibold text-slate-900">
              {isEdit ? 'Edit Course' : 'New Course'}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            mutation.mutate();
          }}
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
              <input
                required
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono uppercase"
                placeholder="CS301"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Program *</label>
              <select
                required
                value={form.programId}
                onChange={(e) => set('programId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Select program</option>
                {(programs || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Data Structures"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Short name</label>
              <input
                value={form.shortName}
                onChange={(e) => set('shortName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={form.courseType}
                onChange={(e) => {
                  set('courseType', e.target.value);
                  if (e.target.value === 'elective') set('isElective', true);
                  if (e.target.value === 'lab') set('isLab', true);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="lab">Lab</option>
                <option value="project">Project</option>
                <option value="seminar">Seminar</option>
                <option value="audit">Audit</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Theory credits</label>
              <input
                type="number"
                min={0}
                value={form.creditsTheory}
                onChange={(e) => set('creditsTheory', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Practical credits
              </label>
              <input
                type="number"
                min={0}
                value={form.creditsPractical}
                onChange={(e) => set('creditsPractical', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lecture hrs</label>
              <input
                type="number"
                min={0}
                value={form.lectureHours}
                onChange={(e) => set('lectureHours', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lab hrs</label>
              <input
                type="number"
                min={0}
                value={form.labHours}
                onChange={(e) => set('labHours', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max seats</label>
              <input
                type="number"
                min={0}
                value={form.maxSeats}
                onChange={(e) => set('maxSeats', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Syllabus outline</label>
            <textarea
              value={form.syllabusOutline}
              onChange={(e) => set('syllabusOutline', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Learning outcomes
            </label>
            <ul className="space-y-1 mb-2">
              {form.learningOutcomes.map((o, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm bg-slate-50 rounded px-2 py-1.5"
                >
                  <span className="flex-1 text-slate-700">{o.description}</span>
                  <button
                    type="button"
                    onClick={() => removeOutcome(i)}
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Add learning outcome…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOutcome();
                  }
                }}
              />
              <button
                type="button"
                onClick={addOutcome}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create course'}
            </button>
            <Link
              to={isEdit ? `/courses/${id}` : '/courses'}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
