import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_ASSESSMENTS, type AssessmentItem } from '../../data/mockData';
import {
  Calendar,
  Plus,
  HelpCircle,
  X,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  courseCode: string;
  unit: number;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cognitiveLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze';
  marks: number;
}

const MOCK_QUESTIONS: QuestionItem[] = [
  { id: 'q1', courseCode: 'CS301', unit: 1, question: 'Explain how the Completely Fair Scheduler (CFS) calculates virtual runtime (vruntime) using red-black trees.', difficulty: 'Medium', cognitiveLevel: 'Understand', marks: 5 },
  { id: 'q2', courseCode: 'CS301', unit: 2, question: 'Provide an implementation of the Readers-Writers problem using POSIX counting semaphores ensuring no writer starvation.', difficulty: 'Hard', cognitiveLevel: 'Apply', marks: 10 },
  { id: 'q3', courseCode: 'CS301', unit: 3, question: 'Given an address translation scheme with 4KB pages and 48-bit virtual addresses, compute the maximum size of a two-level page table.', difficulty: 'Hard', cognitiveLevel: 'Analyze', marks: 10 },
  { id: 'q4', courseCode: 'CS302', unit: 1, question: 'Define CAP Theorem and explain why PACELC Theorem is considered a more realistic taxonomy for distributed database trade-offs.', difficulty: 'Medium', cognitiveLevel: 'Understand', marks: 5 },
  { id: 'q5', courseCode: 'CS302', unit: 2, question: 'Illustrate Raft leader election invariants and how split votes are mitigated using randomized election timeouts.', difficulty: 'Medium', cognitiveLevel: 'Apply', marks: 8 },
];

export function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<'assignments' | 'questions'>('assignments');
  const [assessments, setAssessments] = useState<AssessmentItem[]>(MOCK_ASSESSMENTS);
  const [questions] = useState<QuestionItem[]>(MOCK_QUESTIONS);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    type: 'Assignment' as AssessmentItem['type'],
    dueDate: '2026-11-10',
    maxScore: 100,
    weightage: '15% of Internal',
  });

  const assessmentColumns: Column<AssessmentItem>[] = [
    {
      key: 'title',
      header: 'Assessment Title & Course',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block">{a.title}</span>
          <span className="text-xs text-slate-400 font-mono">
            {a.courseCode} • {a.courseName}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Category',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {a.type}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (a) => (
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{a.dueDate}</span>
        </div>
      ),
    },
    {
      key: 'submittedCount',
      header: 'Submissions',
      sortable: true,
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-900">
            {a.submittedCount} / {a.totalStudents} ({Math.round((a.submittedCount / a.totalStudents) * 100)}%)
          </span>
          <span className="text-[10px] text-slate-400 block">{a.gradedCount} Graded</span>
        </div>
      ),
    },
    {
      key: 'maxScore',
      header: 'Max Score',
      sortable: true,
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-800">{a.maxScore} Pts</span>
          <span className="text-[10px] text-slate-400 block">{a.weightage}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            a.status === 'Published'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : a.status === 'Grading'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {a.status}
        </span>
      ),
    },
  ];

  const questionColumns: Column<QuestionItem>[] = [
    {
      key: 'question',
      header: 'Question Text',
      sortable: true,
      render: (q) => (
        <div className="max-w-md">
          <span className="font-semibold text-slate-800 text-xs block leading-relaxed">{q.question}</span>
          <span className="text-[10px] font-mono text-slate-400">
            {q.courseCode} • Unit {q.unit}
          </span>
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      sortable: true,
      render: (q) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
            q.difficulty === 'Easy'
              ? 'bg-emerald-50 text-emerald-700'
              : q.difficulty === 'Medium'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {q.difficulty}
        </span>
      ),
    },
    {
      key: 'cognitiveLevel',
      header: "Bloom's Level",
      sortable: true,
      render: (q) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {q.cognitiveLevel}
        </span>
      ),
    },
    {
      key: 'marks',
      header: 'Weightage',
      sortable: true,
      render: (q) => <span className="text-xs font-bold text-slate-900">{q.marks} Marks</span>,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAss: AssessmentItem = {
      id: `ass-${Date.now()}`,
      title: formData.title,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      type: formData.type,
      dueDate: formData.dueDate,
      maxScore: Number(formData.maxScore),
      submittedCount: 0,
      totalStudents: 142,
      gradedCount: 0,
      status: 'Published',
      weightage: formData.weightage,
    };
    setAssessments([newAss, ...assessments]);
    setIsCreateOpen(false);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Assessments, Quizzes & Question Bank"
        subtitle="Manage continuous academic evaluation, online quizzes, and centralized question repository"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Assessments' }]}
        stats={[
          { label: 'Active Items', value: assessments.length, variant: 'primary' },
          { label: 'Question Bank', value: `${questions.length * 12} Items`, variant: 'success' },
          { label: 'Grading Velocity', value: '84%', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Create Assessment',
          onClick: () => {
            setFormData({
              title: '',
              courseCode: 'CS301',
              courseName: 'Operating Systems',
              type: 'Assignment',
              dueDate: '2026-11-12',
              maxScore: 100,
              weightage: '15% of Internal',
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
        secondaryAction={{
          label: activeTab === 'assignments' ? 'Switch to Question Bank' : 'Switch to Assignments',
          onClick: () => setActiveTab(activeTab === 'assignments' ? 'questions' : 'assignments'),
          icon: <HelpCircle className="w-4 h-4" />,
        }}
      />

      {activeTab === 'assignments' ? (
        <DataTable
          data={assessments}
          columns={assessmentColumns}
          keyExtractor={(a) => a.id}
          searchPlaceholder="Search assessments by title or course..."
          exportTitle="assessments_list"
          onRowClick={(a) => {
            setSelectedAssessment(a);
            setIsDetailOpen(true);
          }}
        />
      ) : (
        <DataTable
          data={questions}
          columns={questionColumns}
          keyExtractor={(q) => q.id}
          searchPlaceholder="Search question bank by keyword or course..."
          exportTitle="question_bank"
        />
      )}

      {/* Assessment Detail Drawer */}
      {selectedAssessment && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedAssessment.title}
          subtitle={`${selectedAssessment.courseCode} • Max Score: ${selectedAssessment.maxScore} Pts`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedAssessment.type}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Due Date</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedAssessment.dueDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Internal Weightage</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedAssessment.weightage}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Submission & Grading Status
              </h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Completed Submissions:</span>
                <span className="font-bold">{selectedAssessment.submittedCount} / {selectedAssessment.totalStudents}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${(selectedAssessment.submittedCount / selectedAssessment.totalStudents) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Graded & Verified:</span>
                <span className="font-semibold text-emerald-600">{selectedAssessment.gradedCount} Graded</span>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Create Assessment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create Continuous Assessment</h3>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Assignment 4: Virtual Memory Simulator"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                  <select
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  >
                    <option value="CS301">CS301 (Operating Systems)</option>
                    <option value="CS302">CS302 (Distributed DB)</option>
                    <option value="CS303">CS303 (Machine Learning)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Quiz">Online Quiz</option>
                    <option value="Project">Term Project</option>
                    <option value="Lab Report">Lab Report</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
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
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default AssessmentsPage;
