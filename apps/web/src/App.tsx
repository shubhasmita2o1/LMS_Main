import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SelectTenantPage } from './pages/SelectTenantPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantsPage } from './pages/tenants/TenantsPage';
import { AcademicHierarchyPage } from './pages/academic/AcademicHierarchyPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { FacultyPage } from './pages/faculty/FacultyPage';
import { CurriculumPage } from './pages/courses/CurriculumPage';
<<<<<<< Updated upstream
import { MyCoursesPage } from './pages/learn/MyCoursesPage';
import { CourseLearnPage } from './pages/learn/CourseLearnPage';
import { LessonViewerPage } from './pages/learn/LessonViewerPage';
import { LiveClassesPage } from './pages/learn/LiveClassesPage';
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
=======
import { LmsLearningPage } from './pages/learn/LmsLearningPage';
import { PracticalLabsPage } from './pages/labs/PracticalLabsPage';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { ExaminationsPage } from './pages/examinations/ExaminationsPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <h1 className="text-3xl font-bold text-slate-900 mb-2">University LMS</h1>
        <p className="text-slate-500 mb-8">
          Multi-tenant SaaS platform • Phase 9: Assignments, Quiz & Question Bank
=======
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          University Learning Management &amp; Academic ERP
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Enterprise Multi-Tenant SaaS Platform for Higher Education Institutions.
          Full-cycle academic governance, curriculum design, student information systems, examination management, and compliance analytics.
>>>>>>> Stashed changes
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
                Sign In / 1-Click Demo Personas →
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
      <Route path="/select-tenant" element={<SelectTenantPage />} />

      {/* Module 1: Executive Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Module 2: Multi-Tenant University Management */}
      <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />

      {/* Module 3: Campus & Academic Hierarchy */}
      <Route path="/academic" element={<ProtectedRoute><AcademicHierarchyPage /></ProtectedRoute>} />

      {/* Module 4: Student Information System (SIS) */}
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />

      {/* Module 5: Faculty Management & Workload */}
      <Route path="/faculty" element={<ProtectedRoute><FacultyPage /></ProtectedRoute>} />

      {/* Module 6: Curriculum, Syllabi & OBE CO-PO Mapping */}
      <Route path="/courses" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />
      <Route path="/curriculum" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />

      {/* Module 7: Core LMS Theory & Lesson Viewer */}
      <Route path="/learn" element={<ProtectedRoute><LmsLearningPage /></ProtectedRoute>} />

<<<<<<< Updated upstream
      {/* Phase 9 — Assignments, Quiz & Question Bank */}
      <Route path="/question-bank" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuestionBankPage /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/assignments/:id" element={<ProtectedRoute><AssignmentDetailPage /></ProtectedRoute>} />
      <Route path="/assignments/:id/submissions" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><AssignmentSubmissionsPage /></ProtectedRoute>} />
      <Route path="/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/builder" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuizBuilderPage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/take" element={<ProtectedRoute><QuizTakePage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/attempts" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><QuizAttemptsPage /></ProtectedRoute>} />

      {/* Phase 10 — Gradebook, Results & Attendance */}
      <Route path="/gradebook" element={<ProtectedRoute><GradebooksPage /></ProtectedRoute>} />
      <Route path="/gradebook/transcript" element={<ProtectedRoute><TranscriptPage /></ProtectedRoute>} />
      <Route path="/gradebook/:id" element={<ProtectedRoute><GradebookDetailPage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/attendance/sessions/:id" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'faculty', 'super_admin']}><AttendanceMarkPage /></ProtectedRoute>} />

=======
      {/* Module 8: Practical & Virtual Labs */}
      <Route path="/labs" element={<ProtectedRoute><PracticalLabsPage /></ProtectedRoute>} />

      {/* Module 9: Continuous Assessments & Quizzes */}
      <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />

      {/* Module 10: Examinations, Timetable & Hall Tickets */}
      <Route path="/examinations" element={<ProtectedRoute><ExaminationsPage /></ProtectedRoute>} />

      {/* Module 11: Attendance Register & Biometrics */}
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />

      {/* Module 12: Results, Gradebook & Transcripts */}
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

      {/* Module 13: Admissions & Enrollment Pipeline */}
      <Route path="/admissions" element={<ProtectedRoute><AdmissionsPage /></ProtectedRoute>} />

      {/* Module 14: Finance, Fee Invoicing & Receipts */}
      <Route path="/finance" element={<ProtectedRoute><FinanceFeesPage /></ProtectedRoute>} />

      {/* Module 15: Library Management & Circulation Desk */}
      <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />

      {/* Module 16: Placement & Career Services */}
      <Route path="/placement" element={<ProtectedRoute><PlacementPage /></ProtectedRoute>} />

      {/* Module 17: Communication Hub & Circulars */}
      <Route path="/communication" element={<ProtectedRoute><CommunicationPage /></ProtectedRoute>} />

      {/* Module 18: Accreditation (NAAC) & SSR Analytics */}
      <Route path="/reports" element={<ProtectedRoute><ReportsAnalyticsPage /></ProtectedRoute>} />

      {/* Module 19: Documents & QR-Verified Certificates */}
      <Route path="/documents" element={<ProtectedRoute><DocumentsCertificatesPage /></ProtectedRoute>} />

      {/* Module 20: User Management & Security Directory */}
      <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />

      {/* Module 21: Roles & RBAC Matrix */}
      <Route path="/roles" element={<ProtectedRoute><RolePermissionsPage /></ProtectedRoute>} />

      {/* Module 22: Notifications Center */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* Module 23: System Settings & Identity */}
      <Route path="/settings" element={<ProtectedRoute><SystemSettingsPage /></ProtectedRoute>} />

      {/* Module 24: Audit Trail & Compliance */}
      <Route path="/audit" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />

      {/* Module 25: Campus Helpdesk & Support */}
      <Route path="/support" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />

      {/* Fallback */}
>>>>>>> Stashed changes
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
