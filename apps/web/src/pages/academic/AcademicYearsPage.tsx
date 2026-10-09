import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, AcademicYearPublic, SemesterPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function AcademicYearsPage() {
  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  });
  const [semForm, setSemForm] = useState({
    name: '',
    academicYearId: '',
    sequence: 1,
    isCurrent: false,
  });
  const [showYear, setShowYear] = useState(false);
  const [showSem, setShowSem] = useState(false);
  const qc = useQueryClient();

  const { data: years } = useQuery({
    queryKey: ['academic', 'years'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AcademicYearPublic[]>>('/academic/academic-years');
      return data.data || [];
    },
  });

  const { data: semesters } = useQuery({
    queryKey: ['academic', 'semesters'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SemesterPublic[]>>('/academic/semesters');
      return data.data || [];
    },
  });

  const createYear = useMutation({
    mutationFn: () =>
      api.post('/academic/academic-years', {
        ...yearForm,
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'years'] });
      setShowYear(false);
    },
  });

  const setCurrentYear = useMutation({
    mutationFn: (id: string) => api.post(`/academic/academic-years/${id}/set-current`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic', 'years'] }),
  });

  const createSem = useMutation({
    mutationFn: () => api.post('/academic/semesters', semForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'semesters'] });
      setShowSem(false);
    },
  });

  const setCurrentSem = useMutation({
    mutationFn: (id: string) => api.post(`/academic/semesters/${id}/set-current`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic', 'semesters'] }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/academic" className="text-sm text-slate-600 hover:text-slate-900">
            ← Academic
          </Link>
          <span className="font-semibold text-slate-900">Years & Semesters</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section>
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Academic years</h2>
            <Can resource="university" action="create">
              <button
                onClick={() => setShowYear((v) => !v)}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white"
              >
                {showYear ? 'Cancel' : '+ Year'}
              </button>
            </Can>
          </div>
          {showYear && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Name (2025-26)"
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={yearForm.isCurrent}
                  onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                />
                Mark as current
              </label>
              <input
                type="date"
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="date"
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={() => createYear.mutate()}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white sm:col-span-2"
              >
                Create year
              </button>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {(years || []).map((y) => (
              <div key={y.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{y.name}</span>
                  {y.isCurrent && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      current
                    </span>
                  )}
                </div>
                {!y.isCurrent && (
                  <Can resource="university" action="manage">
                    <button
                      onClick={() => setCurrentYear.mutate(y.id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Set current
                    </button>
                  </Can>
                )}
              </div>
            ))}
            {(years || []).length === 0 && (
              <p className="px-4 py-6 text-center text-slate-400 text-sm">No academic years</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Semesters / Terms</h2>
            <Can resource="university" action="create">
              <button
                onClick={() => setShowSem((v) => !v)}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white"
              >
                {showSem ? 'Cancel' : '+ Semester'}
              </button>
            </Can>
          </div>
          {showSem && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Name (Odd / Fall / 1)"
                value={semForm.name}
                onChange={(e) => setSemForm({ ...semForm, name: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <select
                value={semForm.academicYearId}
                onChange={(e) => setSemForm({ ...semForm, academicYearId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Academic year</option>
                {(years || []).map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={semForm.sequence}
                onChange={(e) => setSemForm({ ...semForm, sequence: Number(e.target.value) })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={semForm.isCurrent}
                  onChange={(e) => setSemForm({ ...semForm, isCurrent: e.target.checked })}
                />
                Mark as current
              </label>
              <button
                onClick={() => createSem.mutate()}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white sm:col-span-2"
              >
                Create semester
              </button>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {(semesters || []).map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-slate-400">#{s.sequence}</span>
                  {s.isCurrent && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      current
                    </span>
                  )}
                </div>
                {!s.isCurrent && (
                  <Can resource="university" action="manage">
                    <button
                      onClick={() => setCurrentSem.mutate(s.id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Set current
                    </button>
                  </Can>
                )}
              </div>
            ))}
            {(semesters || []).length === 0 && (
              <p className="px-4 py-6 text-center text-slate-400 text-sm">No semesters</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
