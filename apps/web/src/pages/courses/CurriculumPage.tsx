import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  ProgramPublic,
  CurriculumEntryPublic,
  CourseListItem,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { useAuth } from '../../hooks/useAuth';

export function CurriculumPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [programId, setProgramId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterNumber, setSemesterNumber] = useState('');
  const [yearNumber, setYearNumber] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['curriculum', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CurriculumEntryPublic[]>>(
        `/courses/curriculum/${programId}`
      );
      return data.data || [];
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/courses/curriculum', {
        programId,
        courseId,
        semesterNumber: semesterNumber ? Number(semesterNumber) : null,
        yearNumber: yearNumber ? Number(yearNumber) : null,
        isMandatory,
      });
      return data.data;
    },
    onSuccess: () => {
      setCourseId('');
      setSemesterNumber('');
      setYearNumber('');
      queryClient.invalidateQueries({ queryKey: ['curriculum', programId] });
    },
  });

  const removeEntry = useMutation({
    mutationFn: async (entryId: string) => {
      await api.delete(`/courses/curriculum/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum', programId] });
    },
  });

  const courseMap = new Map((courses || []).map((c) => [c.id, c]));

  // Group by year/semester
  const grouped = (entries || []).reduce(
    (acc, e) => {
      const key = `Y${e.yearNumber ?? '?'}-S${e.semesterNumber ?? '?'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {} as Record<string, CurriculumEntryPublic[]>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Dashboard
            </Link>
            <span className="font-semibold text-slate-900">Curriculum</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/courses" className="text-primary-600 hover:underline">
              Courses
            </Link>
            <button
              onClick={() => logout()}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">Select a program</option>
            {(programs || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {programId && (
          <>
            <Can resource="course" action="manage">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-slate-500 mb-1">Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="">Select course</option>
                    {(courses || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs text-slate-500 mb-1">Year</label>
                  <input
                    type="number"
                    min={1}
                    value={yearNumber}
                    onChange={(e) => setYearNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-slate-500 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    value={semesterNumber}
                    onChange={(e) => setSemesterNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                  />
                  Mandatory
                </label>
                <button
                  onClick={() => courseId && addEntry.mutate()}
                  disabled={!courseId || addEntry.isPending}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
                >
                  Add to curriculum
                </button>
              </div>
            </Can>

            {isLoading && <p className="text-sm text-slate-500">Loading curriculum…</p>}

            {!isLoading && (entries || []).length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                No courses mapped to this program yet.
              </div>
            )}

            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, list]) => (
                <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {key}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {list.map((e) => {
                      const c = courseMap.get(e.courseId);
                      return (
                        <li
                          key={e.id}
                          className="px-4 py-3 flex items-center justify-between gap-3 text-sm"
                        >
                          <div>
                            <Link
                              to={`/courses/${e.courseId}`}
                              className="font-medium text-primary-600 hover:underline"
                            >
                              {c ? `${c.code} — ${c.name}` : e.courseId}
                            </Link>
                            <span className="ml-2 text-xs text-slate-400">
                              {e.isMandatory ? 'Mandatory' : 'Optional'}
                              {e.creditsOverride != null
                                ? ` · ${e.creditsOverride} cr override`
                                : ''}
                            </span>
                          </div>
                          <Can resource="course" action="manage">
                            <button
                              onClick={() => removeEntry.mutate(e.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </Can>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </>
        )}
      </main>
    </div>
  );
}
