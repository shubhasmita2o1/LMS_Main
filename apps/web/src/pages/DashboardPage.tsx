import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore, DEMO_PERSONAS } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import {
  ArrowUpRight,
  Plus,
  Clock,
  Play,
  Pause,
  Square,
  Building,
  Download,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Weekly Activity Analytics (Donezo styled Sunday to Saturday bars)
const WEEKLY_ANALYTICS = [
  { day: 'S', value: 38, active: false, fill: '#d1fae5' },
  { day: 'M', value: 72, active: true, fill: '#22c55e' },
  { day: 'T', value: 65, active: true, fill: '#4ade80' },
  { day: 'W', value: 88, active: true, fill: '#165239' }, // Peak Wednesday
  { day: 'T', value: 54, active: false, fill: '#bbf7d0' },
  { day: 'F', value: 45, active: false, fill: '#d1fae5' },
  { day: 'S', value: 30, active: false, fill: '#e2e8f0' },
];

// Strategic Institutional Priorities (Donezo Project list)
const INSTITUTIONAL_PRIORITIES = [
  {
    id: '1',
    name: 'NAAC SSR Cycle 4 Documentation',
    dueDate: 'Nov 26, 2026',
    iconColor: 'bg-indigo-500',
    category: 'Accreditation',
  },
  {
    id: '2',
    name: 'New Faculty LMS Onboarding Flow',
    dueDate: 'Nov 28, 2026',
    iconColor: 'bg-teal-500',
    category: 'Academic',
  },
  {
    id: '3',
    name: 'Fall Mid-Term Exam Seating Matrix',
    dueDate: 'Nov 30, 2026',
    iconColor: 'bg-emerald-600',
    category: 'Examination',
  },
  {
    id: '4',
    name: 'Lab Infrastructure & Cloud Migration',
    dueDate: 'Dec 05, 2026',
    iconColor: 'bg-amber-500',
    category: 'Infrastructure',
  },
  {
    id: '5',
    name: 'Curriculum 2027 Committee Review',
    dueDate: 'Dec 12, 2026',
    iconColor: 'bg-purple-500',
    category: 'Curriculum',
  },
];

// Department Leadership (Donezo Team Collaboration)
const LEADERSHIP_MEMBERS = [
  {
    id: '1',
    name: 'Dr. Elena Rostova',
    role: 'HOD, Computer Science & AI',
    task: 'Curriculum & Lab Matrix Locked',
    status: 'Completed',
    statusVariant: 'success',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Prof. Vikram Malhotra',
    role: 'Dean, Academic Affairs',
    task: 'Faculty Continuous Appraisal Review',
    status: 'In Progress',
    statusVariant: 'warning',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Dr. Sarah Jenkins',
    role: 'Controller of Examinations',
    task: 'Mid-Semester Hall Ticket Issuance',
    status: 'Pending',
    statusVariant: 'danger',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Jonathan Sterling',
    role: 'Chief Finance Officer',
    task: 'Term 2 Fee Reconciliation ($12.4M)',
    status: 'In Progress',
    statusVariant: 'warning',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentTenant, currentCampus, academicYear, currentTerm } = useTenantStore();

  const currentRole = user?.roles[0] || 'super_admin';
  const persona = DEMO_PERSONAS.find((p) => p.role === currentRole) || DEMO_PERSONAS[0];

  // Dynamic Live Time Clock Widget (Donezo Time Tracker)
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString('en-GB'));
  const [isClockRunning, setIsClockRunning] = useState(true);

  useEffect(() => {
    if (!isClockRunning) return;
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockRunning]);

  return (
    <AppLayout>
      <div className="space-y-7 pb-10">
        {/* ========================================================= */}
        {/* TOP DASHBOARD HEADER (Airy, spacious, Donezo layout)     */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e1f0e9] text-[#165239] border border-[#c2decf]">
                <Building className="w-3.5 h-3.5" />
                {currentTenant.name} ({currentTenant.code})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentCampus.name} • {academicYear} ({currentTerm})
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 text-sm font-normal mt-0.5">
              Welcome back, {persona.name}. Plan, prioritize, and manage institutional operations with ease.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-5 py-2.5 rounded-full bg-[#165239] hover:bg-[#11402c] text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Program</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Import Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4 EXECUTIVE KPI STAT CARDS (Donezo Hero + 3 White Cards)  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: HERO DARK FOREST GREEN CARD */}
          <div className="rounded-[26px] p-6 bg-gradient-to-br from-[#185a3e] via-[#165239] to-[#0f3d29] text-white shadow-sm flex flex-col justify-between min-h-[175px] relative overflow-hidden group">
            {/* Subtle organic light accent */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none blur-xl" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-100/90 tracking-wide">
                Total Enrolled
              </span>
              <button
                type="button"
                onClick={() => navigate('/students')}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="View Students"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold tracking-tight">
                {currentTenant.studentsCount.toLocaleString()}
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-medium backdrop-blur-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+5.4% Increased from last term</span>
              </span>
            </div>
          </div>

          {/* Card 2: Faculty Members (Clean White Card) */}
          <div className="rounded-[26px] p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[175px] hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 tracking-wide">
                Teaching Faculty
              </span>
              <button
                type="button"
                onClick={() => navigate('/faculty')}
                className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition"
                title="View Faculty"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentTenant.facultyCount}
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <span>Ratio 1:17.6 (Optimal)</span>
              </span>
            </div>
          </div>

          {/* Card 3: Active Courses (Clean White Card) */}
          <div className="rounded-[26px] p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[175px] hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 tracking-wide">
                Running Courses
              </span>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition"
                title="View Courses"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                312
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <span>{currentTenant.programsCount} Degree Programs</span>
              </span>
            </div>
          </div>

          {/* Card 4: Fee Realization (Clean White Card) */}
          <div className="rounded-[26px] p-6 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[175px] hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 tracking-wide">
                Fee Collection
              </span>
              <button
                type="button"
                onClick={() => navigate('/finance')}
                className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition"
                title="View Finance"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                92.6%
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#165239] text-xs font-medium">
                <span>$12.4M Reconciled</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MIDDLE SECTION: 3 CARDS (Analytics, Reminders, Project)  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card A: Project / Weekly Activity Analytics (Donezo Style) */}
          <div className="lg:col-span-5 bg-white rounded-[26px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Campus Activity Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Daily active learners & laboratory attendance
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                This Week
              </span>
            </div>

            {/* Recharts vertical styled pill bars */}
            <div className="h-52 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_ANALYTICS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}% Capacity`, 'Activity']}
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                    {WEEKLY_ANALYTICS.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#165239]" />
                <span className="font-medium text-slate-700">Peak (Wed): 88%</span>
              </div>
              <span className="font-semibold text-[#165239]">
                Avg: 56.5% Attendance
              </span>
            </div>
          </div>

          {/* Card B: Reminders & Meetings (Donezo Style) */}
          <div className="lg:col-span-3 bg-white rounded-[26px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Reminders
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                Academic Senate & NAAC Audit Session
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time : 02.00 pm - 04.00 pm</span>
              </p>
              <div className="mt-3.5 p-3 rounded-2xl bg-[#f0f7f4] border border-[#c2decf]/60">
                <p className="text-[11px] font-semibold text-[#165239]">
                  Agenda: Fall Semester Grading Moderation & Syllabus Revision 2027
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Location: Board Room A • 14 Deans & HODs
                </p>
              </div>
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={() => navigate('/communication')}
                className="w-full py-3 px-4 rounded-2xl bg-[#165239] hover:bg-[#11402c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Start Meeting</span>
              </button>
            </div>
          </div>

          {/* Card C: Campus Session Clock (Moved ABOVE for immediate visibility) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#12422e] via-[#0d3624] to-[#082217] text-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* Soft background waveform / radial decorative shape */}
            <div className="absolute right-0 bottom-0 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-200/90 tracking-wide uppercase">
                  Campus Session Clock
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold">
                  Period 3 Active
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/70 mt-1">
                Synchronized with Central University Bell
              </p>
            </div>

            {/* Large Digital Clock Display */}
            <div className="my-5 text-center">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-wider text-white drop-shadow-sm">
                {clockTime}
              </div>
              <p className="text-xs text-emerald-300 mt-2 font-medium">
                Next Bell in 38 mins (Lunch Break)
              </p>
            </div>

            {/* Media / Timer Controls matching Donezo Widget */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsClockRunning(!isClockRunning)}
                className="w-11 h-11 rounded-full bg-white text-[#165239] hover:bg-emerald-50 flex items-center justify-center shadow-md transition"
                title={isClockRunning ? 'Pause Clock' : 'Resume Clock'}
              >
                {isClockRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setClockTime(new Date().toLocaleTimeString('en-GB'))}
                className="w-11 h-11 rounded-full bg-[#ef4444] text-white hover:bg-[#dc2626] flex items-center justify-center shadow-md transition"
                title="Sync Time"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM SECTION: 3 CARDS (Priorities, Progress, Leadership) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card A: Institutional Priorities */}
          <div className="lg:col-span-5 bg-white rounded-[26px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Institutional Priorities
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/academic')}
                  className="px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  + New
                </button>
              </div>

              <div className="space-y-3.5">
                {INSTITUTIONAL_PRIORITIES.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-md shrink-0 ${item.iconColor}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Due date: {item.dueDate}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 shrink-0">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => navigate('/academic')}
                className="text-xs font-bold text-[#165239] hover:underline"
              >
                View all priorities →
              </button>
            </div>
          </div>

          {/* Card B: Project Progress Radial Gauge */}
          <div className="lg:col-span-3 bg-white rounded-[26px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Term Curriculum Progress
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fall Semester Syllabus completion
              </p>
            </div>

            {/* Custom Donezo-Style Semi-Circular Radial Gauge */}
            <div className="py-2 flex flex-col items-center justify-center relative">
              <svg className="w-48 h-28 overflow-visible" viewBox="0 0 200 110">
                {/* Background Track Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
                {/* In Progress Track */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="60"
                />
                {/* Completed Solid Arc (Donezo Dark Forest Green) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#165239"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="100"
                />
              </svg>

              {/* Center percentage label */}
              <div className="text-center -mt-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  78%
                </span>
                <p className="text-[11px] text-slate-500 font-medium">
                  Syllabus Covered
                </p>
              </div>
            </div>

            {/* Legend matching Donezo reference */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#165239]" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Card C: Department Leadership */}
          <div className="lg:col-span-4 bg-white rounded-[26px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Department Leadership
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/faculty')}
                  className="px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  + Add Member
                </button>
              </div>

              <div className="space-y-3.5">
                {LEADERSHIP_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {member.task}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        member.statusVariant === 'success'
                          ? 'bg-emerald-50 text-[#165239] border border-emerald-200/60'
                          : member.statusVariant === 'warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Dean Council Active</span>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="font-bold text-[#165239] hover:underline"
              >
                Directory →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
