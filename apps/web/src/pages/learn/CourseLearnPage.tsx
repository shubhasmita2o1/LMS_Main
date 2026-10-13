import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, LearnCourseOutline } from '@university-lms/shared';

export function CourseLearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['learn', 'outline', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LearnCourseOutline>>(
        `/learn/courses/${id}/outline`
      );
      return data.data;
    },
  });

  const resumeLessonId = data?.progress?.lastLessonId;
  const firstLessonId = data?.modules
    ?.flatMap((m) => m.lessons)
    ?.sort((a, b) => a.order - b.order)?.[0]?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/learn" className="text-sm text-slate-500 hover:text-slate-800 shrink-0">
              My Courses
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="font-semibold text-slate-900 truncate">
              {data?.course?.code} · {data?.course?.name || 'Course'}
            </h1>
          </div>
          {(resumeLessonId || firstLessonId) && (
            <button
              onClick={() =>
                navigate(`/learn/courses/${id}/lessons/${resumeLessonId || firstLessonId}`)
              }
              className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              {resumeLessonId ? 'Resume' : 'Start'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        {isLoading && <p className="text-slate-400 text-center py-12">Loading outline…</p>}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            Unable to load course. You may not be enrolled.
          </div>
        )}

        {data && (
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              {data.course.description && (
                <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4">
                  {data.course.description}
                </p>
              )}

              {data.modules.map((mod) => (
                <section
                  key={mod.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-medium text-slate-900">{mod.title}</h2>
                    <span className="text-xs text-slate-500">{mod.progressPercent}%</span>
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {mod.lessons.map((lesson) => {
                      const status = lesson.progress?.status || 'not_started';
                      return (
                        <li key={lesson.id}>
                          <Link
                            to={`/learn/courses/${id}/lessons/${lesson.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                status === 'completed'
                                  ? 'bg-emerald-500'
                                  : status === 'in_progress'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-slate-400 capitalize">
                                {lesson.contentType}
                                {lesson.durationMinutes
                                  ? ` · ${lesson.durationMinutes} min`
                                  : ''}
                              </p>
                            </div>
                            {status === 'completed' && (
                              <span className="text-xs text-emerald-600">Done</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                    {mod.lessons.length === 0 && (
                      <li className="px-4 py-3 text-sm text-slate-400">No lessons yet</li>
                    )}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Your progress
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {data.progress.progressPercent}%
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {data.progress.completedLessons} of {data.progress.totalLessons} lessons
                  completed
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full"
                    style={{ width: `${data.progress.progressPercent}%` }}
                  />
                </div>
              </div>
              <Link
                to={`/learn/courses/${id}/live`}
                className="block text-center text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl py-3"
              >
                Live classes
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
