import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, DEMO_PERSONAS, type DemoPersona } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import type { SystemRole } from '@university-lms/shared';
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  School,
  Lock,
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithDemoUser } = useAuthStore();
  const { currentTenant, tenants } = useTenantStore();

  const [email, setEmail] = useState('provost@northridge.edu');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<SystemRole>('university_admin');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(currentTenant.id);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'personas'>('personas');

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      loginWithDemoUser(selectedRole, selectedTenantId);
      setIsLoading(false);
      navigate('/select-tenant');
    }, 400);
  };

  const handleSelectPersona = (persona: DemoPersona) => {
    setIsLoading(true);
    loginWithDemoUser(persona.role, selectedTenantId);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/select-tenant');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/25 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          University LMS
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Multi-Tenant Academic Administration & Enterprise ERP Platform
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === 'personas'
                  ? 'bg-white text-primary-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>1-Click Demo Personas (9 Roles)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === 'standard'
                  ? 'bg-white text-primary-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Standard Credential Login</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'personas' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Choose a Demo Role to Test Drive</h2>
                    <p className="text-xs text-slate-500">Instant login with pre-configured permissions and dashboard</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Demo Ready
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  {DEMO_PERSONAS.map((persona) => (
                    <button
                      key={persona.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectPersona(persona)}
                      className="group p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-500 hover:ring-2 hover:ring-primary-500/20 text-left transition-all duration-150 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <img
                          src={persona.avatar}
                          alt={persona.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:border-primary-500"
                        />
                        <div className="min-w-0">
                          <span className="inline-block text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                            {persona.label}
                          </span>
                          <h3 className="text-xs font-semibold text-slate-900 truncate">
                            {persona.name}
                          </h3>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {persona.title}
                      </p>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-primary-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Sign In as {persona.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleStandardSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    User ID or Institutional Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. administrator@northridge.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                      Role Classification
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as SystemRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="university_admin">University Admin</option>
                      <option value="registrar">Registrar</option>
                      <option value="faculty">Faculty</option>
                      <option value="student">Student</option>
                      <option value="department_head">Department Head</option>
                      <option value="exam_controller">Exam Controller</option>
                      <option value="finance">Finance / Bursar</option>
                      <option value="librarian">Librarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-primary-600" />
                      Institution / Tenant
                    </label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    <span>Keep me signed in for 30 days</span>
                  </label>
                  <span className="text-primary-600 hover:underline cursor-pointer font-medium">
                    Forgot password?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-500/20 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In & Continue to Tenant Selection</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer security badge */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Enterprise Isolation • 256-bit TLS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>SOC2 Type II & FERPA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
