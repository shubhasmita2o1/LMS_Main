import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, EnrolledCourseWithProgress } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  PageShell,
  SectionHeader,
  SurfaceCard,
  PillButton,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import { BookOpen, PlayCircle, CalendarCheck2 } from 'lucide-react';

export function MyCoursesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['learn', 'my-courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EnrolledCourseWithProgress[]>>(
        '/learn/my-courses'
      );
      return data.data ?? [];
    },
  });

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title="My Enrolled Courses"
          subtitle="Access your digital learning modules, syllabus readings, and lesson progress."
        />

        {isLoading && (
          <SurfaceCard className="py-12 text-center text-slate-400 text-xs">
            Loading your courses…
          </SurfaceCard>
        )}

        {error && (
          <SurfaceCard className="bg-rose-50 border-rose-200 text-rose-800 text-sm">
            Failed to load courses. Ensure you have a linked student profile and active course enrollments.
          </SurfaceCard>
        )}

        {!isLoading && data && data.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No Enrolled Courses Found"
            description="You are not currently enrolled in any semester courses. Contact your department administrator to register."
            action={
              <PillButton to="/dashboard" variant="primary">
                Return to Dashboard
              </PillButton>
            }
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((item) => (
            <SurfaceCard
              key={item.enrollment.id}
              interactive={true}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239]">
                    {item.course.code}
                  </span>
                  <StatusBadge
                    label={item.enrollment.status}
                    variant="neutral"
                    size="sm"
                  />
                </div>
                <h2 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                  {item.course.name}
                </h2>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Lessons Progress</span>
                    <span className="font-bold text-slate-800">
                      {item.progress.completedLessons}/{item.progress.totalLessons} ({item.progress.progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#165239] transition-all duration-300"
                      style={{ width: `${item.progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <PillButton
                  to={`/learn/courses/${item.course.id}`}
                  variant="primary"
                  size="sm"
                  icon={PlayCircle}
                >
                  Resume Learning
                </PillButton>
                <PillButton
                  to={`/attendance?courseId=${item.course.id}`}
                  variant="outline"
                  size="sm"
                  icon={CalendarCheck2}
                >
                  Attendance
                </PillButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </AppLayout>
  );
}
export default MyCoursesPage;
