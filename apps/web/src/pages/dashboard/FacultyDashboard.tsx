import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck2,
  FileCheck2,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusBadge,
  EmptyState,
} from '../../components/ui';

interface FacultyCourseItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  credits?: number;
  status?: string;
  role?: string;
  isPrimary?: boolean;
  modulesCount: number;
  enrollmentsCount: number;
}

export function FacultyDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['faculty', 'me', 'courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyCourseItem[]>>('/faculty/me/courses');
      return data.data || [];
    },
  });

  const courses = coursesData || [];
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollmentsCount || 0), 0);
  const totalModules = courses.reduce((acc, c) => acc + (c.modulesCount || 0), 0);

  return (
    <PageShell>
      {/* Header */}
      <SectionHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf5ee] text-[#165239]">
            <GraduationCap className="w-3.5 h-3.5" />
            Faculty Academic Portal
          </span>
        }
        title={`Welcome back, ${user?.firstName ? `${user.firstName} ${user.lastName}` : 'Professor'}`}
        description="Manage course curriculum delivery, track student attendance, and evaluate submissions."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/attendance" variant="secondary" icon={CalendarCheck2}>
              Mark Attendance
            </PillButton>
            <PillButton to="/assignments" variant="primary" icon={Plus}>
              Create Assignment
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Courses Teaching"
          value={isLoading ? '—' : courses.length}
          hint="Assigned instructional load"
          icon={BookOpen}
          variant="primary"
          to="/courses"
        />

        <KpiCard
          title="Total Enrolled Students"
          value={isLoading ? '—' : totalStudents}
          hint="Across all active sections"
          icon={Users}
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="Curriculum Modules"
          value={isLoading ? '—' : totalModules}
          hint="Active learning syllabus units"
          icon={Layers}
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="Instructional Quality"
          value="OBE"
          hint="CO-PO Outcomes Mapped"
          icon={Award}
          variant="default"
          to="/courses"
          badge="Accredited"
          badgeVariant="success"
        />
      </div>

      {/* Main Section: Assigned Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Teaching Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live courses assigned to you for teaching, syllabus management, and student assessments.
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
          >
            <span>All Courses Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <SurfaceCard className="text-center py-12 text-slate-400 text-sm">
            Loading your assigned courses…
          </SurfaceCard>
        ) : error ? (
          <SurfaceCard className="bg-amber-50/60 border-amber-200 text-amber-900 text-sm">
            <p className="font-semibold">Unable to load assigned courses</p>
            <p className="text-xs mt-1 text-amber-700">
              Make sure your user account ({user?.email}) is linked to an active faculty record in your institution.
            </p>
          </SurfaceCard>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Courses Assigned Yet"
            description="You haven't been assigned as an instructor to any courses for the current term. Contact your Department Head to map your teaching workload."
            action={
              <PillButton to="/courses" variant="primary">
                Browse University Curriculum
              </PillButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <SurfaceCard
                key={course.id}
                interactive={true}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239]">
                      {course.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {course.isPrimary && (
                        <StatusBadge label="Primary" variant="success" size="sm" />
                      )}
                      {course.credits !== undefined && (
                        <span className="text-xs text-slate-400 font-medium">
                          {course.credits} Credits
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {course.name}
                  </h3>
                  {course.type && (
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {course.type} Course
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{course.enrollmentsCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Modules</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{course.modulesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                  <PillButton to={`/learn/courses/${course.id}`} variant="primary" size="sm">
                    LMS Lessons
                  </PillButton>
                  <div className="flex items-center gap-1.5">
                    <PillButton to={`/attendance?courseId=${course.id}`} variant="outline" size="sm">
                      Attendance
                    </PillButton>
                    <PillButton to={`/assignments?courseId=${course.id}`} variant="outline" size="sm">
                      Tasks
                    </PillButton>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>

      {/* Fast Shortcuts & Instructional Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Academic Actions */}
        <SurfaceCard>
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#165239]" />
              Instructional Workflows
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Key daily operations for academic delivery and assessment tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/attendance"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-emerald-50 text-[#165239] group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Attendance Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Take daily attendance by lecture section.</p>
              </div>
            </Link>

            <Link
              to="/assignments"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Assignments &amp; Tasks</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Review submissions &amp; grade homework.</p>
              </div>
            </Link>

            <Link
              to="/quizzes"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Quiz &amp; Tests</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Build auto-graded quizzes and exams.</p>
              </div>
            </Link>

            <Link
              to="/question-bank"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Question Repository</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Curate Bloom-taxonomy tagged questions.</p>
              </div>
            </Link>

            <Link
              to="/gradebook"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Gradebook Matrix</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Compute continuous internal assessment.</p>
              </div>
            </Link>

            <Link
              to="/faculty/me"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">My Faculty Profile</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">View employee ID &amp; department details.</p>
              </div>
            </Link>
          </div>
        </SurfaceCard>

        {/* Academic Compliance & Guidelines */}
        <SurfaceCard className="flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#165239]" />
                Academic Term Reminders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional quality and OBE compliance benchmarks.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Attendance Threshold</span>
                  <span className="text-[#165239] font-mono">75% Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Students below 75% aggregate attendance will be barred from mid-term examinations. Please ensure daily session registers are marked on time.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>OBE Course Outcomes (COs)</span>
                  <span className="text-[#165239] font-mono">Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  All assignments and quizzes should be mapped to Course Outcomes (CO1–CO5) for NAAC / NBA direct attainment computation.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Continuous Assessment Weightage</span>
                  <span className="text-slate-700 font-mono">40% Internal</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Internal marks are automatically calculated based on attendance, quiz attempts, and submitted assignments in the gradebook module.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need syllabus updates or lab assistance?</span>
            <Link to="/support" className="text-[#165239] hover:text-[#1f6b4c] font-semibold">
              Contact Dean's Office →
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
export default FacultyDashboard;
