import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_PLACEMENTS, type PlacementDrive } from '../../data/mockData';
import {
  Calendar,
  Plus,
  X,
} from 'lucide-react';

export function PlacementPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>(MOCK_PLACEMENTS);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    packageLPA: '$140,000 / yr',
    minCGPA: 3.5,
    driveDate: '2026-11-25',
  });

  const columns: Column<PlacementDrive>[] = [
    {
      key: 'companyName',
      header: 'Company & Role',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <img
            src={d.logo}
            alt={d.companyName}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="font-bold text-slate-900 block truncate">{d.companyName}</span>
            <span className="text-xs text-slate-500 truncate block">{d.role}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'packageLPA',
      header: 'Compensation Package',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {d.packageLPA}
        </span>
      ),
    },
    {
      key: 'minCGPA',
      header: 'Eligibility Criteria',
      sortable: true,
      render: (d) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">Min {d.minCGPA} CGPA</span>
          <span className="text-[10px] text-slate-400 block">{d.eligiblePrograms.join(', ')}</span>
        </div>
      ),
    },
    {
      key: 'driveDate',
      header: 'Recruitment Date',
      sortable: true,
      render: (d) => (
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{d.driveDate}</span>
        </div>
      ),
    },
    {
      key: 'registeredStudents',
      header: 'Registered / Offers',
      sortable: true,
      render: (d) => (
        <div>
          <span className="text-xs font-bold text-slate-900">{d.registeredStudents} Applied</span>
          <span className="text-[10px] text-emerald-600 font-bold block">{d.selectedCount} Offers Extended</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Drive Status',
      sortable: true,
      render: (d) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            d.status === 'Ongoing'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
              : d.status === 'Upcoming'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {d.status}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDrive: PlacementDrive = {
      id: `plc-${Date.now()}`,
      companyName: formData.companyName,
      logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80',
      role: formData.role,
      packageLPA: formData.packageLPA,
      eligiblePrograms: ['B.Tech CSE', 'B.Tech AIML'],
      minCGPA: Number(formData.minCGPA),
      driveDate: formData.driveDate,
      registeredStudents: 45,
      selectedCount: 0,
      status: 'Upcoming',
    };
    setDrives([newDrive, ...drives]);
    setIsCreateOpen(false);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Placement, Internship & Career Cell"
        subtitle="Manage company campus recruitment drives, student shortlist interviews, and job offer letters"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Placement' }]}
        stats={[
          { label: 'Highest Package', value: '$170,000 / yr', variant: 'success' },
          { label: 'Median Package', value: '$122,000 / yr', variant: 'primary' },
          { label: 'Placement Rate', value: '94.2%', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Schedule Placement Drive',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={drives}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search placement drives by company or role..."
        exportTitle="placement_drives"
        onRowClick={(d) => {
          setSelectedDrive(d);
          setIsDetailOpen(true);
        }}
      />

      {/* Placement Detail Drawer */}
      {selectedDrive && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedDrive.companyName}
          subtitle={`${selectedDrive.role} • ${selectedDrive.packageLPA}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedDrive.status}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Minimum Cutoff CGPA</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedDrive.minCGPA} / 4.0</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Drive Date</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedDrive.driveDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recruitment Rounds Pipeline
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Round 1: Online Coding & Cognitive Assessment</span>
                  <span className="font-bold text-emerald-600">Completed (48 Cleared)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Round 2: Systems Architecture & Technical Interview</span>
                  <span className="font-bold text-amber-600">In Progress (18 Shortlisted)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                  <span>Round 3: Leadership & Cultural Fit HR Interview</span>
                  <span className="font-bold text-slate-400">Scheduled for Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Schedule Drive Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Schedule Campus Recruitment Drive</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apple Inc. / Amazon"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Designation</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Cloud Infrastructure Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Package CTC</label>
                  <input
                    type="text"
                    value={formData.packageLPA}
                    onChange={(e) => setFormData({ ...formData, packageLPA: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minCGPA}
                    onChange={(e) => setFormData({ ...formData, minCGPA: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Drive Date</label>
                <input
                  type="date"
                  required
                  value={formData.driveDate}
                  onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
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
                  Confirm Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default PlacementPage;
