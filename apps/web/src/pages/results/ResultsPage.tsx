import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_RESULTS, type ResultGrade } from '../../data/mockData';
import {
  Printer,
  QrCode,
  X,
} from 'lucide-react';

export function ResultsPage() {
  const [results] = useState<ResultGrade[]>(MOCK_RESULTS);
  const [selectedResult, setSelectedResult] = useState<ResultGrade | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const columns: Column<ResultGrade>[] = [
    {
      key: 'studentName',
      header: 'Student & Roll No',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block">{r.studentName}</span>
          <span className="text-xs font-mono text-primary-700">{r.studentRollNo}</span>
        </div>
      ),
    },
    {
      key: 'courseCode',
      header: 'Course Evaluated',
      sortable: true,
      render: (r) => (
        <div>
          <span className="text-xs font-bold text-slate-800">{r.courseName}</span>
          <span className="text-[11px] font-mono text-slate-400 block">{r.courseCode}</span>
        </div>
      ),
    },
    {
      key: 'internalMarks',
      header: 'Internal (/50)',
      sortable: true,
      render: (r) => <span className="text-xs font-semibold text-slate-700">{r.internalMarks}</span>,
    },
    {
      key: 'endSemMarks',
      header: 'End-Sem (/50)',
      sortable: true,
      render: (r) => <span className="text-xs font-semibold text-slate-700">{r.endSemMarks}</span>,
    },
    {
      key: 'totalMarks',
      header: 'Total (/100)',
      sortable: true,
      render: (r) => (
        <span className="text-xs font-extrabold text-slate-900">{r.totalMarks}</span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade & Points',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-extrabold px-2 py-0.5 rounded ${
              r.grade === 'O'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : r.grade === 'A+' || r.grade === 'A'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {r.grade}
          </span>
          <span className="text-xs font-bold text-slate-600">({r.gradePoints}.0)</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Moderation Status',
      sortable: true,
      render: (r) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            r.status === 'Published'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <ModuleHeader
        title="Results, Gradebook & Official Transcripts"
        subtitle="Compute semester SGPA, cumulative CGPA, continuous evaluation moderation, and transcripts"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Results & Gradebook' }]}
        stats={[
          { label: 'Published Grades', value: `${results.length} Records`, variant: 'primary' },
          { label: 'Semester Pass Rate', value: '96.2%', variant: 'success' },
          { label: 'Average SGPA', value: '3.78', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Generate Transcript (Marksheet)',
          onClick: () => setIsTranscriptOpen(true),
          icon: <Printer className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={results}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search grades by student name, roll no, or course..."
        exportTitle="gradebook_records"
        onRowClick={(r) => {
          setSelectedResult(r);
          setIsDetailOpen(true);
        }}
      />

      {/* Result Detail Drawer */}
      {selectedResult && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Grade Record: ${selectedResult.studentName}`}
          subtitle={`${selectedResult.studentRollNo} • ${selectedResult.courseName}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              Grade {selectedResult.grade}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Internal Marks</span>
                <span className="text-base font-bold text-slate-900">{selectedResult.internalMarks} / 50</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">End-Sem Marks</span>
                <span className="text-base font-bold text-slate-900">{selectedResult.endSemMarks} / 50</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Total Combined</span>
                <span className="text-base font-bold text-primary-700">{selectedResult.totalMarks} / 100</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                10-Point UGC / AICTE Grading Scale Mapping
              </h4>
              <p className="text-xs text-slate-500">
                Grade: <strong>{selectedResult.grade}</strong> (Outstanding) • Grade Points: <strong>{selectedResult.gradePoints}</strong>
              </p>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Official Marksheet / Transcript Modal */}
      {isTranscriptOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-800">Semester Grade Card & Official Transcript</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Grade Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTranscriptOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center border-b pb-4 border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase">
                  Northridge University
                </h2>
                <p className="text-xs text-slate-500">Accredited NAAC A++ • Member of Association of Commonwealth Universities</p>
                <div className="inline-block mt-2 px-3 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
                  Official Statement of Grades • Semester V
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Candidate Name:</span>
                  <strong className="text-slate-900 text-sm">Jordan Hayes</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">University Roll No:</span>
                  <strong className="text-primary-700 font-mono text-sm">2023CSE0101</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Program:</span>
                  <strong className="text-slate-800">B.Tech in Computer Science & Engg</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Year:</span>
                  <strong className="text-slate-800">Fall Semester 2026</strong>
                </div>
              </div>

              {/* Subject Grades Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-b">Code</th>
                    <th className="p-2 border-b">Course Name</th>
                    <th className="p-2 border-b">Credits</th>
                    <th className="p-2 border-b">Grade</th>
                    <th className="p-2 border-b">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="p-2 font-mono">CS301</td>
                    <td className="p-2">Operating Systems & Kernel Architecture</td>
                    <td className="p-2">4.0</td>
                    <td className="p-2 font-bold text-purple-700">O</td>
                    <td className="p-2">10.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">CS302</td>
                    <td className="p-2">Distributed Databases & Big Data</td>
                    <td className="p-2">4.0</td>
                    <td className="p-2 font-bold text-purple-700">O</td>
                    <td className="p-2">10.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">CS303</td>
                    <td className="p-2">Applied Machine Learning</td>
                    <td className="p-2">3.5</td>
                    <td className="p-2 font-bold text-emerald-700">A+</td>
                    <td className="p-2">9.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">CS304L</td>
                    <td className="p-2">Systems Programming Lab</td>
                    <td className="p-2">2.0</td>
                    <td className="p-2 font-bold text-purple-700">O</td>
                    <td className="p-2">10.0</td>
                  </tr>
                </tbody>
              </table>

              {/* SGPA & CGPA Summary */}
              <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-primary-800 block">Semester GPA (SGPA):</span>
                  <strong className="text-xl font-extrabold text-primary-900">3.94</strong>
                </div>
                <div>
                  <span className="text-primary-800 block">Cumulative GPA (CGPA):</span>
                  <strong className="text-xl font-extrabold text-primary-900">3.88</strong>
                </div>
                <div>
                  <span className="text-primary-800 block">Result Classification:</span>
                  <strong className="text-emerald-700 font-bold uppercase">First Class with Distinction</strong>
                </div>
              </div>

              <div className="flex justify-between items-end pt-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[10px] text-slate-400 max-w-[140px] leading-tight">
                    Verify authenticity online at https://verify.northridge.edu
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700 block text-[11px]">Dean of Academic Affairs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default ResultsPage;
