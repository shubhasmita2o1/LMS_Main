import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SelectTenantPage } from './pages/SelectTenantPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantsPage } from './pages/tenants/TenantsPage';
import { AcademicHierarchyPage } from './pages/academic/AcademicHierarchyPage';
import { StudentsListPage } from './pages/students/StudentsListPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { StudentFormPage } from './pages/students/StudentFormPage';
import { StudentMePage } from './pages/students/StudentMePage';
import { FacultyListPage } from './pages/faculty/FacultyListPage';
import { FacultyDetailPage } from './pages/faculty/FacultyDetailPage';
import { FacultyFormPage } from './pages/faculty/FacultyFormPage';
import { FacultyMePage } from './pages/faculty/FacultyMePage';
import { CoursesListPage } from './pages/courses/CoursesListPage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { CourseFormPage } from './pages/courses/CourseFormPage';
import { ProfilePage } from './pages/profile/ProfilePage';
// Phase 8–10 functional pages
import { MyCoursesPage } from './pages/learn/MyCoursesPage';
import { CourseLearnPage } from './pages/learn/CourseLearnPage';
import { LessonViewerPage } from './pages/learn/LessonViewerPage';
import { LiveClassesPage } from './pages/learn/LiveClassesPage';
import { LmsLearningPage } from './pages/learn/LmsLearningPage';
import { QuestionBankPage } from './pages/question-bank/QuestionBankPage';
import { AssignmentsPage } from './pages/assignments/AssignmentsPage';
import { AssignmentDetailPage } from './pages/assignments/AssignmentDetailPage';
import { AssignmentSubmissionsPage } from './pages/assignments/AssignmentSubmissionsPage';
import { QuizzesPage } from './pages/quizzes/QuizzesPage';
import { QuizBuilderPage } from './pages/quizzes/QuizBuilderPage';
import { QuizTakePage } from './pages/quizzes/QuizTakePage';
import { QuizAttemptsPage } from './pages/quizzes/QuizAttemptsPage';
import { GradebooksPage } from './pages/gradebook/GradebooksPage';
import { GradebookDetailPage } from './pages/gradebook/GradebookDetailPage';
import { TranscriptPage } from './pages/gradebook/TranscriptPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { AttendanceMarkPage } from './pages/attendance/AttendanceMarkPage';
// Extended module shell pages
import { PracticalLabsPage } from './pages/labs/PracticalLabsPage';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { ExaminationsPage } from './pages/examinations/ExaminationsPage';
import { ResultsPage } from './pages/results/ResultsPage';
import { AdmissionsPage } from './pages/admissions/AdmissionsPage';
import { FinanceFeesPage } from './pages/finance/FinanceFeesPage';
import { LibraryPage } from './pages/library/LibraryPage';
import { PlacementPage } from './pages/placement/PlacementPage';
import { CommunicationPage } from './pages/communication/CommunicationPage';
import { ReportsAnalyticsPage } from './pages/reports/ReportsAnalyticsPage';
import { DocumentsCertificatesPage } from './pages/documents/DocumentsCertificatesPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { RolePermissionsPage } from './pages/roles/RolePermissionsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SystemSettingsPage } from './pages/settings/SystemSettingsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { HelpSupportPage } from './pages/support/HelpSupportPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-6 shadow-md shadow-primary-500/20">
          UL
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          University Learning Management &amp; Academic ERP
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Enterprise Multi-Tenant SaaS Platform for Higher Education Institutions.
          Full-cycle academic governance, curriculum design, student information systems, examination management, and compliance analytics.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {isAuthenticated() ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition shadow-sm"
            >
              Go to Academic ERP Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition shadow-sm"
              >
                Sign In →
              </Link>
              <Link
                to="/select-tenant"
                className="inline-flex items-center px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Select University Tenant
              </Link>
            </>
          )}
        </div>

        <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider block">Tenancy</span>
            <span className="text-xs text-slate-700 font-medium">Multi-University Isolation</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider block">Personas</span>
            <span className="text-xs text-slate-700 font-medium">9 Distinct Roles</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider block">Modules</span>
            <span className="text-xs text-slate-700 font-medium">25 Integrated Suites</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider block">Accreditation</span>
            <span className="text-xs text-slate-700 font-medium">NAAC / NBA / ABET Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public & Authentication Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/select-tenant" element={<SelectTenantPage />} />

      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Module 1: Executive Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Module 2: Multi-Tenant University Management */}
      <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />

      {/* Module 3: Campus & Academic Hierarchy */}
      <Route path="/academic" element={<ProtectedRoute><AcademicHierarchyPage /></ProtectedRoute>} />

      {/* Module 4: Student Information System (SIS) */}
      <Route path="/students" element={<ProtectedRoute><StudentsListPage /></ProtectedRoute>} />
      <Route path="/students/me" element={<ProtectedRoute><StudentMePage /></ProtectedRoute>} />
      <Route path="/students/new" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><StudentFormPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="/students/:id/edit" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><StudentFormPage /></ProtectedRoute>} />

      {/* Module 5: Faculty Management & Workload */}
      <Route path="/faculty" element={<ProtectedRoute><FacultyListPage /></ProtectedRoute>} />
      <Route path="/faculty/me" element={<ProtectedRoute><FacultyMePage /></ProtectedRoute>} />
      <Route path="/faculty/new" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><FacultyFormPage /></ProtectedRoute>} />
      <Route path="/faculty/:id" element={<ProtectedRoute><FacultyDetailPage /></ProtectedRoute>} />
      <Route path="/faculty/:id/edit" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><FacultyFormPage /></ProtectedRoute>} />

      {/* Module 6: Curriculum, Syllabi & OBE CO-PO Mapping */}
      <Route path="/courses" element={<ProtectedRoute><CoursesListPage /></ProtectedRoute>} />
      <Route path="/curriculum" element={<ProtectedRoute><CoursesListPage /></ProtectedRoute>} />
      <Route path="/courses/new" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><CourseFormPage /></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
      <Route path="/courses/:id/edit" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><CourseFormPage /></ProtectedRoute>} />

      {/* Module 7: Core LMS Theory & Lesson Viewer */}
      <Route path="/learn" element={<ProtectedRoute><LmsLearningPage /></ProtectedRoute>} />
      <Route path="/learn/courses/:id" element={<ProtectedRoute><CourseLearnPage /></ProtectedRoute>} />
      <Route path="/learn/courses/:id/lessons/:lessonId" element={<ProtectedRoute><LessonViewerPage /></ProtectedRoute>} />
      <Route path="/learn/courses/:id/live" element={<ProtectedRoute><LiveClassesPage /></ProtectedRoute>} />
      <Route path="/learn/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />

      {/* Module 8: Practical & Virtual Labs */}
      <Route path="/labs" element={<ProtectedRoute><PracticalLabsPage /></ProtectedRoute>} />

      {/* Phase 9 — Assignments, Quiz & Question Bank */}
      <Route path="/question-bank" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuestionBankPage /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/assignments/:id" element={<ProtectedRoute><AssignmentDetailPage /></ProtectedRoute>} />
      <Route path="/assignments/:id/submissions" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><AssignmentSubmissionsPage /></ProtectedRoute>} />
      <Route path="/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/builder" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuizBuilderPage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/take" element={<ProtectedRoute><QuizTakePage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/attempts" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuizAttemptsPage /></ProtectedRoute>} />
      <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />

      {/* Module 10: Examinations */}
      <Route path="/examinations" element={<ProtectedRoute><ExaminationsPage /></ProtectedRoute>} />

      {/* Phase 10 — Gradebook, Results & Attendance */}
      <Route path="/gradebook" element={<ProtectedRoute><GradebooksPage /></ProtectedRoute>} />
      <Route path="/gradebook/transcript" element={<ProtectedRoute><TranscriptPage /></ProtectedRoute>} />
      <Route path="/gradebook/:id" element={<ProtectedRoute><GradebookDetailPage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/attendance/sessions/:id" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><AttendanceMarkPage /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

      {/* Extended modules */}
      <Route path="/admissions" element={<ProtectedRoute><AdmissionsPage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><FinanceFeesPage /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
      <Route path="/placement" element={<ProtectedRoute><PlacementPage /></ProtectedRoute>} />
      <Route path="/communication" element={<ProtectedRoute><CommunicationPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsAnalyticsPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsCertificatesPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><RolePermissionsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SystemSettingsPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
