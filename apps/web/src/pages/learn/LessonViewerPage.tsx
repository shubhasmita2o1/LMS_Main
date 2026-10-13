import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  CourseLessonPublic,
  LearningProgressPublic,
  LearningNotePublic,
  LearnCourseOutline,
} from '@university-lms/shared';

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function vimeoEmbed(url: string): string | null {
  try {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  } catch {
    /* ignore */
  }
  return null;
}

export function LessonViewerPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [noteBody, setNoteBody] = useState('');
  const lastSaveRef = useRef(0);

  const { data: outline } = useQuery({
    queryKey: ['learn', 'outline', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LearnCourseOutline>>(
        `/learn/courses/${courseId}/outline`
      );
      return data.data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['learn', 'lesson', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ lesson: CourseLessonPublic; progress: LearningProgressPublic | null }>
      >(`/learn/lessons/${lessonId}`);
      return data.data;
    },
  });

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['learn', 'notes', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LearningNotePublic[]>>(
        `/learn/lessons/${lessonId}/notes`
      );
      return data.data ?? [];
    },
  });

  const progressMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/learn/lessons/${lessonId}/progress`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn', 'outline', courseId] });
      queryClient.invalidateQueries({ queryKey: ['learn', 'lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['learn', 'my-courses'] });
    },
  });

  const noteMut = useMutation({
    mutationFn: async (body: string) => {
      await api.post(`/learn/lessons/${lessonId}/notes`, { body });
    },
    onSuccess: () => {
      setNoteBody('');
      refetchNotes();
    },
  });

  const bookmarkMut = useMutation({
    mutationFn: async () => {
      await api.post(`/learn/lessons/${lessonId}/bookmarks`, {});
    },
  });

  const lesson = data?.lesson;
  const progress = data?.progress;

  useEffect(() => {
    if (
      lesson?.contentType === 'video' &&
      videoRef.current &&
      progress?.lastPositionSeconds
    ) {
      videoRef.current.currentTime = progress.lastPositionSeconds;
    }
  }, [lesson?.id, progress?.lastPositionSeconds]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || lesson?.contentType !== 'video') return;

    const onTime = () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 15000) return;
      lastSaveRef.current = now;
      const percent =
        el.duration && isFinite(el.duration)
          ? Math.round((el.currentTime / el.duration) * 100)
          : undefined;
      progressMut.mutate({
        lastPositionSeconds: Math.floor(el.currentTime),
        progressPercent: percent,
        status: 'in_progress',
        timeSpentSecondsDelta: 15,
      });
    };

    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [lesson?.id, lesson?.contentType]);

  const flatLessons =
    outline?.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))
    ) ?? [];
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const next = idx >= 0 && idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  const markComplete = () => {
    progressMut.mutate({ markComplete: true, progressPercent: 100 });
  };

  const renderContent = () => {
    if (!lesson) return null;
    const type = lesson.contentType;

    if (type === 'text') {
      return (
        <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-800">
          {lesson.textBody || lesson.contentSummary || 'No content yet.'}
        </div>
      );
    }

    if (type === 'link' && (lesson.contentUrl || lesson.videoUrl)) {
      const href = lesson.contentUrl || lesson.videoUrl!;
      return (
        <div className="space-y-3">
          <p className="text-slate-600 text-sm">{lesson.contentSummary}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Open external resource
          </a>
        </div>
      );
    }

    if (type === 'video') {
      const url = lesson.videoUrl || lesson.contentUrl || '';
      const yt = url ? youtubeEmbed(url) : null;
      const vm = url && !yt ? vimeoEmbed(url) : null;

      if (yt || vm) {
        return (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              src={yt || vm!}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        );
      }

      if (url) {
        return (
          <video
            ref={videoRef}
            controls
            className="w-full rounded-xl bg-black max-h-[70vh]"
            src={url}
            onEnded={() => progressMut.mutate({ markComplete: true })}
          >
            {lesson.captionsUrl && (
              <track kind="captions" src={lesson.captionsUrl} default />
            )}
          </video>
        );
      }
      return <p className="text-slate-500">No video URL configured.</p>;
    }

    if (type === 'pdf' || type === 'image' || type === 'docx' || type === 'ppt' || type === 'pptx') {
      const href = lesson.contentUrl;
      if (!href) return <p className="text-slate-500">No file attached.</p>;
      if (type === 'pdf') {
        return (
          <iframe
            src={href}
            className="w-full h-[70vh] rounded-xl border border-slate-200"
            title={lesson.title}
          />
        );
      }
      if (type === 'image') {
        return (
          <img
            src={href}
            alt={lesson.fileName || lesson.title}
            className="max-w-full rounded-xl border border-slate-200"
          />
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download {lesson.fileName || 'file'}
        </a>
      );
    }

    return (
      <p className="text-slate-500">
        {lesson.contentSummary || 'Content type not fully supported in viewer yet.'}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/learn/courses/${courseId}`}
              className="text-sm text-slate-500 hover:text-slate-800 shrink-0"
            >
              Outline
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
              {lesson?.title || 'Lesson'}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => bookmarkMut.mutate()}
              disabled={bookmarkMut.isSuccess}
              className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {bookmarkMut.isSuccess ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              onClick={markComplete}
              disabled={progress?.status === 'completed' || progressMut.isPending}
              className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {progress?.status === 'completed' ? 'Completed' : 'Mark complete'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex-1 grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
          {isLoading && <p className="text-slate-400 py-8 text-center">Loading lesson…</p>}
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              Failed to load lesson (enrollment required).
            </div>
          )}

          {lesson && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              {renderContent()}
            </div>
          )}

          <div className="flex justify-between gap-3">
            <button
              disabled={!prev}
              onClick={() =>
                prev && navigate(`/learn/courses/${courseId}/lessons/${prev.id}`)
              }
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              disabled={!next}
              onClick={() =>
                next && navigate(`/learn/courses/${courseId}/lessons/${next.id}`)
              }
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Notes</h3>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="Write a note…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => noteBody.trim() && noteMut.mutate(noteBody)}
              disabled={!noteBody.trim() || noteMut.isPending}
              className="mt-2 w-full text-sm py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Save note
            </button>
            <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {notes?.map((n) => (
                <li
                  key={n.id}
                  className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5 whitespace-pre-wrap"
                >
                  {n.body}
                </li>
              ))}
            </ul>
          </div>

          {outline && (
            <div className="bg-white rounded-xl border border-slate-200 p-3 max-h-80 overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 mb-2 px-1">Lessons</p>
              {flatLessons.map((l) => (
                <Link
                  key={l.id}
                  to={`/learn/courses/${courseId}/lessons/${l.id}`}
                  className={`block text-xs px-2 py-1.5 rounded ${
                    l.id === lessonId
                      ? 'bg-primary-50 text-primary-800 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {l.title}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
