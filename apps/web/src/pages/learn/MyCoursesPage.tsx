import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, EnrolledCourseWithProgress } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import { BookOpen, PlayCircle } from 'lucide-react';

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
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Enrolled Courses</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Access your digital learning modules, syllabus readings, and lesson progress.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading your courses…
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 p-6 text-sm">
            Failed to load courses. Ensure you have a linked student profile and active course enrollments.
          </div>
        )}

        {!isLoading && data && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Enrolled Courses Found</p>
            <p className="text-xs text-slate-400 mt-1">You are not currently enrolled in any semester courses.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((item) => (
            <div
              key={item.enrollment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                    {item.course.code}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {item.enrollment.status}
                  </span>
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
                      className="h-full rounded-full bg-primary-600 transition-all"
                      style={{ width: `${item.progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to={`/learn/courses/${item.course.id}`}
                  className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-bold"
                >
                  <PlayCircle className="w-4 h-4" />
                  Resume Learning
                </Link>
                <Link
                  to={`/attendance?courseId=${item.course.id}`}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
