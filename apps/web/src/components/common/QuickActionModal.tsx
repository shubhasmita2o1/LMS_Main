import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  X,
  UserPlus,
  BookPlus,
  CalendarCheck,
  Award,
  Sparkles,
  BookOpen,
  FileCheck,
  Building,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  if (!isOpen) return null;

  const roles = user?.roles || [];
  const isSuperAdmin = roles.includes('super_admin');
  const isTenantAdmin = roles.includes('tenant_admin') || roles.includes('university_admin');
  const isFaculty = roles.includes('faculty') || roles.includes('department_head');

  let quickActions: Array<{
    title: string;
    desc: string;
    icon: any;
    url: string;
    color: string;
  }> = [];

  if (isSuperAdmin) {
    quickActions = [
      {
        title: 'Manage Universities / Tenants',
        desc: 'Review, provision, and configure university tenants',
        icon: Building,
        url: '/tenants',
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        title: 'User Approvals & Directory',
        desc: 'Review and approve pending institutional users',
        icon: UserPlus,
        url: '/users',
        color: 'bg-blue-50 text-blue-600',
      },
      {
        title: 'RBAC & Permission Matrix',
        desc: 'Inspect granular role capabilities and policies',
        icon: ShieldCheck,
        url: '/roles',
        color: 'bg-purple-50 text-purple-600',
      },
      {
        title: 'Platform System Settings',
        desc: 'Configure security, tokens, and multi-tenant defaults',
        icon: Settings,
        url: '/settings',
        color: 'bg-slate-100 text-slate-700',
      },
    ];
  } else if (isTenantAdmin) {
    quickActions = [
      {
        title: 'Enroll New Student (SIS)',
        desc: 'Register student profile, allocate roll number and batch',
        icon: UserPlus,
        url: '/students',
        color: 'bg-blue-50 text-blue-600',
      },
      {
        title: 'Create Course / Syllabus',
        desc: 'Add course code, curriculum, credit units, and outcomes',
        icon: BookPlus,
        url: '/courses',
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        title: 'Record Attendance Session',
        desc: 'Launch period attendance register or biometric review',
        icon: CalendarCheck,
        url: '/attendance',
        color: 'bg-amber-50 text-amber-600',
      },
      {
        title: 'Gradebook & Results',
        desc: 'Compute semester grades and publish results',
        icon: Award,
        url: '/gradebook',
        color: 'bg-indigo-50 text-indigo-600',
      },
      {
        title: 'Question Bank Repository',
        desc: 'Manage objective and descriptive question items',
        icon: BookOpen,
        url: '/question-bank',
        color: 'bg-purple-50 text-purple-600',
      },
      {
        title: 'Pending User Approvals',
        desc: 'Activate pending campus accounts for students and faculty',
        icon: UserPlus,
        url: '/users',
        color: 'bg-rose-50 text-rose-600',
      },
    ];
  } else if (isFaculty) {
    quickActions = [
      {
        title: 'Create Assignment',
        desc: 'Post new course assignment, due dates, and grading rubric',
        icon: FileCheck,
        url: '/assignments',
        color: 'bg-blue-50 text-blue-600',
      },
      {
        title: 'Build Quiz / Assessment',
        desc: 'Draft online quiz with multiple question types',
        icon: Award,
        url: '/quizzes',
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        title: 'Mark Attendance',
        desc: 'Record lecture or lab attendance for your enrolled batch',
        icon: CalendarCheck,
        url: '/attendance',
        color: 'bg-amber-50 text-amber-600',
      },
      {
        title: 'Question Bank',
        desc: 'Add or browse questions for quizzes and examinations',
        icon: BookOpen,
        url: '/question-bank',
        color: 'bg-purple-50 text-purple-600',
      },
      {
        title: 'My Teaching Courses',
        desc: 'Access your assigned course syllabi and lecture content',
        icon: BookPlus,
        url: '/courses',
        color: 'bg-indigo-50 text-indigo-600',
      },
    ];
  } else {
    // Student
    quickActions = [
      {
        title: 'My Enrolled Courses',
        desc: 'Continue learning from where you left off',
        icon: BookOpen,
        url: '/learn/my-courses',
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        title: 'Assignments & Submissions',
        desc: 'Check pending homework and submit your answers',
        icon: FileCheck,
        url: '/assignments',
        color: 'bg-blue-50 text-blue-600',
      },
      {
        title: 'Quizzes & Tests',
        desc: 'Attempt active tests and view results',
        icon: Award,
        url: '/quizzes',
        color: 'bg-purple-50 text-purple-600',
      },
      {
        title: 'Attendance Records',
        desc: 'Check your overall percentage and attendance summary',
        icon: CalendarCheck,
        url: '/attendance',
        color: 'bg-amber-50 text-amber-600',
      },
      {
        title: 'Official Academic Transcript',
        desc: 'View completed credits, grade points, and semester GPA',
        icon: Award,
        url: '/gradebook/transcript',
        color: 'bg-indigo-50 text-indigo-600',
      },
    ];
  }

  const handleAction = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ERP Quick Actions</h3>
              <p className="text-xs text-slate-500">Fast workflow shortcuts across academic modules</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-5 grid sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                type="button"
                onClick={() => handleAction(act.url)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 text-left transition flex items-start gap-3 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {act.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
export default QuickActionModal;
