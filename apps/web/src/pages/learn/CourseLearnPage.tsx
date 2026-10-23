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
    <div className="min-h-screen bg-[#F3F5F7] flex flex-col antialiased selection:bg-[#dcfce7] selection:text-[#165239]">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/learn/my-courses" className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#165239] transition shrink-0">
              My Courses
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 truncate tracking-tight">
              {data?.course?.code} · {data?.course?.name || 'Course'}
            </h1>
          </div>
          {(resumeLessonId || firstLessonId) && (
            <button
              onClick={() =>
                navigate(`/learn/courses/${id}/lessons/${resumeLessonId || firstLessonId}`)
              }
              className="shrink-0 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full bg-[#165239] text-white hover:bg-[#12422e] transition shadow-pill"
            >
              {resumeLessonId ? 'Resume Learning' : 'Start Course'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {isLoading && <p className="text-slate-400 text-center py-12 text-xs">Loading course syllabus…</p>}
        {error && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200/80 text-rose-700 px-5 py-4 text-xs font-medium">
            Unable to load course. You may not be enrolled.
          </div>
        )}

        {data && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              {data.course.description && (
                <p className="text-xs sm:text-sm text-slate-600 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-card leading-relaxed">
                  {data.course.description}
                </p>
              )}

              {data.modules.map((mod) => (
                <section
                  key={mod.id}
                  className="bg-white border border-slate-200/70 rounded-3xl overflow-hidden shadow-card"
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
              <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-card">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Your progress
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {data.progress.progressPercent}%
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {data.progress.completedLessons} of {data.progress.totalLessons} lessons completed
                </p>
                <div className="mt-3.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#165239] rounded-full transition-all duration-300"
                    style={{ width: `${data.progress.progressPercent}%` }}
                  />
                </div>
              </div>
              <Link
                to={`/learn/courses/${id}/live`}
                className="block text-center text-xs sm:text-sm font-bold text-[#165239] bg-[#eaf5ee] hover:bg-[#d8eedf] rounded-full py-3 transition shadow-xs"
              >
                Live Classes
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
