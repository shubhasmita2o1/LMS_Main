import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  Paperclip,
  MessageSquare,
  Edit2,
  Trash2,
  Download,
  Send,
  Upload,
} from 'lucide-react';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  timeline?: { date: string; title: string; desc: string; user?: string }[];
  attachments?: { name: string; size: string; date: string }[];
  comments?: { id: string; author: string; role: string; text: string; date: string }[];
}

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  badge,
  subtitle,
  onEdit,
  onDelete,
  children,
  timeline = [
    { date: 'Today, 10:15 AM', title: 'Record Updated', desc: 'Parameters updated and verified by Academic Controller', user: 'Dr. Elizabeth Vance' },
    { date: 'Yesterday, 04:30 PM', title: 'Audit Verification', desc: 'Automated compliance checks completed with 0 errors', user: 'System Bot' },
    { date: '12 Oct 2026', title: 'Record Created', desc: 'Initial enrollment record registered and saved', user: 'Marcus Holloway' },
  ],
  attachments = [
    { name: 'Official_Syllabus_Verification.pdf', size: '2.4 MB', date: '14 Oct 2026' },
    { name: 'Accreditation_Compliance_Annexure.xlsx', size: '840 KB', date: '12 Oct 2026' },
    { name: 'End_Sem_Evaluation_Rubrics.pdf', size: '1.1 MB', date: '10 Oct 2026' },
  ],
  comments: initialComments = [
    { id: '1', author: 'Prof. Vikram Malhotra', role: 'Department Head', text: 'Verified prerequisites and lab scheduling conflicts. Looks ready for academic approval.', date: '14 Oct 2026, 11:30 AM' },
    { id: '2', author: 'Dr. Sarah Jenkins', role: 'Exam Controller', text: 'Please ensure internal marks moderation formulas are locked before final publication.', date: '13 Oct 2026, 03:15 PM' },
  ],
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'attachments' | 'comments'>('overview');
  const [commentList, setCommentList] = useState(initialComments);
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentList([
      ...commentList,
      {
        id: String(Date.now()),
        author: 'You (Current User)',
        role: 'Evaluator',
        text: newComment.trim(),
        date: 'Just now',
      },
    ]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {badge}
                <span className="text-[11px] font-mono text-slate-500">REF-{title.slice(0, 8).toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 truncate">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                  title="Edit Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 border-b border-slate-200 -mb-6 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-[#165239] text-[#165239]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-[#165239] text-[#165239]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline ({timeline.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'attachments'
                  ? 'border-[#165239] text-[#165239]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachments ({attachments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'comments'
                  ? 'border-[#165239] text-[#165239]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes & Comments ({commentList.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && children}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800">Historical Activity Trail</h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-white" />
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{item.date}</span>
                        {item.user && <span className="font-medium text-slate-600">{item.user}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Uploaded Supporting Documents</h3>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {att.size} • Uploaded {att.date}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4 flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-800">Reviewer Notes & Collaborative Comments</h3>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {commentList.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">{c.author}</span>
                      <span className="text-slate-400 text-[11px]">{c.date}</span>
                    </div>
                    <span className="inline-block text-[10px] uppercase font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 mb-2">
                      {c.role}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add an internal note or review comment..."
                  className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#165239] hover:bg-[#11402c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Audited Record</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-200 hover:bg-white text-slate-700 font-bold transition shadow-xs"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
export default DetailDrawer;
