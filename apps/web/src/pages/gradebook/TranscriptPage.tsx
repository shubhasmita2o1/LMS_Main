import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, TranscriptItem } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';

export function TranscriptPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['transcript'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TranscriptItem[]>>('/gradebook/me/transcript');
      return data.data ?? [];
    },
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/gradebook" className="text-sm text-slate-500 hover:text-slate-800">
            ← Gradebooks
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">My transcript</h1>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
            No published results yet.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">%</th>
                  <th className="px-4 py-3 font-medium">Letter</th>
                  <th className="px-4 py-3 font-medium">GP</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((t) => (
                  <tr key={t.resultId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {t.courseCode || t.courseId}
                      </div>
                      <div className="text-xs text-slate-500">{t.courseName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/gradebook/${t.gradebookId}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{t.weightedPercent}%</td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">
                      {t.letterGrade || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{t.gradePoint ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {t.publishedAt
                        ? new Date(t.publishedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default TranscriptPage;
