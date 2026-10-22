import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  FacultyListItem,
  FacultyStats,
  DepartmentPublic,
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
import { Users, UserPlus, Search } from 'lucide-react';

export function FacultyListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  const { data: departments } = useQuery({
    queryKey: ['academic', 'departments', 'filter'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DepartmentPublic[]>>('/academic/departments', {
        params: { limit: 200 },
      });
      return data.data || [];
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['faculty', search, status, departmentId, page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyListItem[]>>('/faculty', {
        params: {
          search: search || undefined,
          status: status || undefined,
          departmentId: departmentId || undefined,
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
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Faculty Directory"
          subtitle="Teaching faculty roster, departmental appointments, and workloads"
          actions={
            <Can resource="faculty" action="create">
              <PillButton
                to="/faculty/new"
                variant="primary"
                icon={UserPlus}
              >
                Add Faculty
              </PillButton>
            </Can>
          }
        />

        {/* Donezo Primary KPI Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Total Faculty"
              value={stats.total}
              hint="Appointed academic instructors"
              icon={Users}
              variant="primary"
            />
            <KpiCard
              title="Active Teaching"
              value={stats.byStatus?.active || 0}
              hint="Delivering active coursework"
              icon={Users}
              variant="default"
            />
            <KpiCard
              title="On Leave"
              value={stats.byStatus?.on_leave || 0}
              hint="Sabbatical or study leave"
              icon={Users}
              variant="default"
            />
            <KpiCard
              title="Full-Time"
              value={stats.byEmploymentType?.full_time || 0}
              hint="Core institutional appointments"
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
                placeholder="Search name, employee ID, email…"
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
              <option value="retired">Retired</option>
              <option value="terminated">Terminated</option>
            </select>

            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
            >
              <option value="">All departments</option>
              {(departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        {error && (
          <SurfaceCard className="bg-rose-50 border-rose-200 text-rose-800 text-sm">
            Failed to load faculty directory. Please verify permissions.
          </SurfaceCard>
        )}

        {/* Data Table */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading faculty roster…</div>
          )}

          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Employee ID</th>
                    <th className="px-5 py-3.5">Faculty Member</th>
                    <th className="px-5 py-3.5">Designation</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.items || []).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {f.employeeId || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#eaf5ee] text-[#165239] font-bold flex items-center justify-center text-[10px] shrink-0">
                            {((f.firstName?.[0] || 'F') + (f.lastName?.[0] || '')).toUpperCase()}
                          </div>
                          <span>
                            {f.firstName} {f.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{f.designation || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-500 capitalize">
                        {(f.employmentType || '').replace('_', ' ') || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={f.status}
                          variant={
                            f.status === 'active'
                              ? 'success'
                              : f.status === 'on_leave'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <PillButton
                          to={`/faculty/${f.id}`}
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
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No faculty found matching current filters.
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
                Page {page} of {data.meta.totalPages}
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
export default FacultyListPage;
