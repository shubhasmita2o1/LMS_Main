import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, AcademicConfig } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function AcademicSettingsPage() {
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [attendance, setAttendance] = useState(75);
  const [minCgpa, setMinCgpa] = useState(5);
  const [maxBacklogs, setMaxBacklogs] = useState(4);
  const [minCredits, setMinCredits] = useState(12);
  const [maxCredits, setMaxCredits] = useState(28);

  const { data, isLoading } = useQuery({
    queryKey: ['academic', 'config'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AcademicConfig & { tenantId: string }>>(
        '/academic/config'
      );
      return data.data!;
    },
  });

  useEffect(() => {
    if (data) {
      setAttendance(data.attendanceRules.minimumPercent);
      setMinCgpa(data.promotionRules.minCgpaToPass);
      setMaxBacklogs(data.promotionRules.maxBacklogsAllowed);
      setMinCredits(data.creditStructure.minCreditsPerSemester);
      setMaxCredits(data.creditStructure.maxCreditsPerSemester);
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.patch('/academic/config', {
        attendanceRules: {
          minimumPercent: attendance,
          considerMedicalLeave: data?.attendanceRules.considerMedicalLeave ?? true,
        },
        promotionRules: {
          minCgpaToPass: minCgpa,
          maxBacklogsAllowed: maxBacklogs,
        },
        creditStructure: {
          minCreditsPerSemester: minCredits,
          maxCreditsPerSemester: maxCredits,
          creditHoursPerLecture: data?.creditStructure.creditHoursPerLecture ?? 1,
          creditHoursPerLab: data?.creditStructure.creditHoursPerLab ?? 0.5,
        },
      });
      if (!res.success) throw new Error(res.error?.message || 'Save failed');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'config'] });
      setMessage('Settings saved');
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/academic" className="text-sm text-slate-600 hover:text-slate-900">
            ← Academic
          </Link>
          <span className="font-semibold text-slate-900">Academic Settings</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}
        {isLoading && <p className="text-slate-400 text-sm">Loading…</p>}

        {data && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Grading scheme</h2>
              <p className="text-sm text-slate-500 mb-3">{data.gradingScheme.name}</p>
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr>
                    <th className="py-1">Letter</th>
                    <th className="py-1">Min %</th>
                    <th className="py-1">Max %</th>
                    <th className="py-1">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gradingScheme.bands.map((b) => (
                    <tr key={b.letter} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium">{b.letter}</td>
                      <td className="py-1.5">{b.minPercent}</td>
                      <td className="py-1.5">{b.maxPercent}</td>
                      <td className="py-1.5">{b.gradePoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-slate-900">Rules</h2>
              <label className="block text-sm">
                <span className="text-slate-600">Minimum attendance %</span>
                <input
                  type="number"
                  value={attendance}
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Min CGPA to pass</span>
                <input
                  type="number"
                  step="0.1"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Max backlogs allowed</span>
                <input
                  type="number"
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-slate-600">Min credits / semester</span>
                  <input
                    type="number"
                    value={minCredits}
                    onChange={(e) => setMinCredits(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Max credits / semester</span>
                  <input
                    type="number"
                    value={maxCredits}
                    onChange={(e) => setMaxCredits(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </label>
              </div>
              <Can resource="university" action="manage">
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
                >
                  {saveMut.isPending ? 'Saving…' : 'Save settings'}
                </button>
              </Can>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
