import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, EnrolledCourseWithProgress } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';

export function MyCoursesPage() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const logout = () => { clearAuth(); navigate('/login'); };

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="font-semibold text-slate-900">My Courses</h1>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-slate-500 mb-6">Continue learning from your enrolled courses.</p>

        {isLoading && (
          <div className="text-center py-16 text-slate-400">Loading courses…</div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            Failed to load courses. Ensure you have a linked student profile and enrollments.
          </div>
        )}
        {!isLoading && data && data.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No enrolled courses yet.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {data?.map((item) => (
            <Link
              key={item.enrollment.id}
              to={`/learn/courses/${item.course.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-primary-300 hover:shadow transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                    {item.course.code}
                  </p>
                  <h2 className="mt-1 font-semibold text-slate-900">{item.course.name}</h2>
                </div>
                <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                  {item.enrollment.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>
                    {item.progress.completedLessons}/{item.progress.totalLessons} lessons ·{' '}
                    {item.progress.progressPercent}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all"
                    style={{ width: `${item.progress.progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
