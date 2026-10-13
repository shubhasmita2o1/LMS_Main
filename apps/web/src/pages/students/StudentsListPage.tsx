import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  StudentListItem,
  ProgramPublic,
  BatchPublic,
  SectionPublic,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { AppLayout } from '../../components/layout/AppLayout';

export function StudentsListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [page, setPage] = useState(1);

  const { data: programs } = useQuery({
    queryKey: ['academic', 'programs', 'filter'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: { limit: 200 },
      });
      return data.data || [];
    },
  });

  const { data: batches } = useQuery({
    queryKey: ['academic', 'batches', 'filter', programId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BatchPublic[]>>('/academic/batches', {
        params: { limit: 200, programId: programId || undefined },
      });
      return data.data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['academic', 'sections', 'filter', batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SectionPublic[]>>('/academic/sections', {
        params: { limit: 200, batchId },
      });
      return data.data || [];
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', search, status, programId, batchId, sectionId, page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentListItem[]>>('/students', {
        params: {
          search: search || undefined,
          status: status || undefined,
          programId: programId || undefined,
          batchId: batchId || undefined,
          sectionId: sectionId || undefined,
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
      const { data } = await api.get<
        ApiResponse<{ total: number; byStatus: Record<string, number> }>
      >('/students/stats');
      return data.data;
    },
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">SIS roster with academic filters</p>
        </div>
        <Can resource="student" action="create">
          <Link
            to="/students/new"
            className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          >
            + Add Student
          </Link>
        </Can>
      </div>

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
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[200px] flex-1"
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
        <select
          value={programId}
          onChange={(e) => {
            setProgramId(e.target.value);
            setBatchId('');
            setSectionId('');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm max-w-[180px]"
        >
          <option value="">All programs</option>
          {(programs || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={batchId}
          onChange={(e) => {
            setBatchId(e.target.value);
            setSectionId('');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm max-w-[160px]"
        >
          <option value="">All batches</option>
          {(batches || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name || b.id}
            </option>
          ))}
        </select>
        <select
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value);
            setPage(1);
          }}
          disabled={!batchId}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm max-w-[140px] disabled:opacity-50"
        >
          <option value="">All sections</option>
          {(sections || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
        <Can resource="student" action="export">
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            onClick={async () => {
              const res = await api.get('/students/export', {
                params: {
                  format: 'csv',
                  status: status || undefined,
                  search: search || undefined,
                  programId: programId || undefined,
                  batchId: batchId || undefined,
                  sectionId: sectionId || undefined,
                },
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
          </button>
        </Can>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">Failed to load students.</p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading && <p className="p-6 text-slate-400 text-sm">Loading…</p>}
        {!isLoading && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Enrollment #</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.items || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {s.enrollmentNumber || '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{s.status}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {s.programId ? s.programId.slice(-6) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-primary-600 hover:underline text-xs font-medium"
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
        )}
      </div>

      {data?.meta && (data.meta.totalPages || 1) > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-slate-500">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= (data.meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
