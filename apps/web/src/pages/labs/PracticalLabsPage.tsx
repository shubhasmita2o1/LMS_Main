/**
 * @deprecated UNUSED MOCK / UNROUTED:
 * This component is an early static prototype mock and is not currently routed in the application.
 * Phase 11 Practical & Lab Platform is served by LabsPage at '/labs'.
 */
import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import {
  FlaskConical,
  Monitor,
  ExternalLink,
  Award,
  FileCode,
} from 'lucide-react';

interface LabSubmission {
  id: string;
  studentRollNo: string;
  studentName: string;
  experimentTitle: string;
  workstationNo: string;
  submittedAt: string;
  repoUrl: string;
  vivaScore: number;
  codeQualityScore: number;
  totalScore: number;
  status: 'Graded' | 'Pending Review' | 'Revision Required';
}

const MOCK_SUBMISSIONS: LabSubmission[] = [
  {
    id: 'sub-1',
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    experimentTitle: 'Exp 4: Linux Character Driver & /proc Entry',
    workstationNo: 'WS-Lab3-04',
    submittedAt: 'Today, 02:15 PM',
    repoUrl: 'https://github.com/nru-cse/lab-char-driver-jordan',
    vivaScore: 19,
    codeQualityScore: 28,
    totalScore: 47,
    status: 'Graded',
  },
  {
    id: 'sub-2',
    studentRollNo: '2023CSE0102',
    studentName: 'Aarav Patel',
    experimentTitle: 'Exp 4: Linux Character Driver & /proc Entry',
    workstationNo: 'WS-Lab3-08',
    submittedAt: 'Today, 02:30 PM',
    repoUrl: 'https://github.com/nru-cse/lab-char-driver-aarav',
    vivaScore: 20,
    codeQualityScore: 30,
    totalScore: 50,
    status: 'Graded',
  },
  {
    id: 'sub-3',
    studentRollNo: '2023CSE0103',
    studentName: 'Chloe Tremblay',
    experimentTitle: 'Exp 4: Linux Character Driver & /proc Entry',
    workstationNo: 'WS-Lab3-12',
    submittedAt: 'Yesterday, 04:45 PM',
    repoUrl: 'https://github.com/nru-cse/lab-char-driver-chloe',
    vivaScore: 16,
    codeQualityScore: 24,
    totalScore: 40,
    status: 'Graded',
  },
  {
    id: 'sub-4',
    studentRollNo: '2023CSE0104',
    studentName: 'Mateo Rossi',
    experimentTitle: 'Exp 4: Linux Character Driver & /proc Entry',
    workstationNo: 'WS-Lab3-16',
    submittedAt: 'Yesterday, 05:10 PM',
    repoUrl: 'https://github.com/nru-cse/lab-char-driver-mateo',
    vivaScore: 0,
    codeQualityScore: 0,
    totalScore: 0,
    status: 'Pending Review',
  },
];

export function PracticalLabsPage() {
  const [submissions] = useState<LabSubmission[]>(MOCK_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<LabSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const columns: Column<LabSubmission>[] = [
    {
      key: 'studentName',
      header: 'Student & Roll No',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-bold text-slate-900 block">{s.studentName}</span>
          <span className="text-xs font-mono text-primary-700">{s.studentRollNo}</span>
        </div>
      ),
    },
    {
      key: 'experimentTitle',
      header: 'Experiment Title',
      sortable: true,
      render: (s) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{s.experimentTitle}</span>
          <span className="text-[11px] text-slate-400 block">{s.workstationNo}</span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (s) => <span className="text-xs text-slate-500">{s.submittedAt}</span>,
    },
    {
      key: 'totalScore',
      header: 'Rubric Score',
      sortable: true,
      render: (s) => (
        <div>
          <span className="text-xs font-bold text-slate-900">{s.totalScore} / 50</span>
          <span className="text-[10px] text-slate-400 block">
            Code: {s.codeQualityScore} • Viva: {s.vivaScore}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Evaluation Status',
      sortable: true,
      render: (s) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            s.status === 'Graded'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
          }`}
        >
          {s.status}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <ModuleHeader
        title="Practical & Virtual Laboratories"
        subtitle="Manage laboratory experiments, workstation hardware status, code evaluations, and viva scoring"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Practical Labs' }]}
        stats={[
          { label: 'Lab Sessions', value: 'CS304L (Sec A)', variant: 'primary' },
          { label: 'Workstations Online', value: '36 / 36', variant: 'success' },
          { label: 'Submissions Graded', value: '75%', variant: 'default' },
        ]}
      />

      {/* Lab Hardware & Workstations Live Status Banner */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">Lab Infrastructure</span>
            <Monitor className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Systems & OS Lab 3</div>
          <p className="text-xs text-slate-500 mt-0.5">36 Dual-Boot Workstations (Linux 6.8 Kernel)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">Current Experiment</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">Exp 4: LKM Device Driver</div>
          <p className="text-xs text-slate-500 mt-0.5">Kernel module compilation, insmod, rmmod & /proc</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">Evaluation Rubrics</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">50 Marks Total</div>
          <p className="text-xs text-slate-500 mt-0.5">30 Marks (Code & Execution) + 20 Marks (Viva Voce)</p>
        </div>
      </div>

      <DataTable
        data={submissions}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search student submissions by name or roll number..."
        exportTitle="lab_submissions"
        onRowClick={(s) => {
          setSelectedSub(s);
          setIsDetailOpen(true);
        }}
      />

      {/* Lab Submission Detail Drawer */}
      {selectedSub && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Lab Submission: ${selectedSub.studentName}`}
          subtitle={`${selectedSub.studentRollNo} • ${selectedSub.workstationNo}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedSub.status}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Experiment Submission Artifacts
              </h4>
              <div className="text-xs text-slate-700">
                <span className="text-slate-400 block mb-1">Source Code Repository:</span>
                <a
                  href={selectedSub.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary-600 hover:underline flex items-center gap-1.5"
                >
                  <FileCode className="w-4 h-4" />
                  <span>{selectedSub.repoUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Rubrics Breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rubric Grade Moderation
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">Code Quality & Memory Safety:</span>
                  <span className="font-bold text-slate-900">{selectedSub.codeQualityScore} / 30</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700">Live Viva-Voce Oral Defense:</span>
                  <span className="font-bold text-slate-900">{selectedSub.vivaScore} / 20</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-primary-50 text-primary-900 font-bold border border-primary-200">
                  <span>Total Practical Marks:</span>
                  <span>{selectedSub.totalScore} / 50</span>
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </AppLayout>
  );
}
export default PracticalLabsPage;
