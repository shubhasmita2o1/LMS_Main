import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import {
  BookOpen,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusPill,
  AnalyticsBarCard,
  ReminderCard,
  TimeTrackerCard,
  ProgressRing,
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

const FACULTY_TEAM = [
  {
    name: 'Dr. Sarah Jenkins',
    duty: 'Distributed Systems & Cloud',
    status: 'completed' as const,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Prof. Ramesh Rao',
    duty: 'Database Management Systems',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Dr. Elena Rostova',
    duty: 'Artificial Intelligence & ML',
    status: 'pending' as const,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Prof. Alan Turing',
    duty: 'Theory of Computation',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
  },
];

export function DepartmentHeadDashboard() {
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
        title="Dashboard"
        description="Plan, prioritize, and accomplish departmental curriculum and faculty operations."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/courses" variant="primary" icon={Plus}>
              Add Course
            </PillButton>
            <PillButton to="/faculty" variant="secondary">
              Faculty Roster
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Cards: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Department Courses"
          value={statsLoading ? '…' : stats?.totalCourses ?? 18}
          hint="4 Added this term"
          variant="emphasis"
          to="/courses"
        />

        <KpiCard
          title="Department Faculty"
          value={statsLoading ? '…' : stats?.totalFaculty ?? 24}
          hint="All workloads assigned"
          variant="default"
          to="/faculty"
        />

        <KpiCard
          title="Enrolled Students"
          value={statsLoading ? '…' : stats?.totalStudents ?? 420}
          hint="Across 6 cohorts"
          variant="default"
          to="/students"
        />

        <KpiCard
          title="Teaching Load"
          value={coursesLoading ? '…' : myCourses.length}
          hint="Direct lectures"
          variant="default"
          to="/courses"
        />
      </div>

      {/* Middle Grid Row: Analytics + Reminders + Department Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Analytics Card */}
        <div className="lg:col-span-5">
          <AnalyticsBarCard
            title="Lecture Delivery Analytics"
            subtitle="Departmental syllabus completion by weekday"
          />
        </div>

        {/* Reminders / Committee Meeting */}
        <div className="lg:col-span-3">
          <ReminderCard
            label="Reminders"
            title="Department Board of Studies"
            time="Time : 02.00 pm - 04.00 pm"
            actionLabel="Start Meeting"
            to="/communication"
          />
        </div>

        {/* Department Courses List */}
        <div className="lg:col-span-4">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Curriculum</h3>
                <p className="text-xs text-slate-500">Department syllabus units</p>
              </div>
              <PillButton to="/courses" variant="outline" size="sm" icon={Plus}>
                New
              </PillButton>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {coursesLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading courses…</div>
              ) : myCourses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No departmental courses yet.</div>
              ) : (
                myCourses.slice(0, 4).map((c, idx) => {
                  const colors = [
                    'bg-indigo-50 text-indigo-600',
                    'bg-emerald-50 text-[#165239]',
                    'bg-amber-50 text-amber-600',
                    'bg-rose-50 text-rose-600',
                  ];
                  return (
                    <Link
                      key={c.id}
                      to={`/courses/${c.id}`}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${colors[idx % colors.length]} flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#165239] transition">
                            {c.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {c.code} • {c.modulesCount} Modules
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  );
                })
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Bottom Grid Row: Team Collaboration + Progress Ring + Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Faculty Collaboration Card */}
        <div className="lg:col-span-5">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Team Collaboration</h3>
              <PillButton to="/faculty" variant="outline" size="sm" icon={Plus}>
                Add Member
              </PillButton>
            </div>

            <div className="p-4 space-y-3 divide-y divide-slate-50">
              {FACULTY_TEAM.map((member) => (
                <div key={member.name} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Teaching <span className="text-slate-600 font-medium">{member.duty}</span></p>
                    </div>
                  </div>
                  <StatusPill variant={member.status}>
                    {member.status === 'completed'
                      ? 'Completed'
                      : member.status === 'in_progress'
                      ? 'In Progress'
                      : 'Pending'}
                  </StatusPill>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Curriculum Progress Gauge Card */}
        <div className="lg:col-span-4">
          <SurfaceCard className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Curriculum Progress</h3>
              <span className="text-xs font-bold text-[#165239]">OBE Syllabus</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <ProgressRing
                percent={54}
                label="Syllabus Ended"
                inProgressPercent={28}
                completedLabel="Delivered"
                inProgressLabel="In Progress"
                pendingLabel="Pending"
              />
            </div>
          </SurfaceCard>
        </div>

        {/* Time Tracker Card */}
        <div className="lg:col-span-3">
          <TimeTrackerCard label="Time Tracker" initialSeconds={5048} className="h-full" />
        </div>
      </div>
    </PageShell>
  );
}
export default DepartmentHeadDashboard;
