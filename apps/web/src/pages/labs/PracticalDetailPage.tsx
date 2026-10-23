import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { labsApi } from '../../lib/labsApi';
import { useAuthStore } from '../../stores/authStore';
import type { PracticalPublic, LabPublic } from '@university-lms/shared';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';

export function PracticalDetailPage() {
  const { practicalId } = useParams<{ practicalId: string }>();
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'].includes(r)
    ) ?? false;

  const [practical, setPractical] = useState<PracticalPublic | null>(null);
  const [labs, setLabs] = useState<LabPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!practicalId) return;
    setLoading(true);
    try {
      const [p, l] = await Promise.all([
        labsApi.getPractical(practicalId),
        labsApi.listLabs(practicalId),
      ]);
      setPractical(p.data.data);
      setLabs(l.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [practicalId]);

  const addLab = async () => {
    if (!practicalId || !newTitle.trim()) return;
    setSaving(true);
    try {
      await labsApi.createLab({ practicalId, title: newTitle.trim() });
      setNewTitle('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to create lab');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!practicalId) return;
    try {
      await labsApi.publishPractical(practicalId);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 flex justify-center text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link to="/labs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> All practicals
        </Link>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {practical && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{practical.title}</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Status: <span className="font-medium">{practical.status}</span>
                  {practical.maxScore != null ? ` · Max ${practical.maxScore}` : ''}
                </p>
              </div>
              {isStaff && practical.status !== 'published' && (
                <button
                  type="button"
                  onClick={() => void publish()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium"
                >
                  Publish
                </button>
              )}
            </div>
            {practical.description && (
              <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{practical.description}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Labs</h2>
          {isStaff && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="New lab title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void addLab()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          )}
          {labs.length === 0 ? (
            <p className="text-sm text-slate-500">No labs yet.</p>
          ) : (
            <ul className="space-y-2">
              {labs.map((lab) => (
                <li key={lab.id}>
                  <Link
                    to={`/labs/${practicalId}/labs/${lab.id}`}
                    className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-primary-300"
                  >
                    <span className="font-medium text-slate-900">{lab.title}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {lab.experimentCount ?? 0} experiment(s) · {lab.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
