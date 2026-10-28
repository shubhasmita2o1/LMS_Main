import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  CoursePublic,
  CourseModulePublic,
  CourseLessonPublic,
  CourseOfferingPublic,
  CourseEnrollmentPublic,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge } from '../../components/ui';
import { ArrowLeft, BookOpen, Edit3 } from 'lucide-react';

type Tab = 'overview' | 'structure' | 'offerings' | 'enrollments';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContentType, setLessonContentType] = useState('text');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonTextBody, setLessonTextBody] = useState('');
  const [attachLessonId, setAttachLessonId] = useState<string | null>(null);
  const [attachBusy, setAttachBusy] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollOfferingId, setEnrollOfferingId] = useState('');

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['courses', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CoursePublic>>(`/courses/${id}`);
      return data.data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ['courses', id, 'modules'],
    enabled: !!id && tab === 'structure',
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseModulePublic[]>>(`/courses/${id}/modules`);
      return data.data || [];
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ['courses', 'modules', activeModuleId, 'lessons'],
    enabled: !!activeModuleId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseLessonPublic[]>>(
        `/courses/modules/${activeModuleId}/lessons`
      );
      return data.data || [];
    },
  });

  const { data: offerings } = useQuery({
    queryKey: ['courses', id, 'offerings'],
    enabled: !!id && (tab === 'offerings' || tab === 'enrollments'),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseOfferingPublic[]>>(
        `/courses/${id}/offerings`
      );
      return data.data || [];
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ['courses', 'enrollments', id],
    enabled: !!id && tab === 'enrollments',
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseEnrollmentPublic[]>>(
        '/courses/enrollments',
        { params: { courseId: id, limit: 50 } }
      );
      return data.data || [];
    },
  });

  const addModule = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${id}/modules`, { title: moduleTitle });
      return data.data;
    },
    onSuccess: () => {
      setModuleTitle('');
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['courses', id] });
    },
  });

  const addLesson = useMutation({
    mutationFn: async () => {
      if (!activeModuleId) return;
      const payload: Record<string, unknown> = {
        title: lessonTitle,
        contentType: lessonContentType,
      };
      if (lessonContentType === 'video' && lessonVideoUrl.trim()) {
        payload.videoUrl = lessonVideoUrl.trim();
        payload.videoProvider = lessonVideoUrl.includes('youtu')
          ? 'youtube'
          : lessonVideoUrl.includes('vimeo')
            ? 'vimeo'
            : 'url';
      }
      if (lessonContentType === 'text' && lessonTextBody.trim()) {
        payload.textBody = lessonTextBody.trim();
      }
      if ((lessonContentType === 'link' || lessonContentType === 'pdf') && lessonVideoUrl.trim()) {
        payload.contentUrl = lessonVideoUrl.trim();
      }
      const { data } = await api.post(`/courses/modules/${activeModuleId}/lessons`, payload);
      return data.data;
    },
    onSuccess: () => {
      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonTextBody('');
      queryClient.invalidateQueries({
        queryKey: ['courses', 'modules', activeModuleId, 'lessons'],
      });
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'modules'] });
    },
  });

  const attachFileToLesson = async (lessonId: string, file: File) => {
    setAttachBusy(true);
    setAttachLessonId(lessonId);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const b64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(b64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const mime = file.type || 'application/pdf';
      const { data: up } = await api.post('/learn/content/upload', {
        fileName: file.name,
        mimeType: mime,
        base64,
      });
      const uploaded = up.data || up;
      const contentType =
        mime.includes('pdf') ? 'pdf' : mime.startsWith('image/') ? 'image' : mime.includes('presentation') || file.name.endsWith('.pptx') || file.name.endsWith('.ppt') ? 'pptx' : 'other';
      await api.post(`/learn/lessons/${lessonId}/content`, {
        contentType,
        fileKey: uploaded.fileKey,
        contentUrl: uploaded.contentUrl,
        fileName: uploaded.fileName || file.name,
        mimeType: uploaded.mimeType || mime,
        fileSize: uploaded.fileSize || file.size,
      });
      queryClient.invalidateQueries({ queryKey: ['courses', 'modules', activeModuleId, 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'modules'] });
    } finally {
      setAttachBusy(false);
      setAttachLessonId(null);
    }
  };

  const createOffering = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${id}/offerings`, { status: 'planned' });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'offerings'] });
    },
  });

  const enroll = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/courses/enrollments', {
        studentId: enrollStudentId,
        courseId: id,
        offeringId: enrollOfferingId || undefined,
      });
      return data.data;
    },
    onSuccess: () => {
      setEnrollStudentId('');
      setEnrollOfferingId('');
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrollments', id] });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <PageShell>
          <div className="py-20 text-center text-slate-400 font-medium">
            Loading course details…
          </div>
        </PageShell>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <PageShell>
          <SurfaceCard className="text-center py-12">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Course Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">The course record could not be found.</p>
            <PillButton variant="outline" href="/courses" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Courses Directory
            </PillButton>
          </SurfaceCard>
        </PageShell>
      </AppLayout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'structure', label: 'Curriculum Structure' },
    { key: 'offerings', label: 'Offerings' },
    { key: 'enrollments', label: 'Enrollments' },
  ];

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title={course.name}
          subtitle={`Course Code: ${course.code}`}
          badge={
            <StatusBadge
              status={course.status === 'active' ? 'success' : 'neutral'}
              label={course.status}
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/courses" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Directory
              </PillButton>
              <PillButton
                variant="secondary"
                href={`/learn/courses/${id}`}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                LMS Player
              </PillButton>
              <PillButton
                variant="outline"
                href={`/courses/${id}/discussions`}
              >
                Discussions
              </PillButton>
              <Can resource="course" action="update">
                <PillButton
                  variant="primary"
                  href={`/courses/${id}/edit`}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                >
                  Edit Course
                </PillButton>
              </Can>
            </div>
          }
        />

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs ${
                tab === t.key
                  ? 'bg-[#165239] text-white'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <SurfaceCard className="space-y-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Course Type</span>
                <p className="capitalize font-bold text-slate-800 mt-1">{course.courseType}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status</span>
                <p className="capitalize font-bold text-slate-800 mt-1">{course.status}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Credits</span>
                <p className="font-bold text-slate-800 mt-1">
                  {course.credits?.total ?? 0} Credits
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Structure</span>
                <p className="font-bold text-slate-800 mt-1">
                  {course.modulesCount ?? 0} Modules · {course.lessonsCount ?? 0} Lessons
                </p>
              </div>
            </div>

            {course.description && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            )}

            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Learning Outcomes</h3>
                <ul className="space-y-1.5">
                  {course.learningOutcomes.map((o, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="font-bold text-[#165239]">{i + 1}.</span>
                      <span>{o.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prerequisites</h3>
                <ul className="space-y-1">
                  {course.prerequisites.map((p) => (
                    <li key={p.courseId} className="text-xs text-slate-700">
                      <Link
                        to={`/courses/${p.courseId}`}
                        className="text-[#165239] font-bold font-mono hover:underline mr-1"
                      >
                        {p.courseId}
                      </Link>
                      <span className="text-slate-400">({p.type})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SurfaceCard>
        )}

        {tab === 'structure' && (
          <div className="space-y-4">
            <Can resource="course" action="update">
              <div className="flex gap-2">
                <input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="New module title"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  onClick={() => moduleTitle.trim() && addModule.mutate()}
                  disabled={addModule.isPending || !moduleTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
                >
                  Add module
                </button>
              </div>
            </Can>

            {(modules || []).length === 0 && (
              <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-6 text-center">
                No modules yet. Add modules and lessons to structure the course.
              </p>
            )}

            <div className="space-y-3">
              {(modules || []).map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModuleId((prev) => (prev === m.id ? null : m.id))
                    }
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <span className="text-xs text-slate-400 mr-2">#{m.order}</span>
                      <span className="font-medium text-slate-900">{m.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {m.lessonsCount ?? 0} lessons
                      </span>
                    </div>
                    <span className="text-slate-400 text-xs">
                      {activeModuleId === m.id ? '▾' : '▸'}
                    </span>
                  </button>
                  {activeModuleId === m.id && (
                    <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                      {(lessons || []).map((l) => (
                        <div
                          key={l.id}
                          className="flex flex-wrap items-center gap-2 text-sm text-slate-700 py-1"
                        >
                          <span className="text-xs text-slate-400 w-6">#{l.order}</span>
                          <span className="flex-1 min-w-[120px]">{l.title}</span>
                          <span className="text-xs text-slate-400 capitalize">
                            {l.contentType}
                          </span>
                          <Can resource="course" action="update">
                            <label className="text-xs text-primary-600 hover:underline cursor-pointer font-medium">
                              {attachBusy && attachLessonId === l.id ? 'Uploading…' : 'Attach file'}
                              <input
                                type="file"
                                accept=".pdf,application/pdf,image/*,.ppt,.pptx,.doc,.docx"
                                className="hidden"
                                disabled={attachBusy}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void attachFileToLesson(l.id, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </Can>
                        </div>
                      ))}
                      <Can resource="course" action="update">
                        <div className="space-y-2 pt-2">
                          <div className="flex gap-2 flex-wrap">
                            <input
                              value={lessonTitle}
                              onChange={(e) => setLessonTitle(e.target.value)}
                              placeholder="New lesson title"
                              className="flex-1 min-w-[140px] px-3 py-1.5 rounded border border-slate-300 text-sm"
                            />
                            <select
                              value={lessonContentType}
                              onChange={(e) => setLessonContentType(e.target.value)}
                              className="px-2 py-1.5 rounded border border-slate-300 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                              <option value="link">Link</option>
                            </select>
                            <button
                              onClick={() => lessonTitle.trim() && addLesson.mutate()}
                              disabled={addLesson.isPending || !lessonTitle.trim()}
                              className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs disabled:opacity-50"
                            >
                              Add lesson
                            </button>
                          </div>
                          {(lessonContentType === 'video' || lessonContentType === 'link' || lessonContentType === 'pdf') && (
                            <input
                              value={lessonVideoUrl}
                              onChange={(e) => setLessonVideoUrl(e.target.value)}
                              placeholder={
                                lessonContentType === 'video'
                                  ? 'Video URL (YouTube / Vimeo / MP4)'
                                  : lessonContentType === 'pdf'
                                    ? 'PDF URL (or attach file after creating)'
                                    : 'External URL'
                              }
                              className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm"
                            />
                          )}
                          {lessonContentType === 'text' && (
                            <textarea
                              value={lessonTextBody}
                              onChange={(e) => setLessonTextBody(e.target.value)}
                              placeholder="Lesson text content (optional)"
                              rows={2}
                              className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm"
                            />
                          )}
                        </div>
                      </Can>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'offerings' && (
          <div className="space-y-4">
            <Can resource="course" action="manage">
              <button
                onClick={() => createOffering.mutate()}
                disabled={createOffering.isPending}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
              >
                + Create offering
              </button>
            </Can>
            {(offerings || []).length === 0 ? (
              <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-6 text-center">
                No offerings yet. Create an offering for a year/semester/section.
              </p>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Faculty</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Max</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(offerings || []).map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 capitalize">{o.status}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {o.facultyIds?.length || 0} assigned
                        </td>
                        <td className="px-4 py-2">{o.maxStudents ?? '—'}</td>
                        <td className="px-4 py-2">{o.enrolledCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'enrollments' && (
          <div className="space-y-4">
            <Can resource="course" action="manage">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-slate-500 mb-1">Student ID</label>
                  <input
                    value={enrollStudentId}
                    onChange={(e) => setEnrollStudentId(e.target.value)}
                    placeholder="Mongo ObjectId"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs text-slate-500 mb-1">Offering (optional)</label>
                  <select
                    value={enrollOfferingId}
                    onChange={(e) => setEnrollOfferingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="">None</option>
                    {(offerings || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.status} · {o.id.slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => enrollStudentId && enroll.mutate()}
                  disabled={!enrollStudentId || enroll.isPending}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
                >
                  Enroll
                </button>
              </div>
            </Can>

            {(enrollments || []).length === 0 ? (
              <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-6 text-center">
                No enrollments yet.
              </p>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Student</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">
                        Enrolled at
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(enrollments || []).map((e) => (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 font-mono text-xs">
                          <Link
                            to={`/students/${e.studentId}`}
                            className="text-primary-600 hover:underline"
                          >
                            {e.studentId}
                          </Link>
                        </td>
                        <td className="px-4 py-2 capitalize">{e.status}</td>
                        <td className="px-4 py-2 text-slate-500 text-xs">
                          {e.enrolledAt
                            ? new Date(e.enrolledAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-2">{e.grade ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}
