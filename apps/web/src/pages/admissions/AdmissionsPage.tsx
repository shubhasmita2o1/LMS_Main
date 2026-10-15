import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_ADMISSIONS, type AdmissionApplication } from '../../data/mockData';
import {
  Plus,
  X,
} from 'lucide-react';

export function AdmissionsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>(MOCK_ADMISSIONS);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('All');

  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    programApplied: 'B.Tech in Computer Science',
    meritRank: 85,
    entranceScore: 95.5,
    quota: 'General' as AdmissionApplication['quota'],
  });

  const columns: Column<AdmissionApplication>[] = [
    {
      key: 'applicantName',
      header: 'Applicant Details',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block">{a.applicantName}</span>
          <span className="text-xs text-slate-500">{a.email}</span>
        </div>
      ),
    },
    {
      key: 'programApplied',
      header: 'Program Choice',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-semibold text-slate-800">{a.programApplied}</span>
      ),
    },
    {
      key: 'meritRank',
      header: 'Merit Rank',
      sortable: true,
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-900">Rank #{a.meritRank}</span>
          <span className="text-[10px] text-slate-400 block">Score: {a.entranceScore}%</span>
        </div>
      ),
    },
    {
      key: 'quota',
      header: 'Category Quota',
      sortable: true,
      render: (a) => (
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {a.quota}
        </span>
      ),
    },
    {
      key: 'documentsVerified',
      header: 'Docs & Fees',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              a.documentsVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {a.documentsVerified ? 'Docs ✓' : 'Pending Docs'}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              a.feePaid ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {a.feePaid ? 'Fee Paid' : 'Fee Due'}
          </span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Intake Stage',
      sortable: true,
      render: (a) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            a.stage === 'Enrolled'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : a.stage === 'Seat Allocated'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : a.stage === 'Counseling'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {a.stage}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      applicantName: formData.applicantName,
      email: formData.email,
      phone: formData.phone,
      programApplied: formData.programApplied,
      meritRank: Number(formData.meritRank),
      entranceScore: Number(formData.entranceScore),
      quota: formData.quota,
      stage: 'Under Review',
      appliedDate: '2026-10-15',
      documentsVerified: false,
      feePaid: false,
    };
    setApplications([newApp, ...applications]);
    setIsCreateOpen(false);
  };

  const filteredApps = applications.filter((a) => {
    if (stageFilter === 'All') return true;
    return a.stage === stageFilter;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Admissions, Merit Lists & Enrollment Pipeline"
        subtitle="Manage prospective candidate applications, rank list generation, document verification, and seat allocation"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Admissions' }]}
        stats={[
          { label: 'Total Applicants', value: '4,280', variant: 'primary' },
          { label: 'Seats Allocated', value: '1,450', variant: 'success' },
          { label: 'Admission Fee Paid', value: '82%', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Register Candidate',
          onClick: () => {
            setFormData({
              applicantName: '',
              email: '',
              phone: '',
              programApplied: 'B.Tech in Computer Science',
              meritRank: 120,
              entranceScore: 92.0,
              quota: 'General',
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={filteredApps}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search candidates by name, email, or rank..."
        exportTitle="admissions_pipeline"
        onRowClick={(a) => {
          setSelectedApp(a);
          setIsDetailOpen(true);
        }}
        filterComponent={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Filter Stage:</span>
            {['All', 'Applied', 'Under Review', 'Counseling', 'Seat Allocated', 'Enrolled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  stageFilter === st
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      />

      {/* Detail Drawer */}
      {selectedApp && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Candidate: ${selectedApp.applicantName}`}
          subtitle={`${selectedApp.programApplied} • Rank #${selectedApp.meritRank}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedApp.stage}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Entrance Test Percentile</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">{selectedApp.entranceScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Reservation Quota</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">{selectedApp.quota}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Document Verification Checklist
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium flex items-center justify-between">
                  <span>Class 10 & 12 Academic Marksheets</span>
                  <span>Verified ✓</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium flex items-center justify-between">
                  <span>National Entrance Examination Rank Card</span>
                  <span>Verified ✓</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium flex items-center justify-between">
                  <span>Government Photo Identity Card (Passport / Aadhaar)</span>
                  <span>Verified ✓</span>
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Register Candidate Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register Admission Candidate</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Name</label>
                <input
                  type="text"
                  required
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  placeholder="Full Legal Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (617) 555-0100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Choice</label>
                  <select
                    value={formData.programApplied}
                    onChange={(e) => setFormData({ ...formData, programApplied: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="B.Tech in Computer Science">B.Tech CSE</option>
                    <option value="B.Tech in Artificial Intelligence">B.Tech AIML</option>
                    <option value="M.Tech in Advanced Computing">M.Tech CS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reservation Quota</label>
                  <select
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC / ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Sports / NRI">Sports / NRI</option>
                  </select>
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
                  Add to Merit Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default AdmissionsPage;
