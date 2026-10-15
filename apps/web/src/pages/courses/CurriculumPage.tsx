import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MOCK_COURSES, type Course } from '../../data/mockData';
import {
  Layers,
  GraduationCap,
  Plus,
  X,
  FileCheck,
} from 'lucide-react';

export function CurriculumPage() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    department: 'Computer Science & Engineering',
    credits: 4.0,
    type: 'Core' as Course['type'],
    semester: 5,
    instructorName: 'Prof. Elena Rostova',
    description: '',
  });

  const columns: Column<Course>[] = [
    {
      key: 'code',
      header: 'Course Code & Title',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
              {c.code}
            </span>
            <span className="truncate">{c.title}</span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">{c.department}</span>
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Credits',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-bold text-slate-800">{c.credits} Credits</span>
      ),
    },
    {
      key: 'type',
      header: 'Classification',
      sortable: true,
      render: (c) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            c.type === 'Core'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : c.type === 'Lab'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {c.type}
        </span>
      ),
    },
    {
      key: 'instructorName',
      header: 'Course Director',
      sortable: true,
      render: (c) => (
        <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span>{c.instructorName}</span>
        </div>
      ),
    },
    {
      key: 'enrolledStudents',
      header: 'Enrolled',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-bold text-slate-800">{c.enrolledStudents} Students</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c) => (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          {c.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (course: Course) => {
    setSelectedCourse(course);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      code: formData.code.toUpperCase(),
      title: formData.title,
      department: formData.department,
      credits: Number(formData.credits),
      type: formData.type,
      semester: Number(formData.semester),
      instructorName: formData.instructorName,
      enrolledStudents: 120,
      status: 'active',
      description: formData.description,
      syllabusUnits: [
        { unit: 1, title: 'Foundations & Concepts', hours: 10, topics: ['Introduction', 'Core Architecture'] },
        { unit: 2, title: 'Advanced Methodologies', hours: 12, topics: ['Algorithms', 'Design Optimization'] },
      ],
      outcomes: [
        'CO1: Demonstrate fundamental mastery of topic principles.',
        'CO2: Evaluate complex tradeoffs in real-world scenarios.',
      ],
    };
    setCourses([newCourse, ...courses]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      setIsDeleteOpen(false);
      setCourseToDelete(null);
      setIsDetailOpen(false);
    }
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Curriculum & Course Management"
        subtitle="Manage syllabi, Outcome-Based Education (OBE) course outcomes, and credit structures"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Curriculum' }]}
        stats={[
          { label: 'Active Courses', value: courses.length, variant: 'primary' },
          { label: 'NBA/OBE Mapped', value: '100%', variant: 'success' },
          { label: 'Credit Hours', value: '14.0 Avg', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Create Course',
          onClick: () => {
            setFormData({
              code: '',
              title: '',
              department: 'Computer Science & Engineering',
              credits: 4.0,
              type: 'Core',
              semester: 5,
              instructorName: 'Prof. Elena Rostova',
              description: '',
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={courses}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search courses by code, title, or instructor..."
        exportTitle="course_catalog"
        onRowClick={handleRowClick}
      />

      {/* Course Detail Drawer */}
      {selectedCourse && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`${selectedCourse.code}: ${selectedCourse.title}`}
          subtitle={`${selectedCourse.credits} Credits • ${selectedCourse.department}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedCourse.type}
            </span>
          }
          onDelete={() => {
            setCourseToDelete(selectedCourse);
            setIsDeleteOpen(true);
          }}
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Course Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            {/* Outcome-Based Education (OBE) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>OBE Course Outcomes (CO)</span>
              </h4>
              <div className="space-y-1.5">
                {selectedCourse.outcomes.map((co, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 font-medium">
                    {co}
                  </div>
                ))}
              </div>
            </div>

            {/* Unit Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary-600" />
                <span>Modular Syllabus Breakdown</span>
              </h4>
              <div className="space-y-2">
                {selectedCourse.syllabusUnits.map((u) => (
                  <div key={u.unit} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span>Unit {u.unit}: {u.title}</span>
                      <span className="text-primary-700">{u.hours} Lecture Hours</span>
                    </div>
                    <p className="text-slate-500">
                      Topics: {u.topics.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Create Course Modal Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create Academic Course</h3>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="CS305"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Units</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Compiler Design & Optimization"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Lab">Lab</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Syllabus Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline topics, prerequisites, and learning objectives..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  Publish Course
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
        title="Archive Course Curriculum?"
        description="This course will be archived. Enrolled student marks and grade transcript records will remain intact."
        itemName={courseToDelete ? `${courseToDelete.code}: ${courseToDelete.title}` : ''}
        confirmLabel="Confirm Archive"
      />
    </AppLayout>
  );
}
export default CurriculumPage;
