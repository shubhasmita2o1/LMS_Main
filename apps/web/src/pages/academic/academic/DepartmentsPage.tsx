import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, DepartmentPublic, UniversityPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    universityId: '',
    hodUserId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: universities } = useQuery({
    queryKey: ['academic', 'universities'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UniversityPublic[]>>('/academic/universities');
      return data.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['academic', 'departments', search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DepartmentPublic[]>>('/academic/departments', {
        params: search ? { search } : {},
      });
      return { items: data.data || [], meta: data.meta };
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        code: form.code,
        universityId: form.universityId,
      };
      if (form.hodUserId) payload.hodUserId = form.hodUserId;
      const { data } = await api.post<ApiResponse<DepartmentPublic>>('/academic/departments', payload);
      if (!data.success) throw new Error(data.error?.message || 'Failed');
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'departments'] });
      qc.invalidateQueries({ queryKey: ['academic', 'tree'] });
      setShowForm(false);
      setForm({ name: '', code: '', universityId: '', hodUserId: '' });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'departments'] });
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
          <span className="font-semibold text-slate-900">Departments</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[200px]"
          />
          <Can resource="department" action="create">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              {showForm ? 'Cancel' : '+ Department'}
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
                value={form.universityId}
                onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select university</option>
                {(universities || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="HOD user id (optional)"
                value={form.hodUserId}
                onChange={(e) => setForm({ ...form, hodUserId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.name || !form.code || !form.universityId}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
            >
              {createMut.isPending ? 'Saving…' : 'Create'}
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
                <th className="px-4 py-3 font-medium">HOD</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.items || []).map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.code}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {d.hodUserId || '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">{d.status}</td>
                  <td className="px-4 py-3">
                    <Can resource="department" action="delete">
                      <button
                        onClick={() => deleteMut.mutate(d.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No departments yet
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
