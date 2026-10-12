import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, StudentPublic } from '@university-lms/shared';
import { useAuth } from '../../hooks/useAuth';

export function StudentMePage() {
  const { user, logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentPublic>>('/students/me');
      return data.data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600">
              ← Dashboard
            </Link>
            <span className="font-semibold text-slate-900">My Student Profile</span>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-600">
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        {isLoading && <p className="text-slate-400 text-sm">Loading…</p>}
        {error && (
          <div className="bg-amber-50 border border-amber-100 text-amber-900 text-sm rounded-xl p-4">
            No student profile is linked to your account ({user?.email}). Ask an admin to set your
            student userId.
          </div>
        )}
        {data && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h1 className="text-xl font-bold text-slate-900">
              {data.firstName} {data.lastName}
            </h1>
            <p className="font-mono text-sm text-slate-500">{data.enrollmentNumber}</p>
            <p className="text-sm text-slate-600 capitalize">Status: {data.status}</p>
            <p className="text-sm text-slate-600">Email: {data.email || '—'}</p>
            <p className="text-sm text-slate-600 font-mono text-xs">
              Program: {data.programId || '—'} · Batch: {data.batchId || '—'} · Section:{' '}
              {data.sectionId || '—'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
