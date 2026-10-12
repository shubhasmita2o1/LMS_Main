import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, FacultyListItem, FacultyStats } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { useAuth } from '../../hooks/useAuth';

export function FacultyListPage() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['faculty', search, status, page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyListItem[]>>('/faculty', {
        params: {
          search: search || undefined,
          status: status || undefined,
          page,
          limit: 20,
        },
      });
      return { items: data.data || [], meta: data.meta };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['faculty', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyStats>>('/faculty/stats');
      return data.data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Dashboard
            </Link>
            <span className="font-semibold text-slate-900">Faculty</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Active" value={stats.byStatus?.active || 0} />
            <StatCard label="On leave" value={stats.byStatus?.on_leave || 0} />
            <StatCard label="Full-time" value={stats.byEmploymentType?.full_time || 0} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, employee ID, email…"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[220px] flex-1"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On leave</option>
            <option value="retired">Retired</option>
            <option value="terminated">Terminated</option>
          </select>
          <Can resource="faculty" action="create">
            <Link
              to="/faculty/new"
              className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              + Add Faculty
            </Link>
          </Can>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading && <p className="p-6 text-slate-400 text-sm">Loading…</p>}
          {error && <p className="p-6 text-red-600 text-sm">Failed to load faculty</p>}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.items || []).map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{f.employeeId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {f.firstName} {f.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.designation || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">
                    {(f.employmentType || '').replace('_', ' ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 capitalize">
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/faculty/${f.id}`}
                      className="text-xs text-primary-600 hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No faculty found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (data.meta.totalPages || 1) > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500 py-1.5">
              Page {page} / {data.meta.totalPages}
            </span>
            <button
              disabled={page >= (data.meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
