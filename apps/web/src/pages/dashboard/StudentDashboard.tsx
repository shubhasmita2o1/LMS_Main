import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, EnrolledCourseWithProgress } from '@university-lms/shared';
import {
  BookOpen,
  ArrowRight,
  PlayCircle,
  Award,
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

interface StudentDashboardSummary {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  pendingAssignmentsCount: number;
  availableQuizzesCount: number;
}

const PEER_STUDENTS = [
  {
    name: 'Alexandra Deff',
    duty: 'Operating Systems Virtual Memory',
    status: 'completed' as const,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Edwin Adenike',
    duty: 'Database Normalization BCNF',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Isaac Oluwademilorun',
    duty: 'Computer Networks Routing Lab',
    status: 'pending' as const,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'David Oshodi',
    duty: 'Web Architecture Term Paper',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
];

export function StudentDashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['students', 'me', 'dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentDashboardSummary>>('/students/me/dashboard-summary');
      return data.data;
    },
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['learn', 'my-courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EnrolledCourseWithProgress[]>>('/learn/my-courses');
      return data.data || [];
    },
  });

  const courses = coursesData || [];
  const resumeCourse = courses.find((c) => c.progress.progressPercent < 100) || courses[0];

  return (
    <PageShell>
      {/* Header */}
      <SectionHeader
        title="Dashboard"
        description="Plan, prioritize, and accomplish your tasks with ease."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/learn/my-courses" variant="primary" icon={PlayCircle}>
              Continue Learning
            </PillButton>
            <PillButton to="/gradebook/transcript" variant="secondary" icon={Award}>
              My Transcript
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Metrics Row: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Projects"
          value={summaryLoading ? '…' : (summaryData?.enrolledCoursesCount ?? (courses.length > 0 ? courses.length : 24))}
          hint="5 Increased from last month"
          variant="emphasis"
          to="/learn/my-courses"
        />

        <KpiCard
          title="Ended Projects"
          value={summaryLoading ? '…' : (summaryData?.completedCoursesCount ?? 10)}
          hint="6 Increased from last month"
          variant="default"
          to="/gradebook/transcript"
        />

        <KpiCard
          title="Running Projects"
          value={summaryLoading ? '…' : (summaryData?.pendingAssignmentsCount ?? 12)}
          hint="2 Increased from last month"
          variant="default"
          to="/assignments"
        />

        <KpiCard
          title="Pending Project"
          value={summaryLoading ? '…' : (summaryData?.availableQuizzesCount ?? 2)}
          hint="On Discuss"
          variant="default"
          to="/quizzes"
        />
      </div>

      {/* Middle Grid Row: Analytics + Reminders + Course Work List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Analytics Card */}
        <div className="lg:col-span-5">
          <AnalyticsBarCard
            title="Project Analytics"
            subtitle="Weekly study hours & video lesson activity"
          />
        </div>

        {/* Reminders Meeting Card */}
        <div className="lg:col-span-3">
          <ReminderCard
            label="Reminders"
            title="Meeting with Arc Company"
            time="Time : 02.00 pm - 04.00 pm"
            actionLabel="Start Meeting"
            to="/learn"
          />
        </div>

        {/* Project / Enrolled Courses List Card */}
        <div className="lg:col-span-4">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Project</h3>
                <p className="text-xs text-slate-500">Active coursework modules</p>
              </div>
              <PillButton to="/learn/my-courses" variant="outline" size="sm">
                View All
              </PillButton>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {coursesLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading courses…</div>
              ) : courses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No enrolled courses yet.</div>
              ) : (
                courses.slice(0, 4).map((c, idx) => {
                  const colors = [
                    'bg-indigo-50 text-indigo-600',
                    'bg-emerald-50 text-[#165239]',
                    'bg-amber-50 text-amber-600',
                    'bg-rose-50 text-rose-600',
                  ];
                  return (
                    <Link
                      key={c.course.id}
                      to={`/learn/courses/${c.course.id}`}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${colors[idx % colors.length]} flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#165239] transition">
                            {c.course.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block">
                            Due date: Nov 28, 2026
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
        {/* Team Collaboration Card */}
        <div className="lg:col-span-5">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Team Collaboration</h3>
              <PillButton to="/learn" variant="outline" size="sm">
                Study Group
              </PillButton>
            </div>

            <div className="p-4 space-y-3 divide-y divide-slate-50">
              {PEER_STUDENTS.map((member) => (
                <div key={member.name} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Working on <span className="text-slate-600 font-medium">{member.duty}</span></p>
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

        {/* Project Progress Gauge Card */}
        <div className="lg:col-span-4">
          <SurfaceCard className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Project Progress</h3>
              <span className="text-xs font-bold text-[#165239]">
                {resumeCourse ? `${resumeCourse.progress.progressPercent}% Active` : '41% Active'}
              </span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <ProgressRing
                percent={resumeCourse ? resumeCourse.progress.progressPercent : 41}
                label="Project Ended"
                inProgressPercent={35}
                completedLabel="Completed"
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
export default StudentDashboard;
