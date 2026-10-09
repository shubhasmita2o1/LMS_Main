import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  BatchPublic,
  SectionPublic,
  ProgramPublic,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

export function BatchesPage() {
  const [batchForm, setBatchForm] = useState({
    name: '',
    programId: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 4,
  });
  const [sectionForm, setSectionForm] = useState({
    name: '',
    batchId: '',
    maxStudents: 60,
  });
  const [showBatch, setShowBatch] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const qc = useQueryClient();

  const { data: programs } = useQuery({
    queryKey: ['academic', 'programs', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data: batches, isLoading: loadingBatches } = useQuery({
    queryKey: ['academic', 'batches'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BatchPublic[]>>('/academic/batches');
      return data.data || [];
    },
  });

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ['academic', 'sections'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SectionPublic[]>>('/academic/sections');
      return data.data || [];
    },
  });

  const createBatch = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/academic/batches', batchForm);
      if (!data.success) throw new Error(data.error?.message || 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic'] });
      setShowBatch(false);
    },
  });

  const createSection = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/academic/sections', sectionForm);
      if (!data.success) throw new Error(data.error?.message || 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic'] });
      setShowSection(false);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/academic" className="text-sm text-slate-600 hover:text-slate-900">
            ← Academic
          </Link>
          <span className="font-semibold text-slate-900">Batches & Sections</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Batches</h2>
            <Can resource="batch" action="create">
              <button
                onClick={() => setShowBatch((v) => !v)}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white"
              >
                {showBatch ? 'Cancel' : '+ Batch'}
              </button>
            </Can>
          </div>
          {showBatch && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Name (e.g. 2024-28 Batch)"
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <select
                value={batchForm.programId}
                onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Program</option>
                {(programs || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={batchForm.startYear}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, startYear: Number(e.target.value) })
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="number"
                value={batchForm.endYear}
                onChange={(e) => setBatchForm({ ...batchForm, endYear: Number(e.target.value) })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={() => createBatch.mutate()}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white sm:col-span-2"
              >
                Create batch
              </button>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loadingBatches && <p className="p-4 text-slate-400 text-sm">Loading…</p>}
            <ul className="divide-y divide-slate-100">
              {(batches || []).map((b) => (
                <li key={b.id} className="px-4 py-3 flex justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-slate-500">
                    {b.startYear}–{b.endYear}
                  </span>
                </li>
              ))}
              {!loadingBatches && (batches || []).length === 0 && (
                <li className="px-4 py-6 text-center text-slate-400 text-sm">No batches</li>
              )}
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Sections</h2>
            <Can resource="section" action="create">
              <button
                onClick={() => setShowSection((v) => !v)}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white"
              >
                {showSection ? 'Cancel' : '+ Section'}
              </button>
            </Can>
          </div>
          {showSection && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 grid sm:grid-cols-3 gap-3">
              <input
                placeholder="Section name (A, B…)"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <select
                value={sectionForm.batchId}
                onChange={(e) => setSectionForm({ ...sectionForm, batchId: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Batch</option>
                {(batches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={sectionForm.maxStudents}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, maxStudents: Number(e.target.value) })
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={() => createSection.mutate()}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white sm:col-span-3"
              >
                Create section
              </button>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loadingSections && <p className="p-4 text-slate-400 text-sm">Loading…</p>}
            <ul className="divide-y divide-slate-100">
              {(sections || []).map((s) => (
                <li key={s.id} className="px-4 py-3 flex justify-between text-sm">
                  <span className="font-medium">Section {s.name}</span>
                  <span className="text-slate-500">max {s.maxStudents}</span>
                </li>
              ))}
              {!loadingSections && (sections || []).length === 0 && (
                <li className="px-4 py-6 text-center text-slate-400 text-sm">No sections</li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
