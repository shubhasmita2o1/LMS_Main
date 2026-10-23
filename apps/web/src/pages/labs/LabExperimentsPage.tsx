import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { labsApi } from '../../lib/labsApi';
import { useAuthStore } from '../../stores/authStore';
import type { ExperimentPublic } from '@university-lms/shared';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';

export function LabExperimentsPage() {
  const { practicalId, labId } = useParams<{ practicalId: string; labId: string }>();
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'].includes(r)
    ) ?? false;

  const [items, setItems] = useState<ExperimentPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('Write a function that returns the sum of two integers.');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!labId) return;
    setLoading(true);
    try {
      const res = await labsApi.listExperiments(labId);
      setItems(res.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [labId]);

  const create = async () => {
    if (!labId || !title.trim()) return;
    setSaving(true);
    try {
      await labsApi.createExperiment({
        labId,
        title: title.trim(),
        statement,
        allowedLanguages: ['python', 'javascript'],
        starterCode: {
          python: '# Write your solution\ndef solve(a, b):\n    return a + b\n\nprint(solve(*map(int, input().split())))\n',
          javascript:
            '// Write your solution\nconst fs = require("fs");\nconst [a,b] = fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);\nconsole.log(a+b);\n',
        },
        testCases: [
          { input: '1 2', expectedOutput: '3', visibility: 'public', weight: 1, name: 'Sample' },
          { input: '10 20', expectedOutput: '30', visibility: 'hidden', weight: 2, name: 'Hidden' },
        ],
        evaluationMode: 'auto',
        status: 'published',
      });
      setTitle('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link
          to={`/labs/${practicalId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to practical
        </Link>

        <h1 className="text-xl font-bold text-slate-900">Experiments</h1>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isStaff && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-sm">Quick-create experiment (auto + sample tests)</h3>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void create()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {saving ? 'Creating…' : 'Create experiment'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No experiments yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((ex) => (
              <li key={ex.id}>
                <Link
                  to={`/labs/experiments/${ex.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-primary-300"
                >
                  <div className="font-medium text-slate-900">{ex.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {ex.allowedLanguages?.join(', ')} · {ex.evaluationMode} · max {ex.maxScore} ·{' '}
                    {ex.testCases?.length || 0} tests · {ex.status}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
