import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { ApiResponse } from '@university-lms/shared';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId: string | null;
  isActive: boolean;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<ApiResponse<UserRow[]>>('/users');
        if (data.success && data.data) setUsers(data.data);
        else setError('Failed to load users');
      } catch (err: unknown) {
        const ax = err as { response?: { data?: ApiResponse } };
        setError(ax.response?.data?.error?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dashboard
          </Link>
          <span className="font-semibold text-slate-900">Users</span>
          <div />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-500">Loading…</p>}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.roles.join(', ')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {u.tenantId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.isActive
                            ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs'
                            : 'text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No users found in scope
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
