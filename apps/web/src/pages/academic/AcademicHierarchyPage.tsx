import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MOCK_PROGRAMS, MOCK_ACADEMIC_UNITS, MOCK_CAMPUSES, type Program } from '../../data/mockData';
import {
  Building2,
  Layers,
  Plus,
  BookOpen,
  X,
} from 'lucide-react';

export function AcademicHierarchyPage() {
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    degreeType: 'B.Tech' as Program['degreeType'],
    departmentId: 'u-cs',
    departmentName: 'Computer Science & Engineering',
    durationYears: 4,
    totalCredits: 160,
  });

  const columns: Column<Program>[] = [
    {
      key: 'name',
      header: 'Program Name & Code',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>{p.name}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {p.code}
            </span>
          </div>
          <span className="text-xs text-slate-400">{p.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'degreeType',
      header: 'Level',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
          {p.degreeType}
        </span>
      ),
    },
    {
      key: 'durationYears',
      header: 'Duration',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-medium text-slate-700">
          {p.durationYears} Years ({p.totalSemesters} Semesters)
        </span>
      ),
    },
    {
      key: 'totalCredits',
      header: 'Total Credits',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-bold text-slate-800">{p.totalCredits} Credits</span>
      ),
    },
    {
      key: 'currentBatches',
      header: 'Active Batches',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-semibold text-slate-700">{p.currentBatches} Cohorts</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {p.status}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProg: Program = {
      id: `p-${Date.now()}`,
      departmentId: formData.departmentId,
      departmentName: formData.departmentName,
      name: formData.name,
      code: formData.code.toUpperCase(),
      degreeType: formData.degreeType,
      durationYears: Number(formData.durationYears),
      totalSemesters: Number(formData.durationYears) * 2,
      totalCredits: Number(formData.totalCredits),
      currentBatches: 1,
      status: 'active',
    };
    setPrograms([newProg, ...programs]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (programToDelete) {
      setPrograms(programs.filter((p) => p.id !== programToDelete.id));
      setIsDeleteOpen(false);
      setProgramToDelete(null);
      setIsDetailOpen(false);
    }
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Campus & Academic Hierarchy"
        subtitle="Manage campuses, academic schools, departments, degree programs, batches, and sections"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Academic Hierarchy' }]}
        stats={[
          { label: 'Campuses', value: 4, variant: 'primary' },
          { label: 'Schools', value: 8, variant: 'default' },
          { label: 'Departments', value: 24, variant: 'default' },
          { label: 'Programs', value: programs.length, variant: 'success' },
        ]}
        primaryAction={{
          label: 'Add Degree Program',
          onClick: () => {
            setFormData({
              name: '',
              code: '',
              degreeType: 'B.Tech',
              departmentId: 'u-cs',
              departmentName: 'Computer Science & Engineering',
              durationYears: 4,
              totalCredits: 160,
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
        secondaryAction={{
          label: viewMode === 'table' ? 'View Hierarchy Tree' : 'View Data Table',
          onClick: () => setViewMode(viewMode === 'table' ? 'tree' : 'table'),
          icon: <Layers className="w-4 h-4" />,
        }}
      />

      {viewMode === 'tree' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            <span>Institutional Academic Organization Tree</span>
          </h3>

          <div className="space-y-4">
            {MOCK_CAMPUSES.map((campus) => (
              <div key={campus.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-600" />
                    <span className="font-bold text-sm text-slate-900">{campus.name}</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-slate-200 text-slate-700">
                      {campus.code}
                    </span>
                    {campus.isMainCampus && (
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                        Main Flagship Campus
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Director: {campus.director} • {campus.totalStudents.toLocaleString()} Students
                  </span>
                </div>

                <div className="pl-6 space-y-3 border-l-2 border-primary-200 ml-2">
                  {MOCK_ACADEMIC_UNITS.map((unit) => (
                    <div key={unit.id} className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-xs text-slate-800">{unit.name}</span>
                          <span className="text-[10px] text-slate-400">({unit.code})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          HOD: {unit.headName} • {unit.totalFaculty} Faculty
                        </span>
                      </div>

                      {/* Programs inside Unit */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                        {programs
                          .filter((p) => p.departmentId === unit.id)
                          .map((prog) => (
                            <span
                              key={prog.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              {prog.name} ({prog.code})
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DataTable
          data={programs}
          columns={columns}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Search programs, departments, or codes..."
          exportTitle="academic_programs"
          onRowClick={(p) => {
            setSelectedProgram(p);
            setIsDetailOpen(true);
          }}
        />
      )}

      {/* Program Detail Drawer */}
      {selectedProgram && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedProgram.name}
          subtitle={`${selectedProgram.code} • ${selectedProgram.departmentName}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedProgram.degreeType}
            </span>
          }
          onDelete={() => {
            setProgramToDelete(selectedProgram);
            setIsDeleteOpen(true);
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">Total Program Credits</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedProgram.totalCredits} Units</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">Total Duration</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedProgram.durationYears} Years ({selectedProgram.totalSemesters} Semesters)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Cohort Batches & Class Sections
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-800">Batch 2023 - 2027 (Current 5th Sem)</span>
                  <span className="text-slate-600">Sections A, B, C (210 Students)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-800">Batch 2024 - 2028 (Current 3rd Sem)</span>
                  <span className="text-slate-600">Sections A, B, C (225 Students)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="font-semibold text-slate-800">Batch 2025 - 2029 (Current 1st Sem)</span>
                  <span className="text-slate-600">Sections A, B, C, D (260 Students)</span>
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Add Program Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Academic Degree Program</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. B.Tech in Cyber Security & Forensics"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BTECH-CYBER"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree Type</label>
                  <select
                    value={formData.degreeType}
                    onChange={(e) => setFormData({ ...formData, degreeType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="MBA">MBA</option>
                    <option value="Ph.D">Ph.D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.durationYears}
                    onChange={(e) => setFormData({ ...formData, durationYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Graduation Credits</label>
                  <input
                    type="number"
                    value={formData.totalCredits}
                    onChange={(e) => setFormData({ ...formData, totalCredits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Degree Program?"
        description="This program will be archived. Enrolled students and transcripts will remain intact in compliance with UGC/ABET regulations."
        itemName={programToDelete ? `${programToDelete.name} (${programToDelete.code})` : ''}
        confirmLabel="Confirm Archive"
      />
    </AppLayout>
  );
}
export default AcademicHierarchyPage;
