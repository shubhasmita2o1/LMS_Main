import { useNavigate } from 'react-router-dom';
import {
  X,
  UserPlus,
  BookPlus,
  Megaphone,
  CalendarCheck,
  Award,
  CreditCard,
  LifeBuoy,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'Enroll New Student',
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
      title: 'Post Official Announcement',
      desc: 'Broadcast circular to students, faculty, or all campus',
      icon: Megaphone,
      url: '/communication',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Record Class Attendance',
      desc: 'Launch period attendance register or biometric review',
      icon: CalendarCheck,
      url: '/attendance',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Schedule Examination & Hall',
      desc: 'Plan mid-term/end-term slots and seating allocation',
      icon: GraduationCap,
      url: '/examinations',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Generate Fee Invoice',
      desc: 'Issue semester tuition, hostel, or exam fee demand',
      icon: CreditCard,
      url: '/finance',
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      title: 'Issue Certificate / Bonafide',
      desc: 'Generate verified student document with secure QR code',
      icon: Award,
      url: '/documents',
      color: 'bg-pink-50 text-pink-600',
    },
    {
      title: 'Submit Support Ticket',
      desc: 'Report IT, academic or infrastructure issue to helpdesk',
      icon: LifeBuoy,
      url: '/support',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

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
