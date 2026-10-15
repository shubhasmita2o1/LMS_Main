import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_EXAMS, type ExamRecord } from '../../data/mockData';
import {
  CalendarDays,
  Clock,
  Printer,
  FileText,
  Plus,
  QrCode,
  X,
} from 'lucide-react';

export function ExaminationsPage() {
  const [exams, setExams] = useState<ExamRecord[]>(MOCK_EXAMS);
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdmitCardOpen, setIsAdmitCardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    examName: 'Fall 2026 Mid-Term Examination',
    courseCode: 'CS304',
    courseName: 'Algorithms & Data Structures',
    date: '2026-11-14',
    timeSlot: '09:30 AM - 12:30 PM',
    room: 'Hall C-101 (Seating 120)',
    totalCandidates: 140,
    proctorName: 'Dr. Marcus Vance',
  });

  const columns: Column<ExamRecord>[] = [
    {
      key: 'courseCode',
      header: 'Course & Exam Title',
      sortable: true,
      render: (e) => (
        <div>
          <span className="font-bold text-slate-900 block">{e.courseName}</span>
          <span className="text-xs font-mono text-primary-700">
            {e.courseCode} • {e.examName}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Scheduled Date & Time',
      sortable: true,
      render: (e) => (
        <div>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            {e.date}
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            {e.timeSlot}
          </span>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Hall / Center',
      sortable: true,
      render: (e) => (
        <span className="text-xs text-slate-700 font-medium block max-w-xs truncate">
          {e.room}
        </span>
      ),
    },
    {
      key: 'totalCandidates',
      header: 'Candidates',
      sortable: true,
      render: (e) => (
        <span className="text-xs font-bold text-slate-800">{e.totalCandidates} Students</span>
      ),
    },
    {
      key: 'admitCardReleased',
      header: 'Admit Cards',
      sortable: true,
      render: (e) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            e.admitCardReleased
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {e.admitCardReleased ? 'Released ✓' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (e) => (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
          {e.status}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: ExamRecord = {
      id: `ex-${Date.now()}`,
      examName: formData.examName,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      date: formData.date,
      timeSlot: formData.timeSlot,
      room: formData.room,
      totalCandidates: Number(formData.totalCandidates),
      admitCardReleased: false,
      seatingPlanned: true,
      proctorName: formData.proctorName,
      status: 'Scheduled',
    };
    setExams([newExam, ...exams]);
    setIsCreateOpen(false);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Examinations, Seating & Admit Cards"
        subtitle="Manage semester examination schedules, hall ticket generation, invigilation duties, and seating layout"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Examinations' }]}
        stats={[
          { label: 'Scheduled Exams', value: exams.length, variant: 'primary' },
          { label: 'Total Candidates', value: 440, variant: 'default' },
          { label: 'Admit Cards Live', value: '2 of 3', variant: 'success' },
        ]}
        primaryAction={{
          label: 'Schedule Exam Slot',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
        secondaryAction={{
          label: 'Preview Student Hall Ticket',
          onClick: () => setIsAdmitCardOpen(true),
          icon: <FileText className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={exams}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search exams by course code, hall, or proctor..."
        exportTitle="exam_schedule"
        onRowClick={(e) => {
          setSelectedExam(e);
          setIsDetailOpen(true);
        }}
      />

      {/* Exam Detail Drawer */}
      {selectedExam && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`${selectedExam.courseCode}: ${selectedExam.courseName}`}
          subtitle={`${selectedExam.examName} • ${selectedExam.date}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedExam.status}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Assigned Invigilators</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedExam.proctorName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Total Candidates</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {selectedExam.totalCandidates} Registered Students
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Automated Seating Plan
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Roll numbers are alternated column-wise across engineering departments to prevent cheating.
              </p>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-100 text-center text-[10px] font-mono font-bold text-slate-700">
                    Seat {i + 1}: 2023CSE010{i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Student Admit Card / Hall Ticket Modal (Print-ready) */}
      {isAdmitCardOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            {/* Modal Actions */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-800">Student Official Hall Ticket Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdmitCardOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Print Layout */}
            <div className="p-8 space-y-6">
              <div className="text-center border-b pb-4 border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                  Northridge University
                </h2>
                <p className="text-xs text-slate-500 font-medium">Office of the Controller of Examinations</p>
                <div className="inline-block mt-2 px-3 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
                  Official Admit Card • Fall Semester Examinations 2026
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs space-y-1.5">
                  <div>
                    <span className="text-slate-400">Candidate Name: </span>
                    <strong className="text-slate-900">Jordan Hayes</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">University Roll No: </span>
                    <strong className="text-primary-700 font-mono">2023CSE0101</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Program / Degree: </span>
                    <strong className="text-slate-800">B.Tech in Computer Science & Engg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Center: </span>
                    <strong className="text-slate-800">Main Campus (Back Bay) • Hall A-102</strong>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-20 h-24 rounded border border-slate-300 bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold mb-1">
                    PHOTO AFFIXED
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">VERIFIED</span>
                </div>
              </div>

              {/* Exam Schedule Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-b">Code</th>
                    <th className="p-2 border-b">Course Title</th>
                    <th className="p-2 border-b">Date</th>
                    <th className="p-2 border-b">Time Slot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  <tr>
                    <td className="p-2 font-mono font-bold">CS301</td>
                    <td className="p-2">Operating Systems & Kernel Architecture</td>
                    <td className="p-2">04 Nov 2026</td>
                    <td className="p-2">09:30 AM - 12:30 PM</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono font-bold">CS302</td>
                    <td className="p-2">Distributed Databases & Big Data</td>
                    <td className="p-2">06 Nov 2026</td>
                    <td className="p-2">02:00 PM - 05:00 PM</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono font-bold">CS303</td>
                    <td className="p-2">Applied Machine Learning</td>
                    <td className="p-2">09 Nov 2026</td>
                    <td className="p-2">09:30 AM - 12:30 PM</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-8 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[10px] text-slate-400 max-w-[140px] leading-tight">
                    Scan at entrance checkpoint for biometric verification
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700 block text-[11px]">Controller of Examinations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Schedule Examination Slot</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    placeholder="09:30 AM - 12:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hall / Center</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Auditorium (200 seats)"
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
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default ExaminationsPage;
