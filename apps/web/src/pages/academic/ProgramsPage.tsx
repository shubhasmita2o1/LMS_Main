import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, ProgramPublic, DepartmentPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function ProgramsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    degreeType: 'ug',
    durationYears: 4,
    totalCredits: 160,
    coordinatorUserId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['academic', 'departments', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DepartmentPublic[]>>('/academic/departments', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['academic', 'programs', search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: search ? { search } : {},
      });
      return data.data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        code: form.code,
        departmentId: form.departmentId,
        degreeType: form.degreeType,
        durationYears: Number(form.durationYears),
        totalCredits: Number(form.totalCredits),
      };
      if (form.coordinatorUserId) payload.coordinatorUserId = form.coordinatorUserId;
      const { data } = await api.post<ApiResponse<ProgramPublic>>('/academic/programs', payload);
      if (!data.success) throw new Error(data.error?.message || 'Failed');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'programs'] });
      qc.invalidateQueries({ queryKey: ['academic', 'tree'] });
      setShowForm(false);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/programs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'programs'] });
      qc.invalidateQueries({ queryKey: ['academic', 'tree'] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/academic" className="text-sm text-slate-600 hover:text-slate-900">
            ← Academic
          </Link>
          <span className="font-semibold text-slate-900">Programs</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs…"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          <Can resource="program" action="create">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white"
            >
              {showForm ? 'Cancel' : '+ Program'}
            </button>
          </Can>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                placeholder="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select department</option>
                {(departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={form.degreeType}
                onChange={(e) => setForm({ ...form, degreeType: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="ug">UG</option>
                <option value="pg">PG</option>
                <option value="diploma">Diploma</option>
                <option value="doctoral">Doctoral</option>
                <option value="integrated">Integrated</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                placeholder="Duration (years)"
                value={form.durationYears}
                onChange={(e) => setForm({ ...form, durationYears: Number(e.target.value) })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Total credits"
                value={form.totalCredits}
                onChange={(e) => setForm({ ...form, totalCredits: Number(e.target.value) })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                placeholder="Coordinator user id (optional)"
                value={form.coordinatorUserId}
                onChange={(e) => setForm({ ...form, coordinatorUserId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono sm:col-span-2"
              />
            </div>
            <button
              onClick={() => createMut.mutate()}
              disabled={
                createMut.isPending || !form.name || !form.code || !form.departmentId
              }
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
            >
              Create
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading && <p className="p-6 text-slate-400 text-sm">Loading…</p>}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Degree</th>
                <th className="px-4 py-3 font-medium">Years</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data || []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 uppercase text-xs">{p.degreeType}</td>
                  <td className="px-4 py-3">{p.durationYears}</td>
                  <td className="px-4 py-3">{p.totalCredits}</td>
                  <td className="px-4 py-3">
                    <Can resource="program" action="delete">
                      <button
                        onClick={() => deleteMut.mutate(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
              {!isLoading && (data || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No programs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
