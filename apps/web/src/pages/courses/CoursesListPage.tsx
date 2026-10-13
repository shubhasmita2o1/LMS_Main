import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, CourseListItem, CourseStats } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { useAuth } from '../../hooks/useAuth';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

export function CoursesListPage() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [courseType, setCourseType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', search, status, courseType, page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: {
          search: search || undefined,
          status: status || undefined,
          courseType: courseType || undefined,
          page,
          limit: 20,
        },
      });
      return { items: data.data || [], meta: data.meta };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['courses', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseStats>>('/courses/stats');
      return data.data;
    },
  });

  const items = data?.items || [];
  const meta = data?.meta as { page?: number; totalPages?: number; total?: number } | undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Dashboard
            </Link>
            <span className="font-semibold text-slate-900">Courses</span>
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
            <StatCard label="Draft" value={stats.byStatus?.draft || 0} />
            <StatCard label="Core" value={stats.byType?.core || 0} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="search"
            placeholder="Search code or name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={courseType}
            onChange={(e) => {
              setCourseType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All types</option>
            <option value="core">Core</option>
            <option value="elective">Elective</option>
            <option value="lab">Lab</option>
            <option value="project">Project</option>
            <option value="seminar">Seminar</option>
            <option value="audit">Audit</option>
            <option value="other">Other</option>
          </select>
          <Can resource="course" action="create">
            <Link
              to="/courses/new"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              + Add Course
            </Link>
          </Can>
        </div>

        {isLoading && <p className="text-slate-500 text-sm">Loading courses…</p>}
        {error && (
          <p className="text-red-600 text-sm">Failed to load courses. Check permissions.</p>
        )}
        {!isLoading && items.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
            No courses found. Create the first course to get started.
          </div>
        )}

        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Credits</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">
                      {c.code}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/courses/${c.id}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{c.courseType}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.credits?.total ?? 0}
                      <span className="text-slate-400 text-xs ml-1">
                        (T{c.credits?.theory ?? 0}/P{c.credits?.practical ?? 0})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : c.status === 'draft'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/courses/${c.id}`}
                        className="text-slate-600 hover:text-primary-600 text-xs mr-2"
                      >
                        View
                      </Link>
                      <Can resource="course" action="update">
                        <Link
                          to={`/courses/${c.id}/edit`}
                          className="text-slate-600 hover:text-primary-600 text-xs"
                        >
                          Edit
                        </Link>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (meta.totalPages || 1) > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
            <span>
              Page {meta.page || page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white"
              >
                Previous
              </button>
              <button
                disabled={page >= (meta.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
