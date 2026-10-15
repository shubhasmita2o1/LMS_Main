import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MOCK_FACULTY, type Faculty } from '../../data/mockData';
import {
  Plus,
  Award,
  X,
} from 'lucide-react';

export function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>(MOCK_FACULTY);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    designation: 'Professor' as Faculty['designation'],
    department: 'Computer Science & Engineering',
    qualification: 'Ph.D. in Computer Science',
    specialization: '',
    teachingLoadHours: 12,
  });

  const columns: Column<Faculty>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      sortable: true,
      render: (f) => (
        <div className="flex items-center gap-3">
          <img
            src={f.avatar}
            alt={f.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{f.name}</div>
            <div className="text-[11px] font-mono text-primary-700">{f.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation & Dept',
      sortable: true,
      render: (f) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{f.designation}</span>
          <span className="text-xs text-slate-400 block">{f.department}</span>
        </div>
      ),
    },
    {
      key: 'qualification',
      header: 'Academic Credentials',
      sortable: true,
      render: (f) => (
        <div>
          <span className="text-xs font-medium text-slate-700 block">{f.qualification}</span>
          <span className="text-[11px] text-slate-500">{f.specialization}</span>
        </div>
      ),
    },
    {
      key: 'teachingLoadHours',
      header: 'Weekly Load',
      sortable: true,
      render: (f) => (
        <span className="text-xs font-bold text-slate-800">{f.teachingLoadHours} Hours / wk</span>
      ),
    },
    {
      key: 'publicationsCount',
      header: 'Research Works',
      sortable: true,
      render: (f) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <Award className="w-3 h-3 text-amber-500" />
          {f.publicationsCount} Papers
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (f) => (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {f.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFaculty: Faculty = {
      id: `fac-${Date.now()}`,
      employeeId: formData.employeeId || `EMP-CS-0${Math.floor(Math.random() * 90 + 10)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      designation: formData.designation,
      department: formData.department,
      qualification: formData.qualification,
      specialization: formData.specialization,
      teachingLoadHours: Number(formData.teachingLoadHours),
      status: 'active',
      publicationsCount: 12,
      experienceYears: 8,
      joiningDate: '2024-08-01',
    };
    setFacultyList([newFaculty, ...facultyList]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (facultyToDelete) {
      setFacultyList(facultyList.filter((f) => f.id !== facultyToDelete.id));
      setIsDeleteOpen(false);
      setFacultyToDelete(null);
      setIsDetailOpen(false);
    }
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Faculty Management & Academic Workload"
        subtitle="Manage professors, teaching assignments, research publications, and performance appraisals"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Faculty' }]}
        stats={[
          { label: 'Active Faculty', value: facultyList.length, variant: 'primary' },
          { label: 'Ph.D. Holders', value: '88%', variant: 'success' },
          { label: 'Avg Teaching Load', value: '14.5 hrs', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Onboard Faculty',
          onClick: () => {
            setFormData({
              name: '',
              employeeId: '',
              email: '',
              phone: '',
              designation: 'Assistant Professor',
              department: 'Computer Science & Engineering',
              qualification: 'Ph.D. in Computer Science',
              specialization: 'Distributed Systems',
              teachingLoadHours: 14,
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={facultyList}
        columns={columns}
        keyExtractor={(f) => f.id}
        searchPlaceholder="Search faculty by name, ID, or specialization..."
        exportTitle="faculty_directory"
        onRowClick={handleRowClick}
      />

      {/* Faculty Detail Drawer */}
      {selectedFaculty && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedFaculty.name}
          subtitle={`${selectedFaculty.designation} • ${selectedFaculty.department}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedFaculty.employeeId}
            </span>
          }
          onDelete={() => {
            setFacultyToDelete(selectedFaculty);
            setIsDeleteOpen(true);
          }}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={selectedFaculty.avatar}
                alt={selectedFaculty.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900">{selectedFaculty.name}</h3>
                <p className="text-xs text-slate-500">{selectedFaculty.email}</p>
                <p className="text-xs font-semibold text-primary-700 mt-1">
                  {selectedFaculty.qualification}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Teaching Experience</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedFaculty.experienceYears} Years
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Publications</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedFaculty.publicationsCount} Indexed
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assigned Courses (Fall 2026)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">CS301: Operating Systems</span>
                  <span className="text-slate-500">4.0 Credits • 142 Students</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">CS304L: Systems Programming Lab</span>
                  <span className="text-slate-500">2.0 Credits • 72 Students</span>
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Onboard Faculty Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Onboard Faculty Member</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Prof. / Dr. Full Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Auto if empty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="faculty@northridge.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Highest Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. Ph.D. from MIT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Teaching Hours</label>
                  <input
                    type="number"
                    value={formData.teachingLoadHours}
                    onChange={(e) => setFormData({ ...formData, teachingLoadHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  Onboard Faculty
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
        title="Archive Faculty Record?"
        description="Assigned courses and research authorship records will be archived in the university central repository."
        itemName={facultyToDelete ? `${facultyToDelete.name} (${facultyToDelete.employeeId})` : ''}
        confirmLabel="Confirm Archive"
      />
    </AppLayout>
  );
}
export default FacultyPage;
