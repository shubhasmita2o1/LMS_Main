import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, TranscriptItem } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  PageShell,
  SectionHeader,
  SurfaceCard,
  PillButton,
  StatusBadge,
  KpiCard,
  EmptyState,
} from '../../components/ui';
import { Award, ArrowLeft } from 'lucide-react';

export function TranscriptPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['transcript'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TranscriptItem[]>>('/gradebook/me/transcript');
      return data.data ?? [];
    },
  });

  // Calculate cumulative GPA
  const validGps = items.filter((t) => t.gradePoint != null).map((t) => Number(t.gradePoint));
  const cumulativeGpa =
    validGps.length > 0
      ? (validGps.reduce((acc, g) => acc + g, 0) / validGps.length).toFixed(2)
      : null;

  return (
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Academic Transcript &amp; Results"
          subtitle="Official institutional credit results, continuous assessment weightings, letter grades, and cumulative GPA"
          actions={
            <PillButton to="/gradebook" variant="secondary" icon={ArrowLeft}>
              Back to Gradebooks
            </PillButton>
          }
        />

        {/* GPA Summary row */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Cumulative GPA"
              value={cumulativeGpa !== null ? cumulativeGpa : 'N/A'}
              hint="10-point academic performance index"
              icon={Award}
              variant="primary"
            />
            <KpiCard
              title="Published Results"
              value={items.length}
              hint="Accredited semester subjects"
              icon={Award}
              variant="default"
            />
            <KpiCard
              title="Academic Status"
              value="In Good Standing"
              hint="Eligible for degree conferral"
              icon={Award}
              variant="default"
              badge="Accredited"
              badgeVariant="success"
            />
          </div>
        )}

        {/* Transcript Results Table */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading transcript…</div>
          )}

          {!isLoading && items.length === 0 && (
            <EmptyState
              icon={Award}
              title="No Published Results Yet"
              description="Semester examination grades and transcripts have not yet been published by faculty."
            />
          )}

          {!isLoading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Gradebook Title</th>
                    <th className="px-5 py-3.5">Weighted Score</th>
                    <th className="px-5 py-3.5">Letter Grade</th>
                    <th className="px-5 py-3.5">Grade Point (GP)</th>
                    <th className="px-5 py-3.5">Published Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((t) => (
                    <tr key={t.resultId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239] block w-fit mb-1">
                          {t.courseCode || t.courseId.slice(-6)}
                        </span>
                        <div className="text-xs font-bold text-slate-900">{t.courseName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {t.title}
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-sm text-slate-900">
                        {t.weightedPercent}%
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={t.letterGrade || 'P'}
                          variant="primary"
                          size="sm"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                        {t.gradePoint ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {t.publishedAt ? new Date(t.publishedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <PillButton
                          to={`/gradebook/${t.gradebookId}`}
                          variant="outline"
                          size="sm"
                        >
                          View Detail
                        </PillButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
export default TranscriptPage;
