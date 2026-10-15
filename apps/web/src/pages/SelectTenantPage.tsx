import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../stores/tenantStore';
import { useAuthStore } from '../stores/authStore';
import {
  GraduationCap,
  Building2,
  MapPin,
  Users,
  Award,
  Search,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

export function SelectTenantPage() {
  const navigate = useNavigate();
  const { tenants, currentTenant, setTenant, setCampus, getCampusesForTenant } = useTenantStore();
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCampusMap, setSelectedCampusMap] = useState<Record<string, string>>({
    't-northridge': 'c-nru-main',
    't-greenfield': 'c-git-sv',
    't-horizon': 'c-hbs-main',
    't-lakeview': 'c-lmc-main',
  });

  const universityTypes = ['All', 'Research University', 'Technology Institute', 'Business School', 'Medical College'];

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleLaunch = (tenantId: string) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return;

    setTenant(targetTenant);

    const campusId = selectedCampusMap[tenantId];
    const campuses = getCampusesForTenant(tenantId);
    const targetCampus = campuses.find((c) => c.id === campusId) || campuses[0];
    if (targetCampus) {
      setCampus(targetCampus);
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 leading-none block">
                University LMS
              </span>
              <span className="text-xs text-slate-500 font-medium">Multi-tenant Cloud Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">
                {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Demo Evaluator'}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">
                {user?.roles[0]?.replace('_', ' ') || 'User'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 border border-primary-300 text-primary-700 font-bold text-xs flex items-center justify-center">
              {user?.firstName ? user.firstName[0] : 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Tenant SaaS Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Select Your University or Tenant
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Choose an institution and affiliated campus to access academic programs, student rosters, courses, examinations, and ERP operations.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search university by name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {universityTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedType === type
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* University Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTenants.map((tenant) => {
            const isCurrent = currentTenant.id === tenant.id;
            const campuses = getCampusesForTenant(tenant.id);
            const selectedCampusId = selectedCampusMap[tenant.id] || campuses[0]?.id;

            return (
              <div
                key={tenant.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isCurrent ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                    <img
                      src={tenant.logo}
                      alt={tenant.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {tenant.code}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Tenant
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 truncate">{tenant.name}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{tenant.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges and Accreditation */}
                  <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {tenant.accreditation}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">{tenant.type}</span>
                  </div>

                  {/* Statistics Grid */}
                  <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Students
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {tenant.studentsCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Faculty
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {tenant.facultyCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        Programs
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {tenant.programsCount}
                      </div>
                    </div>
                  </div>

                  {/* Campus Switcher Dropdown */}
                  <div className="p-6 pt-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary-600" />
                      Select Affiliated Campus / Branch:
                    </label>
                    <select
                      value={selectedCampusId}
                      onChange={(e) =>
                        setSelectedCampusMap((prev) => ({
                          ...prev,
                          [tenant.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.isMainCampus ? '(Main Campus)' : ''} — {c.city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleLaunch(tenant.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>Launch {tenant.code} Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
export default SelectTenantPage;
