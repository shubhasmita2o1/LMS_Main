import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Building,
  FileCheck,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Student' | 'Faculty' | 'Course' | 'Action';
  subtitle: string;
  url: string;
  icon: any;
}

const SEARCH_DATABASE: SearchItem[] = [
  { id: '1', title: 'Executive Academic Dashboard', category: 'Navigation', subtitle: 'Overview, KPIs, and metrics', url: '/dashboard', icon: LayoutDashboard },
  { id: '2', title: 'Student Information System (SIS)', category: 'Navigation', subtitle: 'Student directory and records', url: '/students', icon: Users },
  { id: '3', title: 'Faculty & Professor Directory', category: 'Navigation', subtitle: 'Faculty load and publications', url: '/faculty', icon: GraduationCap },
  { id: '4', title: 'Curriculum & Courses', category: 'Navigation', subtitle: 'Syllabi and OBE outcome mapping', url: '/courses', icon: BookOpen },
  { id: '5', title: 'Core LMS / Theory Learning', category: 'Navigation', subtitle: 'Course player and video lessons', url: '/learn', icon: Layers },
  { id: '6', title: 'Practical & Virtual Labs', category: 'Navigation', subtitle: 'Workstations and experiment grading', url: '/labs', icon: Layers },
  { id: '7', title: 'Assessments & Question Bank', category: 'Navigation', subtitle: 'Assignments, quizzes, and rubrics', url: '/assessments', icon: FileCheck },
  { id: '8', title: 'Examinations & Hall Tickets', category: 'Navigation', subtitle: 'Exam schedules and seating plan', url: '/examinations', icon: Calendar },
  { id: '9', title: 'Attendance Management', category: 'Navigation', subtitle: 'Biometric logs and registers', url: '/attendance', icon: Calendar },
  { id: '10', title: 'Results & Gradebook', category: 'Navigation', subtitle: 'GPA, CGPA, and transcripts', url: '/results', icon: FileCheck },
  { id: '11', title: 'Admissions & Counseling', category: 'Navigation', subtitle: 'Application funnel and merit lists', url: '/admissions', icon: Users },
  { id: '12', title: 'Finance & Fee Collection', category: 'Navigation', subtitle: 'Student fee invoices and ledgers', url: '/finance', icon: CreditCard },
  { id: '13', title: 'Library Management', category: 'Navigation', subtitle: 'Circulation desk and catalog', url: '/library', icon: BookOpen },
  { id: '14', title: 'Placement & Career Drives', category: 'Navigation', subtitle: 'Visiting companies and job offers', url: '/placement', icon: Building },
  { id: '15', title: 'Reports & Accreditation (NAAC/NBA)', category: 'Navigation', subtitle: 'Criterion 1-7 analytics reports', url: '/reports', icon: Shield },
  { id: '16', title: 'Documents & Certificates', category: 'Navigation', subtitle: 'Degree and bonafide generators', url: '/documents', icon: FileCheck },
  { id: '17', title: 'Audit Trail & Compliance', category: 'Navigation', subtitle: 'Security logs and actor actions', url: '/audit', icon: Shield },
  { id: '18', title: 'Jordan Hayes (2023CSE0101)', category: 'Student', subtitle: 'B.Tech CSE Sem 5 • CGPA 3.88', url: '/students', icon: Users },
  { id: '19', title: 'Aarav Patel (2023CSE0102)', category: 'Student', subtitle: 'B.Tech CSE Sem 5 • CGPA 3.94', url: '/students', icon: Users },
  { id: '20', title: 'Prof. Elena Rostova', category: 'Faculty', subtitle: 'Professor • Operating Systems', url: '/faculty', icon: GraduationCap },
  { id: '21', title: 'Prof. Vikram Malhotra', category: 'Faculty', subtitle: 'HOD • Computer Science & Engg', url: '/faculty', icon: GraduationCap },
  { id: '22', title: 'CS301: Operating Systems & Kernel', category: 'Course', subtitle: 'Core • 4.0 Credits • 142 Students', url: '/courses', icon: BookOpen },
  { id: '23', title: 'CS302: Distributed Databases', category: 'Course', subtitle: 'Core • 4.0 Credits • 138 Students', url: '/courses', icon: BookOpen },
];

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle modal handled by parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const results = SEARCH_DATABASE.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-primary-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, student name, course, or module..."
            className="flex-1 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching records or modules found for "{query}"
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.url)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition ${
                    idx === selectedIndex ? 'bg-primary-50/80 text-primary-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono">
                ↵
              </kbd>{' '}
              select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono">
                esc
              </kbd>{' '}
              close
            </span>
          </div>
          <span className="flex items-center gap-1 font-medium text-primary-600">
            <Sparkles className="w-3 h-3" />
            Global ERP Search
          </span>
        </div>
      </div>
    </div>
  );
}
export default GlobalSearchModal;
