import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore, DEMO_PERSONAS } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Award,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileCheck,
  Building,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const ENROLLMENT_DATA = [
  { year: '2022', Undergrad: 9800, Postgrad: 2400, Doctorate: 620 },
  { year: '2023', Undergrad: 10400, Postgrad: 2650, Doctorate: 710 },
  { year: '2024', Undergrad: 11200, Postgrad: 2890, Doctorate: 780 },
  { year: '2025', Undergrad: 11800, Postgrad: 3100, Doctorate: 840 },
  { year: '2026', Undergrad: 12400, Postgrad: 3350, Doctorate: 910 },
];

const DEPARTMENT_PERFORMANCE = [
  { dept: 'Comp Sci', passRate: 96.2, avgCGPA: 3.82 },
  { dept: 'Electronics', passRate: 92.5, avgCGPA: 3.65 },
  { dept: 'Mechanical', passRate: 89.4, avgCGPA: 3.48 },
  { dept: 'Civil Eng', passRate: 91.0, avgCGPA: 3.52 },
  { dept: 'Biotech', passRate: 94.8, avgCGPA: 3.74 },
  { dept: 'Management', passRate: 97.5, avgCGPA: 3.88 },
];

const DIVERSITY_DATA = [
  { name: 'B.Tech / B.E.', value: 8400, color: '#0ea5e9' },
  { name: 'M.Tech / M.S.', value: 2800, color: '#6366f1' },
  { name: 'MBA / Executive', value: 2100, color: '#10b981' },
  { name: 'Ph.D. Research', value: 910, color: '#f59e0b' },
  { name: 'Dual Degree', value: 610, color: '#ec4899' },
];

const TODAY_CLASSES = [
  { time: '09:00 - 10:30 AM', code: 'CS301', course: 'Operating Systems & Kernel', room: 'Hall A-102', instructor: 'Prof. Elena Rostova', status: 'In Progress' },
  { time: '11:00 - 12:30 PM', code: 'CS302', course: 'Distributed Databases & Big Data', room: 'Lecture Hall 4', instructor: 'Dr. Ananya Sen', status: 'Upcoming' },
  { time: '01:30 - 04:30 PM', code: 'CS304L', course: 'Systems Programming Lab (Batch A1)', room: 'Systems Lab 3', instructor: 'Prof. Elena Rostova', status: 'Upcoming' },
  { time: '04:45 - 06:00 PM', code: 'SEMINAR', course: 'Guest Lecture: AI Safety & Governance', room: 'Main Auditorium', instructor: 'Dr. Arthur Vance', status: 'Upcoming' },
];

const RECENT_ACTIVITIES = [
  { id: '1', title: 'Admit Cards Generated for Fall Mid-Terms', time: '18 minutes ago', user: 'Dr. Sarah Jenkins', dept: 'Exam Cell', type: 'exam' },
  { id: '2', title: 'Attendance Register Locked for Period 2', time: '42 minutes ago', user: 'Prof. Elena Rostova', dept: 'CSE Dept', type: 'attendance' },
  { id: '3', title: 'Tuition Fee Installment #2 Reconciled ($480k)', time: '2 hours ago', user: 'Jonathan Sterling', dept: 'Finance Office', type: 'finance' },
  { id: '4', title: 'New Course Proposal: Quantum Algorithms (CS440)', time: '4 hours ago', user: 'Prof. Vikram Malhotra', dept: 'Academic Council', type: 'curriculum' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentTenant, currentCampus, academicYear, currentTerm } = useTenantStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Fall 2026');

  const currentRole = user?.roles[0] || 'university_admin';
  const persona = DEMO_PERSONAS.find((p) => p.role === currentRole) || DEMO_PERSONAS[1];

  return (
    <AppLayout>
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-primary-500/15 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-200 text-xs font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                {currentTenant.name} ({currentTenant.code})
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-400" />
                {currentCampus.name}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                {academicYear} • {currentTerm}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {persona.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Academic operations are currently active across {currentTenant.campusesCount} campuses. Examination schedules, semester grade moderation, and continuous assessment registers are up to date.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>NAAC / NBA Metrics</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/examinations')}
              className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary-500/30 transition flex items-center gap-2"
            >
              <span>Exam Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Attention Alerts Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-900">
              Immediate Academic Attention Items (3 Actions Pending)
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              42 students below 75% attendance cutoff • 3 syllabus revisions awaiting sign-off • 14 tuition fee invoices overdue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
          >
            Review Attendance
          </button>
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition"
          >
            Fee Dues
          </button>
        </div>
      </div>

      {/* 6 Executive KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{currentTenant.studentsCount.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.4% YoY</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Teaching Faculty</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{currentTenant.facultyCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Ratio 1:17.6 (Optimal)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Courses</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">312</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {currentTenant.programsCount} Degree Programs
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Avg Attendance</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">88.4%</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% this month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">Fee Collection</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">92.6%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            $12.4M Reconciled
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">NAAC Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">3.82 <span className="text-xs font-normal text-slate-400">/ 4.0</span></div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">
            Grade A++ Accredited
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Enrollment Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Annual Student Enrollment Growth</h3>
              <p className="text-xs text-slate-500">Undergraduate, Postgraduate, and Doctorate trajectory</p>
            </div>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="Fall 2026">Last 5 Years</option>
              <option value="2025">2021 - 2025</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ENROLLMENT_DATA}>
                <defs>
                  <linearGradient id="ugColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pgColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Undergrad" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#ugColor)" />
                <Area type="monotone" dataKey="Postgrad" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#pgColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Degree Split Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Intake Distribution</h3>
            <p className="text-xs text-slate-500">Degree distribution across active programs</p>
          </div>
          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DIVERSITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {DIVERSITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {DIVERSITY_DATA.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 truncate">{d.name}:</span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Departmental Academic Performance & Pass Rates</h3>
            <p className="text-xs text-slate-500">Continuous assessment completion and mean semester CGPA</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/results')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>Full Gradebook</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEPARTMENT_PERFORMANCE}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="passRate" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Pass Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Schedule & Recent Activities Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Academic Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Class & Lab Schedule</h3>
              <p className="text-xs text-slate-500">Live lecture allocations and laboratory sessions</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/learn')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>View LMS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {TODAY_CLASSES.map((cls, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-700">{cls.code}</span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{cls.course}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {cls.room} • {cls.instructor}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-800">{cls.time}</div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      cls.status === 'In Progress'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cls.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Campus Activity Stream</h3>
              <p className="text-xs text-slate-500">Real-time actions, audit trail, and department logs</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/audit')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {RECENT_ACTIVITIES.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.user} • <span className="font-semibold">{act.dept}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default DashboardPage;
