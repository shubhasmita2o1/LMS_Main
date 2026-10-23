import { useState } from 'react';
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
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusBadge,
} from '../../components/ui';
import { Users, UserPlus, Download, Search } from 'lucide-react';

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

  const handleExport = async () => {
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
  };

  return (
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Student Information System"
          subtitle="SIS roster, institutional enrollment profiles, and cohort status"
          actions={
            <div className="flex items-center gap-2.5">
              <Can resource="student" action="export">
                <PillButton
                  variant="secondary"
                  icon={Download}
                  onClick={handleExport}
                >
                  Export CSV
                </PillButton>
              </Can>
              <Can resource="student" action="create">
                <PillButton
                  to="/students/new"
                  variant="primary"
                  icon={UserPlus}
                >
                  Add Student
                </PillButton>
              </Can>
            </div>
          }
        />

        {/* Donezo Primary KPI Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Total Students"
              value={stats.total}
              hint="Registered SIS profiles"
              icon={Users}
              variant="primary"
            />
            <KpiCard
              title="Active Cohort"
              value={stats.byStatus?.active || 0}
              hint="Attending semester classes"
              icon={Users}
              variant="default"
            />
            <KpiCard
              title="On Leave"
              value={stats.byStatus?.on_leave || 0}
              hint="Approved semester leave"
              icon={Users}
              variant="default"
            />
            <KpiCard
              title="Graduated"
              value={stats.byStatus?.graduated || 0}
              hint="Alumni record completed"
              icon={Users}
              variant="default"
            />
          </div>
        )}

        {/* Filters Card */}
        <SurfaceCard padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, enrollment, email…"
                className="w-full pl-9 pr-4 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
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
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 max-w-[180px] focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
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
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 max-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
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
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 max-w-[140px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
            >
              <option value="">All sections</option>
              {(sections || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        {error && (
          <SurfaceCard className="bg-rose-50 border-rose-200 text-rose-800 text-sm">
            Failed to load students. Please refresh or verify permissions.
          </SurfaceCard>
        )}

        {/* Data Table Container */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading student directory…</div>
          )}

          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Enrollment #</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Program</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.items || []).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#eaf5ee] text-[#165239] font-bold flex items-center justify-center text-[10px] shrink-0">
                            {((s.firstName?.[0] || 'S') + (s.lastName?.[0] || '')).toUpperCase()}
                          </div>
                          <span>
                            {s.firstName} {s.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {s.enrollmentNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={s.status}
                          variant={
                            s.status === 'active'
                              ? 'success'
                              : s.status === 'graduated'
                              ? 'info'
                              : s.status === 'on_leave'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {s.programId ? s.programId.slice(-6) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <PillButton
                          to={`/students/${s.id}`}
                          variant="outline"
                          size="sm"
                        >
                          View
                        </PillButton>
                      </td>
                    </tr>
                  ))}
                  {(data?.items || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No students found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && (data.meta.totalPages || 1) > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <div className="flex gap-2">
                <PillButton
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </PillButton>
                <PillButton
                  variant="secondary"
                  size="sm"
                  disabled={page >= (data.meta.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </PillButton>
              </div>
            </div>
          )}
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
export default StudentsListPage;
