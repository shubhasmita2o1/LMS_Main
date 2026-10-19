import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MOCK_TENANTS, type Tenant } from '../../data/mockData';
import {
  MapPin,
  Award,
  ShieldCheck,
  Globe,
  Plus,
  X,
} from 'lucide-react';

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [typeFilter, setTypeFilter] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subdomain: '',
    type: 'Research University' as Tenant['type'],
    accreditation: 'NAAC A++ | ABET',
    location: '',
    established: 1990,
    subscriptionPlan: 'Enterprise Tier' as Tenant['subscriptionPlan'],
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'University / Tenant',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <img
            src={t.logo}
            alt={t.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
              <span>{t.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {t.code}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{t.location}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Category & Accreditation',
      sortable: true,
      render: (t) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{t.type}</span>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Award className="w-3 h-3 text-amber-500" />
            <span>{t.accreditation}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'campusesCount',
      header: 'Campuses',
      sortable: true,
      render: (t) => (
        <span className="font-bold text-slate-800">{t.campusesCount} Campuses</span>
      ),
    },
    {
      key: 'studentsCount',
      header: 'Total Students',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-bold text-slate-900">{t.studentsCount.toLocaleString()}</span>
          <span className="text-xs text-slate-400 block">{t.programsCount} Programs</span>
        </div>
      ),
    },
    {
      key: 'subscriptionPlan',
      header: 'License Tier',
      sortable: true,
      render: (t) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.subscriptionPlan}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            t.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {t.status.toUpperCase()}
        </span>
      ),
    },
  ];

  const handleRowClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      subdomain: formData.subdomain.toLowerCase(),
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80',
      type: formData.type,
      accreditation: formData.accreditation,
      established: Number(formData.established),
      location: formData.location,
      campusesCount: 1,
      studentsCount: 2500,
      facultyCount: 150,
      programsCount: 12,
      status: 'active',
      subscriptionPlan: formData.subscriptionPlan,
      renewalDate: '2028-09-30',
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      description: formData.description,
    };
    setTenants([newTenant, ...tenants]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (tenantToDelete) {
      setTenants(tenants.filter((t) => t.id !== tenantToDelete.id));
      setIsDeleteOpen(false);
      setTenantToDelete(null);
      setIsDetailOpen(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (typeFilter === 'All') return true;
    return t.type === typeFilter;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Tenant & University Management"
        subtitle="Manage multi-tenant higher education institutions, campus allocations, and global licensing"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Tenants' }]}
        stats={[
          { label: 'Total Universities', value: tenants.length, variant: 'primary' },
          { label: 'Campuses', value: 11, variant: 'default' },
          { label: 'Total Students', value: '32,020', variant: 'success' },
          { label: 'SaaS Active', value: '100%', variant: 'primary' },
        ]}
        primaryAction={{
          label: 'Onboard University',
          onClick: () => {
            setFormData({
              name: '',
              code: '',
              subdomain: '',
              type: 'Research University',
              accreditation: 'NAAC A++ | ABET',
              location: '',
              established: 2000,
              subscriptionPlan: 'Enterprise Tier',
              contactEmail: '',
              contactPhone: '',
              description: '',
            });
            setIsCreateOpen(true);
          },
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={filteredTenants}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search universities by name, code, or city..."
        exportTitle="universities_directory"
        onRowClick={handleRowClick}
        filterComponent={
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Filter Category:</span>
            {['All', 'Research University', 'Technology Institute', 'Business School', 'Medical College'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTypeFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-xs ${
                  typeFilter === cat
                    ? 'bg-[#165239] text-white border border-[#165239]'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      />

      {/* Detail Drawer */}
      {selectedTenant && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedTenant.name}
          subtitle={`${selectedTenant.code} • Established ${selectedTenant.established}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {selectedTenant.status.toUpperCase()}
            </span>
          }
          onEdit={() => setIsCreateOpen(true)}
          onDelete={() => {
            setTenantToDelete(selectedTenant);
            setIsDeleteOpen(true);
          }}
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={selectedTenant.logo}
                alt={selectedTenant.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h3 className="font-bold text-slate-900">{selectedTenant.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedTenant.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-600">
                  <Globe className="w-3.5 h-3.5 text-primary-600" />
                  <span>https://{selectedTenant.subdomain}.university-lms.io</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-400">Institutional Category</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedTenant.type}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-400">Accreditations</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedTenant.accreditation}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-400">Primary Contact</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedTenant.contactEmail}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-400">Subscription Tier</span>
                <p className="text-sm font-bold text-primary-700 mt-0.5">{selectedTenant.subscriptionPlan}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Enrollment Capacity & Scaling
              </h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Active Enrolled Students:</span>
                <span className="font-bold">{selectedTenant.studentsCount.toLocaleString()} / 25,000 Seats</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${(selectedTenant.studentsCount / 25000) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Create / Onboard University Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Onboard University Tenant</h3>
                <p className="text-xs text-slate-500">Configure new higher education institution workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">University Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Oxford Global University"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institution Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. OGU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Subdomain</label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden">
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                      placeholder="oxford"
                      className="w-full px-3 py-2 text-xs sm:text-sm focus:outline-none"
                    />
                    <span className="bg-slate-100 px-3 py-2 text-xs text-slate-500 border-l border-slate-200">
                      .ulms.io
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                  >
                    <option value="Research University">Research University</option>
                    <option value="Technology Institute">Technology Institute</option>
                    <option value="Business School">Business School</option>
                    <option value="Medical College">Medical College</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accreditations</label>
                  <input
                    type="text"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                    placeholder="e.g. NAAC A++ | ABET"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Campus Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Oxford, Oxfordshire, UK"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="admin@oxford.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">License Tier</label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                  >
                    <option value="Enterprise Tier">Enterprise Tier (25,000 Seats)</option>
                    <option value="Flagship Multi-Campus">Flagship Multi-Campus (50,000 Seats)</option>
                    <option value="Pro Academic">Pro Academic (10,000 Seats)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution Summary</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of academic mission, research strengths, and colleges..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Onboard & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Suspend Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Suspend or Delete University Tenant?"
        description="This action will suspend tenant user logins, disable student LMS access, and archive institutional course databases."
        itemName={tenantToDelete ? `${tenantToDelete.name} (${tenantToDelete.code})` : ''}
        confirmLabel="Confirm Suspension"
      />
    </AppLayout>
  );
}
export default TenantsPage;
