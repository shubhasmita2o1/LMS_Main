import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import {
  Download,
} from 'lucide-react';

interface NaacCriterion {
  id: number;
  title: string;
  weightage: number;
  score: number;
  maxScore: number;
  percentage: number;
  subMetrics: { name: string; score: string }[];
}

const NAAC_CRITERIA: NaacCriterion[] = [
  {
    id: 1,
    title: 'Criterion 1: Curricular Aspects',
    weightage: 150,
    score: 3.85,
    maxScore: 4.0,
    percentage: 96.2,
    subMetrics: [
      { name: 'Curriculum Design & Development (OBE Alignment)', score: '3.90 / 4.0' },
      { name: 'Academic Flexibility & Choice Based Credit System (CBCS)', score: '3.80 / 4.0' },
      { name: 'Curriculum Enrichment & Industry Internships', score: '3.85 / 4.0' },
    ],
  },
  {
    id: 2,
    title: 'Criterion 2: Teaching-Learning & Evaluation',
    weightage: 200,
    score: 3.9,
    maxScore: 4.0,
    percentage: 97.5,
    subMetrics: [
      { name: 'Student Enrolment and Profile Diversity', score: '3.88 / 4.0' },
      { name: 'Catering to Student Diversity & Mentorship Ratio (1:15)', score: '3.95 / 4.0' },
      { name: 'Teaching-Learning Process & LMS Digital Courseware', score: '3.92 / 4.0' },
      { name: 'Continuous Internal Evaluation (CIE) Transparency', score: '3.85 / 4.0' },
    ],
  },
  {
    id: 3,
    title: 'Criterion 3: Research, Innovations & Extension',
    weightage: 250,
    score: 3.75,
    maxScore: 4.0,
    percentage: 93.7,
    subMetrics: [
      { name: 'Promotion of Research and Facilities (Incubation Labs)', score: '3.70 / 4.0' },
      { name: 'Resource Mobilization for Research & Sponsored Grants', score: '3.80 / 4.0' },
      { name: 'Research Publications in Scopus / Web of Science (380+)', score: '3.75 / 4.0' },
    ],
  },
  {
    id: 4,
    title: 'Criterion 4: Infrastructure & Learning Resources',
    weightage: 100,
    score: 3.8,
    maxScore: 4.0,
    percentage: 95.0,
    subMetrics: [
      { name: 'Physical Facilities, Labs & Workstations', score: '3.85 / 4.0' },
      { name: 'Library as a Learning Resource & Digital Subscriptions', score: '3.80 / 4.0' },
      { name: 'IT Infrastructure & 10 Gbps Campus Fiber Backbone', score: '3.75 / 4.0' },
    ],
  },
  {
    id: 5,
    title: 'Criterion 5: Student Support & Progression',
    weightage: 100,
    score: 3.7,
    maxScore: 4.0,
    percentage: 92.5,
    subMetrics: [
      { name: 'Student Support & Scholarship Endowments ($850k)', score: '3.75 / 4.0' },
      { name: 'Student Progression to Higher Studies & Top Tier Placements', score: '3.65 / 4.0' },
      { name: 'Student Participation in Sports and Hackathons', score: '3.70 / 4.0' },
    ],
  },
  {
    id: 6,
    title: 'Criterion 6: Governance, Leadership & Management',
    weightage: 100,
    score: 3.88,
    maxScore: 4.0,
    percentage: 97.0,
    subMetrics: [
      { name: 'Institutional Vision, Mission and ERP Automation', score: '3.95 / 4.0' },
      { name: 'Internal Quality Assurance Cell (IQAC) Operations', score: '3.85 / 4.0' },
      { name: 'Financial Management and Resource Mobilization', score: '3.85 / 4.0' },
    ],
  },
  {
    id: 7,
    title: 'Criterion 7: Institutional Values & Best Practices',
    weightage: 100,
    score: 3.95,
    maxScore: 4.0,
    percentage: 98.7,
    subMetrics: [
      { name: 'Institutional Values & Environmental Sustainability', score: '3.95 / 4.0' },
      { name: 'Best Practices in Experiential Hands-on Labs', score: '4.00 / 4.0' },
      { name: 'Institutional Distinctiveness in Research Excellence', score: '3.90 / 4.0' },
    ],
  },
];

export function ReportsAnalyticsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAQAR = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 400);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Accreditation, Compliance & Quality Reports"
        subtitle="NAAC Criteria 1 to 7 Institutional Self-Study Report (SSR) and Annual Quality Assurance (AQAR)"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports & Accreditation' }]}
        stats={[
          { label: 'Cumulative CGPA', value: '3.82 / 4.00', variant: 'success' },
          { label: 'Accreditation Status', value: 'Grade A++', variant: 'primary' },
          { label: 'NBA Tier-1 Readiness', value: '96.4%', variant: 'default' },
        ]}
        primaryAction={{
          label: isExporting ? 'Generating Report...' : 'Export AQAR / SSR Compliance Bundle',
          onClick: handleExportAQAR,
          icon: <Download className="w-4 h-4" />,
        }}
      />

      {/* Top Accreditation Scorecard */}
      <div className="bg-gradient-to-r from-slate-900 to-primary-950 rounded-3xl p-6 text-white mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">
            Institutional Performance Grade
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-4xl font-extrabold text-white">3.82</h2>
            <span className="text-sm text-slate-300">out of 4.00 Maximum Quality Score</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Grade A++ Certified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
            Meets all threshold guidelines prescribed by national accreditation boards (NAAC, NBA, ABET) for outcome-based higher education curricula.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center shrink-0">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] text-slate-300 block">Faculty:Student</span>
            <span className="text-lg font-bold text-white">1 : 17.6</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] text-slate-300 block">Student Retention</span>
            <span className="text-lg font-bold text-white">97.4%</span>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Seven Quantitative Accreditation Criteria
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {NAAC_CRITERIA.map((crit) => (
            <div
              key={crit.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{crit.title}</h4>
                  <span className="text-xs text-slate-400">Weightage: {crit.weightage} Points</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-primary-700">{crit.score} / 4.0</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">{crit.percentage}% Attainment</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${crit.percentage}%` }}
                />
              </div>

              {/* Sub-metrics */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                {crit.subMetrics.map((sm, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="truncate pr-2">{sm.name}</span>
                    <strong className="text-slate-900 shrink-0 font-mono text-[11px]">{sm.score}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
export default ReportsAnalyticsPage;
