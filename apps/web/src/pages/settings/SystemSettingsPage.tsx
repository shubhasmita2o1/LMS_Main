import React, { useState } from 'react';
import {
  Building2,
  Palette,
  Calendar,
  Award,
  ShieldCheck,
  Mail,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { useTenantStore } from '../../stores/tenantStore';

interface GradingScaleItem {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description: string;
}

export function SystemSettingsPage() {
  const { currentTenant, academicYear, currentTerm } = useTenantStore();

  const [activeTab, setActiveTab] = useState<
    'general' | 'branding' | 'academic' | 'grading' | 'security' | 'integrations' | 'maintenance'
  >('general');

  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    name: currentTenant.name,
    legalName: `${currentTenant.name} Trust & Higher Education Society`,
    code: currentTenant.code,
    type: 'Private Autonomous University',
    establishedYear: '1984',
    domain: `${currentTenant.subdomain}.edu`,
    supportEmail: `registrar@${currentTenant.subdomain}.edu`,
    phone: '+1 (555) 234-8900',
    address: '100 University Parkway, Tech District, CA 94107',
    currency: 'USD ($)',
    timezone: 'America/Los_Angeles (PST - UTC-8)',
    naacAccreditation: 'A++ Grade (CGPA 3.82/4.00)',
    abetCertified: true,
  });

  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#0284c7', // Sky Blue
    accentColor: '#0ea5e9',
    neutralColor: '#0f172a',
    fontFamily: 'Inter, system-ui, sans-serif',
    portalTitle: `${currentTenant.name} Academic ERP`,
    customDomain: `portal.${currentTenant.subdomain}.edu`,
    enableCustomLoginBanner: true,
    darkThemeDefault: false,
  });

  const [academicForm, setAcademicForm] = useState({
    currentYear: academicYear,
    activeTerm: currentTerm,
    autoEnrollEnabled: true,
    termStartDate: '2025-08-15',
    termEndDate: '2025-12-20',
    attendanceCutoff: 75,
    minimumCreditsPerSemester: 16,
    maximumCreditsPerSemester: 26,
    allowCreditOverload: false,
  });

  const [gradingScale] = useState<GradingScaleItem[]>([
    { grade: 'O', gradePoint: 10, minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
    { grade: 'A+', gradePoint: 9, minPercentage: 80, maxPercentage: 89, description: 'Excellent' },
    { grade: 'A', gradePoint: 8, minPercentage: 70, maxPercentage: 79, description: 'Very Good' },
    { grade: 'B+', gradePoint: 7, minPercentage: 60, maxPercentage: 69, description: 'Good' },
    { grade: 'B', gradePoint: 6, minPercentage: 55, maxPercentage: 59, description: 'Above Average' },
    { grade: 'C', gradePoint: 5, minPercentage: 50, maxPercentage: 54, description: 'Average' },
    { grade: 'P', gradePoint: 4, minPercentage: 40, maxPercentage: 49, description: 'Pass' },
    { grade: 'F', gradePoint: 0, minPercentage: 0, maxPercentage: 39, description: 'Fail / Arrear' },
  ]);

  const [securityForm, setSecurityForm] = useState({
    ssoEnabled: true,
    ssoProvider: 'Google Workspace & Azure AD',
    ssoEntityId: `urn:univlms:auth:${currentTenant.id}`,
    enforce2FA: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    ipWhitelisting: false,
    whitelistedIPs: '192.168.1.0/24, 10.0.0.0/16',
    passwordExpiryDays: 90,
  });

  const [integrationsForm, setIntegrationsForm] = useState({
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: '587',
    fromEmail: `no-reply@${currentTenant.subdomain}.edu`,
    emailVerified: true,
    smsGateway: 'Twilio SMS v2',
    smsEnabled: true,
    paymentGateway: 'Stripe Connect & Razorpay University Desk',
    paymentStatus: 'Active',
    cloudStorageBucket: `s3://${currentTenant.id}-academic-records-us-west-2`,
    turnitinEnabled: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader
          title="System Settings & Institutional Configuration"
          subtitle={`Manage global university governance, identity branding, academic calendar policies, grading formulas, and SSO security for ${currentTenant.name}.`}
          breadcrumbs={[
            { label: 'Governance & Admin' },
            { label: 'System Settings' },
          ]}
          stats={[
            { label: 'Tenant Tier', value: 'Enterprise Multi-Campus' },
            { label: 'Current Term', value: currentTerm },
            { label: 'SSO Protocol', value: 'SAML 2.0 / OIDC' },
            { label: 'NAAC Accreditation', value: 'A++ Verified' },
          ]}
        />

        {/* Success Alert Banner */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">System configuration updated successfully.</p>
                <p className="text-xs text-emerald-700">Tenant settings synchronized across all distributed edge instances.</p>
              </div>
            </div>
            <button
              onClick={() => setIsSaved(false)}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Configuration Tabs Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
          <nav className="flex space-x-1 p-1.5 min-w-max">
            {[
              { id: 'general', label: 'Institutional Profile', icon: Building2 },
              { id: 'branding', label: 'Branding & Theme', icon: Palette },
              { id: 'academic', label: 'Academic Lifecycle', icon: Calendar },
              { id: 'grading', label: 'Grading Scale & Policies', icon: Award },
              { id: 'security', label: 'SSO & Access Control', icon: ShieldCheck },
              { id: 'integrations', label: 'Gateways & External APIs', icon: Mail },
              { id: 'maintenance', label: 'Data & Maintenance', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Institutional Profile */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Identity & Legal Profile</h3>
                <p className="text-xs text-slate-500">Legal university registry and core contact details.</p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  University / Institution Name
                </label>
                <input
                  type="text"
                  value={generalForm.name}
                  onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Legal Sponsoring Body / Trust Name
                </label>
                <input
                  type="text"
                  value={generalForm.legalName}
                  onChange={(e) => setGeneralForm({ ...generalForm, legalName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institution Code (Short Identifier)
                </label>
                <input
                  type="text"
                  value={generalForm.code}
                  onChange={(e) => setGeneralForm({ ...generalForm, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institution Legal Classification
                </label>
                <select
                  value={generalForm.type}
                  onChange={(e) => setGeneralForm({ ...generalForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                >
                  <option value="State Public University">State Public University</option>
                  <option value="Private Autonomous University">Private Autonomous University</option>
                  <option value="Deemed to be University">Deemed to be University</option>
                  <option value="National Institute of Importance">National Institute of Importance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Web Domain
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={generalForm.domain}
                    onChange={(e) => setGeneralForm({ ...generalForm, domain: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Support & Registrar Email
                </label>
                <input
                  type="email"
                  value={generalForm.supportEmail}
                  onChange={(e) => setGeneralForm({ ...generalForm, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered University Campus Headquarters Address
                </label>
                <input
                  type="text"
                  value={generalForm.address}
                  onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Accounting & Base Currency
                </label>
                <select
                  value={generalForm.currency}
                  onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                >
                  <option value="USD ($)">USD ($) - United States Dollar</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  System Standard Timezone
                </label>
                <select
                  value={generalForm.timezone}
                  onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                >
                  <option value="America/Los_Angeles (PST - UTC-8)">America/Los_Angeles (PST - UTC-8)</option>
                  <option value="America/New_York (EST - UTC-5)">America/New_York (EST - UTC-5)</option>
                  <option value="Asia/Kolkata (IST - UTC+5:30)">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="Europe/London (GMT - UTC+0)">Europe/London (GMT - UTC+0)</option>
                  <option value="Asia/Singapore (SGT - UTC+8)">Asia/Singapore (SGT - UTC+8)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  NAAC / Regional Accreditation Standing
                </label>
                <input
                  type="text"
                  value={generalForm.naacAccreditation}
                  onChange={(e) => setGeneralForm({ ...generalForm, naacAccreditation: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="abetCertified"
                  checked={generalForm.abetCertified}
                  onChange={(e) => setGeneralForm({ ...generalForm, abetCertified: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="abetCertified" className="text-sm font-medium text-slate-700">
                  Enable International ABET / Washington Accord Compliance Tagging on Transcripts
                </label>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Branding & Theme */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Identity & White-Labeling</h3>
                <p className="text-xs text-slate-500">Configure theme palette, typography, portal banner, and domain masking.</p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Apply Branding
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Institutional Primary Color (Sky Blue Standard: #0284C7)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 w-36 uppercase"
                  />
                  <span className="text-xs text-slate-500">Applies to active tabs, headers, buttons</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Accent Color (#0EA5E9)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.accentColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandingForm.accentColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 w-36 uppercase"
                  />
                  <span className="text-xs text-slate-500">Applies to badges, highlights, graphs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Portal Page Title
                </label>
                <input
                  type="text"
                  value={brandingForm.portalTitle}
                  onChange={(e) => setBrandingForm({ ...brandingForm, portalTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Domain CNAME Masking
                </label>
                <input
                  type="text"
                  value={brandingForm.customDomain}
                  onChange={(e) => setBrandingForm({ ...brandingForm, customDomain: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                />
              </div>

              <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Live Header Branding Preview
                </h4>
                <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: brandingForm.primaryColor }}
                    >
                      {currentTenant.code.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{generalForm.name}</h4>
                      <p className="text-xs text-slate-500">Academic ERP • Powered by Multi-tenant SaaS</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                    className="px-4 py-1.5 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Action Button
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Academic Lifecycle & Calendar */}
        {activeTab === 'academic' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Year, Terms & Enrollment Rules</h3>
                <p className="text-xs text-slate-500">Define active calendar periods, credit loading constraints, and attendance cutoffs.</p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Save Policies
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Active Academic Year
                </label>
                <input
                  type="text"
                  value={academicForm.currentYear}
                  onChange={(e) => setAcademicForm({ ...academicForm, currentYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Active Term / Semester
                </label>
                <input
                  type="text"
                  value={academicForm.activeTerm}
                  onChange={(e) => setAcademicForm({ ...academicForm, activeTerm: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Term Commencement Date
                </label>
                <input
                  type="date"
                  value={academicForm.termStartDate}
                  onChange={(e) => setAcademicForm({ ...academicForm, termStartDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Term Conclusion / Exam Date
                </label>
                <input
                  type="date"
                  value={academicForm.termEndDate}
                  onChange={(e) => setAcademicForm({ ...academicForm, termEndDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mandatory Attendance Cutoff (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={academicForm.attendanceCutoff}
                    onChange={(e) => setAcademicForm({ ...academicForm, attendanceCutoff: Number(e.target.value) })}
                    className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500">Students under 75% are ineligible for Hall Ticket</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Max Credit Overload Allowed
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={academicForm.maximumCreditsPerSemester}
                    onChange={(e) => setAcademicForm({ ...academicForm, maximumCreditsPerSemester: Number(e.target.value) })}
                    className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500">Max credits student can register per term</span>
                </div>
              </div>

              <div className="md:col-span-2 pt-2 flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={academicForm.autoEnrollEnabled}
                    onChange={(e) => setAcademicForm({ ...academicForm, autoEnrollEnabled: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Auto-enroll students into mandatory core department courses upon fee clearance
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={academicForm.allowCreditOverload}
                    onChange={(e) => setAcademicForm({ ...academicForm, allowCreditOverload: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Allow Honor Roll students (CGPA &gt; 8.5) to overload up to 30 credits without Dean petition
                  </span>
                </label>
              </div>
            </div>
          </form>
        )}

        {/* Tab 4: Grading Scale & Evaluation Policies */}
        {activeTab === 'grading' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">10-Point UGC / AICTE Grading System</h3>
                <p className="text-xs text-slate-500">Standard grading thresholds used across all transcripts, SGPA/CGPA calculations, and convocation ranking.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSaved(true);
                  setTimeout(() => setIsSaved(false), 3500);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Save Grading System
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Letter Grade</th>
                    <th className="px-4 py-3">Grade Point</th>
                    <th className="px-4 py-3">Marks Range (Min - Max %)</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gradingScale.map((item) => (
                    <tr key={item.grade} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-700 font-bold">
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                        {item.gradePoint.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {item.minPercentage}% - {item.maxPercentage}%
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            item.gradePoint >= 4
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.gradePoint >= 4 ? 'Passing' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Academic Regulation Notice:</p>
                <p>Modifying grade point thresholds or passing marks while an academic term is active will require Re-evaluation Senate approval before updating historical CGPA records.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SSO & Security Policies */}
        {activeTab === 'security' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Authentication, SAML SSO & Zero-Trust Policies</h3>
                <p className="text-xs text-slate-500">Configure federation, two-factor authentication, session timeouts, and IP guards.</p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Update Security
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Single Sign-On (SSO / SAML 2.0)</h4>
                  <p className="text-xs text-slate-500">Authenticate through institutional Google Workspace or Azure AD</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityForm.ssoEnabled}
                  onChange={(e) => setSecurityForm({ ...securityForm, ssoEnabled: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Mandatory Multi-Factor (2FA)</h4>
                  <p className="text-xs text-slate-500">Enforce TOTP authenticator app for all Faculty & Staff</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityForm.enforce2FA}
                  onChange={(e) => setSecurityForm({ ...securityForm, enforce2FA: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  SAML 2.0 Identity Provider (IdP)
                </label>
                <input
                  type="text"
                  value={securityForm.ssoProvider}
                  onChange={(e) => setSecurityForm({ ...securityForm, ssoProvider: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Provider Entity ID (Audience)
                </label>
                <input
                  type="text"
                  value={securityForm.ssoEntityId}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={securityForm.sessionTimeoutMinutes}
                  onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Max Consecutive Failed Login Lockout
                </label>
                <input
                  type="number"
                  value={securityForm.maxLoginAttempts}
                  onChange={(e) => setSecurityForm({ ...securityForm, maxLoginAttempts: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin & Controller IP Subnet Whitelist
                </label>
                <input
                  type="text"
                  value={securityForm.whitelistedIPs}
                  onChange={(e) => setSecurityForm({ ...securityForm, whitelistedIPs: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty to allow administrative logins from all authenticated locations.</p>
              </div>
            </div>
          </form>
        )}

        {/* Tab 6: Integrations & External APIs */}
        {activeTab === 'integrations' && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">SMTP, Gateways & Third-Party Connectors</h3>
                <p className="text-xs text-slate-500">Configure email delivery, SMS dispatch, payment processing, and anti-plagiarism engines.</p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Save Connectors
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  SMTP Mail Delivery Server Host
                </label>
                <input
                  type="text"
                  value={integrationsForm.smtpHost}
                  onChange={(e) => setIntegrationsForm({ ...integrationsForm, smtpHost: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sender From Address
                </label>
                <input
                  type="email"
                  value={integrationsForm.fromEmail}
                  onChange={(e) => setIntegrationsForm({ ...integrationsForm, fromEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  SMS Notification Provider
                </label>
                <input
                  type="text"
                  value={integrationsForm.smsGateway}
                  onChange={(e) => setIntegrationsForm({ ...integrationsForm, smsGateway: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Gateway Integration
                </label>
                <input
                  type="text"
                  value={integrationsForm.paymentGateway}
                  onChange={(e) => setIntegrationsForm({ ...integrationsForm, paymentGateway: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Encrypted Document Cloud Storage Bucket (S3 / GCS)
                </label>
                <input
                  type="text"
                  value={integrationsForm.cloudStorageBucket}
                  onChange={(e) => setIntegrationsForm({ ...integrationsForm, cloudStorageBucket: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                />
              </div>
            </div>
          </form>
        )}

        {/* Tab 7: Data & Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Database Health, Backups & Maintenance</h3>
              <p className="text-xs text-slate-500">Automated backup schedules, database replica status, and maintenance mode controls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 font-medium">Last Automatic Snapshot</p>
                <p className="text-base font-bold text-slate-900 mt-1">Today, 03:00 AM UTC</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verified Consistent
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 font-medium">Database Replication Lag</p>
                <p className="text-base font-bold text-slate-900 mt-1">12 ms</p>
                <p className="text-xs text-slate-600 mt-1">3 Replicas in Sync (Multi-AZ)</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 font-medium">Audit Trail Storage Used</p>
                <p className="text-base font-bold text-slate-900 mt-1">4.2 GB / 50 GB</p>
                <p className="text-xs text-slate-600 mt-1">Retention: 7 Years (FERPA)</p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-rose-900">Campus Maintenance Mode</h4>
                <p className="text-xs text-rose-700">Prevent all student and faculty logins while performing semester transition upgrades.</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-xs transition"
              >
                Enable Maintenance Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
