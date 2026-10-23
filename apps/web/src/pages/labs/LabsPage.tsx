import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { labsApi } from '../../lib/labsApi';
import { useAuthStore } from '../../stores/authStore';
import type { PracticalPublic } from '@university-lms/shared';
import { Plus, Loader2 } from 'lucide-react';

export function LabsPage() {
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'].includes(r)
    ) ?? false;

  const [items, setItems] = useState<PracticalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await labsApi.listPracticals({ limit: 50 });
      setItems(res.data.data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load practicals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!title.trim() || !courseId.trim()) return;
    setSaving(true);
    try {
      await labsApi.createPractical({ title: title.trim(), courseId: courseId.trim() });
      setShowCreate(false);
      setTitle('');
      setCourseId('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <SectionHeader
          title="Practical & Labs"
          subtitle="Course-linked practical work, experiments, and isolated code execution"
          actions={
            isStaff ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" /> New Practical
              </button>
            ) : null
          }
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {showCreate && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900">Create practical</h3>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Course ID (ObjectId)"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void create()}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading practicals…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500 text-sm">
            {isStaff
              ? 'No practicals yet. Create one linked to a course.'
              : 'No published practicals for your enrolled courses.'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/labs/${p.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.courseCode || p.courseName || p.courseId}
                      {p.labCount != null ? ` · ${p.labCount} lab(s)` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">{p.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
