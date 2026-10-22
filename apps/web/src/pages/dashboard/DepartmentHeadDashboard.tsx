import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
} from '../../components/ui';

interface DeptStats {
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
  totalUsers: number;
}

interface FacultyCourseItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  credits?: number;
  role?: string;
  isPrimary?: boolean;
  modulesCount: number;
  enrollmentsCount: number;
}

export function DepartmentHeadDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats', 'dept-overview'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DeptStats>>('/admin/stats/overview');
      return data.data;
    },
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['faculty', 'me', 'courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyCourseItem[]>>('/faculty/me/courses');
      return data.data || [];
    },
  });

  const stats = statsData;
  const myCourses = coursesData || [];

  return (
    <PageShell>
      {/* Header */}
      <SectionHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf5ee] text-[#165239]">
            <Building2 className="w-3.5 h-3.5" />
            Department Head Portal
          </span>
        }
        title={`Welcome, ${user?.firstName ? `${user.firstName} ${user.lastName}` : 'Department Head'}`}
        description="Oversee departmental academic governance, faculty teaching workloads, syllabus design, and student outcomes."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/courses" variant="primary" icon={BookOpen}>
              Curriculum &amp; Syllabi
            </PillButton>
            <PillButton to="/faculty" variant="secondary" icon={Users}>
              Faculty Roster
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Department Faculty"
          value={statsLoading ? '—' : stats?.totalFaculty ?? 0}
          hint="View faculty workload & assignments"
          icon={Users}
          variant="primary"
          to="/faculty"
        />

        <KpiCard
          title="Department Students"
          value={statsLoading ? '—' : stats?.totalStudents ?? 0}
          hint="Student cohort registry"
          icon={GraduationCap}
          variant="default"
          to="/students"
        />

        <KpiCard
          title="Active Courses"
          value={statsLoading ? '—' : stats?.totalCourses ?? 0}
          hint="Curriculum & syllabus units"
          icon={BookOpen}
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="My Teaching Courses"
          value={coursesLoading ? '—' : myCourses.length}
          hint="Direct instructional load"
          icon={CalendarCheck2}
          variant="default"
          to="/courses"
        />
      </div>

      {/* Department Operations Workflows */}
      <SurfaceCard>
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#165239]" />
            Department Academic Leadership Workflows
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute curriculum approvals, monitor faculty teaching, and track student outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Link
            to="/courses"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#165239] group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Course &amp; Curriculum Design</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Define syllabi, learning modules, and OBE CO-PO targets.</p>
            </div>
          </Link>

          <Link
            to="/faculty"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Faculty Management</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Assign course instructors, review designations &amp; workloads.</p>
            </div>
          </Link>

          <Link
            to="/students"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Student Directory</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Filter students by batch, section, and enrollment status.</p>
            </div>
          </Link>

          <Link
            to="/attendance"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Department Attendance</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Monitor session logs, mark registers, flag shortages.</p>
            </div>
          </Link>

          <Link
            to="/gradebook"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Gradebook &amp; Transcripts</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Verify internal marks distribution and academic standing.</p>
            </div>
          </Link>

          <Link
            to="/academic"
            className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Academic Hierarchy</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Manage department programs, batches, and class sections.</p>
            </div>
          </Link>
        </div>
      </SurfaceCard>

      {/* Teaching Courses (if any) */}
      {myCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900">My Teaching Courses</h2>
            <Link
              to="/courses"
              className="text-xs font-semibold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
            >
              <span>All Courses Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map((c) => (
              <SurfaceCard
                key={c.id}
                interactive={true}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239]">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{c.credits ?? 3} Credits</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {c.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{c.enrollmentsCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Modules</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{c.modulesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <PillButton to={`/learn/courses/${c.id}`} variant="primary" size="sm">
                    LMS Content
                  </PillButton>
                  <PillButton to={`/attendance?courseId=${c.id}`} variant="outline" size="sm">
                    Attendance
                  </PillButton>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
export default DepartmentHeadDashboard;
