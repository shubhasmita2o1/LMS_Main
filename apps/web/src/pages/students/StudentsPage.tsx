import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MOCK_STUDENTS, type Student } from '../../data/mockData';
import {
  Phone,
  MapPin,
  Plus,
  Printer,
  X,
  Award,
} from 'lucide-react';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [filterAttendanceAlert, setFilterAttendanceAlert] = useState(false);
  const [filterFeeDue, setFilterFeeDue] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2024-2028',
    semester: 3,
    section: 'CSE-A',
    cgpa: 3.8,
    attendancePercentage: 90.0,
    parentName: '',
    parentPhone: '',
    address: '',
  });

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Profile',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <img
            src={s.avatar}
            alt={s.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{s.name}</div>
            <div className="text-[11px] font-mono text-primary-700">{s.rollNo}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Program & Cohort',
      sortable: true,
      render: (s) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{s.program}</span>
          <span className="text-xs text-slate-400 block">
            Sem {s.semester} • Sec {s.section} ({s.batch})
          </span>
        </div>
      ),
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-1 font-bold text-slate-900">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>{s.cgpa.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              s.attendancePercentage >= 75
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold animate-pulse'
            }`}
          >
            {s.attendancePercentage.toFixed(1)}%
          </span>
          {s.attendancePercentage < 75 && (
            <span className="text-[10px] text-rose-600 font-semibold hidden md:inline">Shortage</span>
          )}
        </div>
      ),
    },
    {
      key: 'feeStatus',
      header: 'Fee Status',
      sortable: true,
      render: (s) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            s.feeStatus === 'Paid'
              ? 'bg-emerald-50 text-emerald-700'
              : s.feeStatus === 'Partial'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700 font-bold'
          }`}
        >
          {s.feeStatus}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
            s.status === 'active'
              ? 'bg-slate-100 text-slate-700'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {s.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollNo: formData.rollNo || `2024CSE0${Math.floor(Math.random() * 900 + 100)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      program: formData.program,
      department: formData.department,
      batch: formData.batch,
      semester: Number(formData.semester),
      section: formData.section,
      cgpa: Number(formData.cgpa),
      attendancePercentage: Number(formData.attendancePercentage),
      feeStatus: 'Paid',
      status: 'active',
      admissionYear: 2024,
      dob: '2005-05-15',
      gender: 'Other',
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      address: formData.address,
    };
    setStudents([newStudent, ...students]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      setStudents(students.filter((s) => s.id !== studentToDelete.id));
      setIsDeleteOpen(false);
      setStudentToDelete(null);
      setIsDetailOpen(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (filterAttendanceAlert && s.attendancePercentage >= 75) return false;
    if (filterFeeDue && s.feeStatus === 'Paid') return false;
    return true;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Student Information System (SIS)"
        subtitle="Manage student admissions, personal bio, academic records, and fee reconciliation"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Students' }]}
        stats={[
          { label: 'Total Enrolled', value: students.length, variant: 'primary' },
          { label: 'Avg CGPA', value: '3.76', variant: 'default' },
          { label: 'Attendance Alert (<75%)', value: 1, variant: 'danger' },
          { label: 'Fees Paid', value: '88%', variant: 'success' },
        ]}
        primaryAction={{
          label: 'Enroll New Student',
          onClick: () => {
            setFormData({
              name: '',
              rollNo: '',
              email: '',
              phone: '',
              program: 'B.Tech in Computer Science',
              department: 'Computer Science & Engineering',
              batch: '2024-2028',
              semester: 3,
              section: 'CSE-A',
              cgpa: 3.8,
              attendancePercentage: 92.0,
              parentName: '',
              parentPhone: '',
              address: '',
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={filteredStudents}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search students by name, roll no, or program..."
        exportTitle="students_roster"
        onRowClick={handleRowClick}
        filterComponent={
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Quick Filters:</span>
            <button
              type="button"
              onClick={() => setFilterAttendanceAlert(!filterAttendanceAlert)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterAttendanceAlert
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Shortage Alert (&lt;75% Attendance)
            </button>
            <button
              type="button"
              onClick={() => setFilterFeeDue(!filterFeeDue)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterFeeDue
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fee Due / Partial
            </button>
          </div>
        }
      />

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedStudent.name}
          subtitle={`Roll No: ${selectedStudent.rollNo} • ${selectedStudent.program}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedStudent.batch}
            </span>
          }
          onDelete={() => {
            setStudentToDelete(selectedStudent);
            setIsDeleteOpen(true);
          }}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedStudent.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedStudent.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Cumulative GPA</span>
                <span className="text-lg font-bold text-slate-900">{selectedStudent.cgpa} / 4.0</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Attendance Rate</span>
                <span className="text-lg font-bold text-slate-900">{selectedStudent.attendancePercentage}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block">Tuition Status</span>
                <span className="text-lg font-bold text-emerald-600">{selectedStudent.feeStatus}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emergency & Parent Contact
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Parent / Guardian:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guardian Phone:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.parentPhone}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Grade Sheet / Transcript</span>
            </button>
          </div>
        </DetailDrawer>
      )}

      {/* Enroll Student Modal Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Enroll New Student</h3>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Liam Vance"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Roll No</label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@northridge.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (617) 555-0199"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="B.Tech in Computer Science">B.Tech CSE</option>
                    <option value="B.Tech in Artificial Intelligence">B.Tech AIML</option>
                    <option value="M.Tech in Advanced Computing">M.Tech CS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="CSE-A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parent Contact Phone</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="+1 (617) 555-0100"
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
                  Enroll Student
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
        title="Archive Student Profile?"
        description="The student record will be archived. Academic records and completed semester credits will remain permanently stored."
        itemName={studentToDelete ? `${studentToDelete.name} (${studentToDelete.rollNo})` : ''}
        confirmLabel="Confirm Archive"
      />
    </AppLayout>
  );
}
export default StudentsPage;
