import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, CourseListItem, CourseStats } from '@university-lms/shared';
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
import { BookOpen, Plus, Search } from 'lucide-react';

export function CoursesListPage() {
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
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Curriculum &amp; Courses"
          subtitle="Course catalog, academic credits, syllabus modules, and OBE outcome mappings"
          actions={
            <Can resource="course" action="create">
              <PillButton
                to="/courses/new"
                variant="primary"
                icon={Plus}
              >
                Create Course
              </PillButton>
            </Can>
          }
        />

        {/* Donezo Primary KPI Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Total Courses"
              value={stats.total}
              hint="Catalogued curriculum courses"
              icon={BookOpen}
              variant="primary"
            />
            <KpiCard
              title="Active Offerings"
              value={stats.byStatus?.active || 0}
              hint="Running this academic term"
              icon={BookOpen}
              variant="default"
            />
            <KpiCard
              title="Draft Syllabi"
              value={stats.byStatus?.draft || 0}
              hint="Pending approval & review"
              icon={BookOpen}
              variant="default"
            />
            <KpiCard
              title="Core Subjects"
              value={stats.byType?.core || 0}
              hint="Mandatory degree coursework"
              icon={BookOpen}
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
                type="search"
                placeholder="Search course code or name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
              className="px-3.5 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
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
          </div>
        </SurfaceCard>

        {error && (
          <SurfaceCard className="bg-rose-50 border-rose-200 text-rose-800 text-sm">
            Failed to load courses. Please verify permissions.
          </SurfaceCard>
        )}

        {/* Courses Table Container */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading courses catalog…</div>
          )}

          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Course Name</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Credits</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239]">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-600">
                        {(c as any).type || (c as any).courseType || 'core'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {typeof c.credits === 'object' && c.credits !== null
                          ? c.credits.total
                          : (c.credits as any) ?? 3}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={c.status}
                          variant={
                            c.status === 'active'
                              ? 'success'
                              : c.status === 'draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <PillButton
                          to={`/courses/${c.id}`}
                          variant="outline"
                          size="sm"
                        >
                          View
                        </PillButton>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No courses found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {meta && (meta.totalPages || 1) > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {meta.totalPages}
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
                  disabled={page >= (meta.totalPages || 1)}
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
export default CoursesListPage;
