import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { MessageSquare, Plus, Lock, Pin, Flag, CheckCircle } from 'lucide-react';
import {
  listDiscussionThreads,
  getDiscussionThread,
  createDiscussionThread,
  createDiscussionReply,
  lockDiscussionThread,
  pinDiscussionThread,
  markDiscussionAnswer,
  hideDiscussionReply,
  reportDiscussion,
} from '../../lib/communicationApi';
import { useAuthStore } from '../../stores/authStore';

export function CourseDiscussionsPage() {
  const { courseId = '', threadId } = useParams();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canModerate = (user?.roles || []).some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );

  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportingId, setReportingId] = useState<{ threadId?: string; replyId?: string } | null>(
    null
  );

  const listQ = useQuery({
    queryKey: ['discussions', courseId],
    queryFn: () => listDiscussionThreads(courseId, { limit: 50 }),
    enabled: !!courseId && !threadId,
  });

  const detailQ = useQuery({
    queryKey: ['discussions', courseId, threadId],
    queryFn: () => getDiscussionThread(courseId, threadId!),
    enabled: !!courseId && !!threadId,
  });

  const createThreadMut = useMutation({
    mutationFn: () =>
      createDiscussionThread(courseId, {
        title: title.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions', courseId] });
      setNewOpen(false);
      setTitle('');
      setBody('');
    },
  });

  const replyMut = useMutation({
    mutationFn: () =>
      createDiscussionReply(courseId, threadId!, { body: replyBody.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions', courseId, threadId] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setReplyBody('');
    },
  });

  const reportMut = useMutation({
    mutationFn: () =>
      reportDiscussion({
        threadId: reportingId?.threadId,
        replyId: reportingId?.replyId,
        reason: reportReason.trim(),
      }),
    onSuccess: () => {
      setReportingId(null);
      setReportReason('');
    },
  });

  if (threadId) {
    const thread = detailQ.data?.thread;
    const replies = detailQ.data?.replies ?? [];
    return (
      <AppLayout>
        <ModuleHeader
          title={thread?.title || 'Discussion'}
          subtitle={thread?.status === 'locked' ? 'Locked' : 'Open thread'}
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Courses', href: '/courses' },
            { label: 'Discussions', href: `/courses/${courseId}/discussions` },
            { label: 'Thread' },
          ]}
        />
        {detailQ.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {thread && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">
                    {thread.createdByName || 'User'} ·{' '}
                    {new Date(thread.createdAt).toLocaleString()}
                    {thread.isAnnouncementPin && (
                      <span className="ml-2 text-amber-600 font-bold">Pinned</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-800 mt-2 whitespace-pre-wrap">{thread.body}</p>
                </div>
                {canModerate && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="text-[11px] font-bold text-slate-600"
                      onClick={() =>
                        lockDiscussionThread(courseId, threadId, thread.status !== 'locked').then(
                          () => qc.invalidateQueries({ queryKey: ['discussions', courseId, threadId] })
                        )
                      }
                    >
                      <Lock className="w-3 h-3 inline" />{' '}
                      {thread.status === 'locked' ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-bold text-slate-600"
                      onClick={() =>
                        pinDiscussionThread(courseId, threadId, !thread.isAnnouncementPin).then(
                          () => qc.invalidateQueries({ queryKey: ['discussions', courseId, threadId] })
                        )
                      }
                    >
                      <Pin className="w-3 h-3 inline" /> Pin
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {replies.map((r) => (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs ${
                    r.isAnswer ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                  } ${r.status === 'hidden' ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between gap-2">
                    <p className="text-xs text-slate-400">
                      {r.createdByName || 'User'} · {new Date(r.createdAt).toLocaleString()}
                      {r.isAnswer && (
                        <span className="ml-2 text-emerald-700 font-bold">
                          <CheckCircle className="w-3 h-3 inline" /> Answer
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      {canModerate && (
                        <>
                          <button
                            type="button"
                            className="text-[10px] font-bold text-emerald-700"
                            onClick={() =>
                              markDiscussionAnswer(r.id, !r.isAnswer).then(() =>
                                qc.invalidateQueries({
                                  queryKey: ['discussions', courseId, threadId],
                                })
                              )
                            }
                          >
                            {r.isAnswer ? 'Unmark' : 'Mark answer'}
                          </button>
                          <button
                            type="button"
                            className="text-[10px] font-bold text-slate-500"
                            onClick={() =>
                              hideDiscussionReply(r.id, r.status !== 'hidden').then(() =>
                                qc.invalidateQueries({
                                  queryKey: ['discussions', courseId, threadId],
                                })
                              )
                            }
                          >
                            {r.status === 'hidden' ? 'Unhide' : 'Hide'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="text-[10px] font-bold text-rose-600"
                        onClick={() => setReportingId({ replyId: r.id })}
                      >
                        <Flag className="w-3 h-3 inline" /> Report
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
            </div>

            {thread.status !== 'locked' && (
              <form
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (replyBody.trim()) replyMut.mutate();
                }}
              >
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Write a reply…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  maxLength={10000}
                />
                <button
                  type="submit"
                  disabled={replyMut.isPending || !replyBody.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  Reply
                </button>
              </form>
            )}

            {reportingId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3">
                  <h3 className="font-bold text-sm">Report content</h3>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Reason"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                      onClick={() => reportMut.mutate()}
                      disabled={!reportReason.trim() || reportMut.isPending}
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold"
                      onClick={() => setReportingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </AppLayout>
    );
  }

  const threads = listQ.data?.items ?? [];

  return (
    <AppLayout>
      <ModuleHeader
        title="Course discussions"
        subtitle="Q&A and course community"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Courses', href: '/courses' },
          { label: 'Discussions' },
        ]}
        primaryAction={{
          label: 'New thread',
          onClick: () => setNewOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {newOpen && (
        <form
          className="mb-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim() && body.trim()) createThreadMut.mutate();
          }}
        >
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Thread title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            required
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[100px]"
            placeholder="What do you want to discuss?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={20000}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createThreadMut.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setNewOpen(false)}
              className="px-4 py-2 rounded-xl border text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {listQ.isLoading && (
          <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
        )}
        {!listQ.isLoading && threads.length === 0 && (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No threads yet</p>
          </div>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            to={`/courses/${courseId}/discussions/${t.id}`}
            className="block px-5 py-4 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {t.isAnnouncementPin && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                  {t.status === 'locked' && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-sm font-bold text-slate-900">{t.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {t.createdByName || 'User'} · {t.replyCount} replies ·{' '}
                  {new Date(t.lastActivityAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}

export default CourseDiscussionsPage;
