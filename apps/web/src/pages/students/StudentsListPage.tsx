import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, StudentListItem } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { useAuth } from '../../hooks/useAuth';

export function StudentsListPage() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', search, status, page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentListItem[]>>('/students', {
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
    queryKey: ['students', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ total: number; byStatus: Record<string, number> }>>(
        '/students/stats'
      );
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
            <span className="font-semibold text-slate-900">Students</span>
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
            <StatCard label="Graduated" value={stats.byStatus?.graduated || 0} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, enrollment, email…"
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
            <option value="suspended">Suspended</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="graduated">Graduated</option>
            <option value="alumni">Alumni</option>
          </select>
          <Can resource="student" action="export">
            <a
              href={`/api/v1/students/export?format=csv${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              onClick={async (e) => {
                e.preventDefault();
                const res = await api.get('/students/export', {
                  params: { format: 'csv', status: status || undefined, search: search || undefined },
                  responseType: 'blob',
                });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'students.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </a>
          </Can>
          <Can resource="student" action="create">
            <Link
              to="/students/new"
              className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              + Add Student
            </Link>
          </Can>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading && <p className="p-6 text-slate-400 text-sm">Loading…</p>}
          {error && <p className="p-6 text-red-600 text-sm">Failed to load students</p>}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Enrollment</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.items || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.enrollmentNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 capitalize">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-xs text-primary-600 hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No students found
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
