import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import {
  listDrives, listCompanies, createCompany, createDrive, openDrive, closeDrive,
  applyToDrive, listApplications, updateApplicationStatus, createOffer, listOffers, respondOffer,
} from '../../lib/placementApi';
import type {
  PlacementDrivePublic, CompanyPublic, PlacementApplicationPublic, OfferPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { Plus } from 'lucide-react';

type Tab = 'drives' | 'companies' | 'applications' | 'offers';

export function PlacementPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles || [];
  const isStudent = roles.includes('student') && !roles.some((r) => ['tenant_admin', 'university_admin', 'staff'].includes(r));
  const canManage = roles.some((r) => ['tenant_admin', 'university_admin', 'super_admin', 'staff'].includes(r));

  const [tab, setTab] = useState<Tab>('drives');
  const [drives, setDrives] = useState<PlacementDrivePublic[]>([]);
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [applications, setApplications] = useState<PlacementApplicationPublic[]>([]);
  const [offers, setOffers] = useState<OfferPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompany, setShowCompany] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', industry: '', website: '' });
  const [driveForm, setDriveForm] = useState({
    companyId: '', title: '', jobType: 'placement' as 'placement' | 'internship',
    packageMin: '', packageMax: '', minCgpa: '',
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'drives') setDrives((await listDrives()).items);
      else if (tab === 'companies') setCompanies((await listCompanies()).items);
      else if (tab === 'applications') setApplications((await listApplications()).items);
      else setOffers((await listOffers()).items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const driveColumns: Column<PlacementDrivePublic>[] = [
    { key: 'title', header: 'Drive', render: (d) => (
      <div><span className="font-bold text-slate-900 block">{d.title}</span>
      <span className="text-xs text-slate-500">{d.company?.name || d.companyId} · {d.jobType}</span></div>
    )},
    { key: 'status', header: 'Status', render: (d) => (
      <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100">{d.status}</span>
    )},
    { key: 'applicationCount', header: 'Apps', render: (d) => <span className="text-xs font-bold">{d.applicationCount ?? 0}</span> },
    { key: 'actions', header: '', render: (d) => (
      <div className="flex gap-2 flex-wrap">
        {isStudent && d.status === 'open' && (
          <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline"
            onClick={async () => { try { await applyToDrive({ driveId: d.id }); alert('Applied'); setTab('applications'); } catch (e: any) { alert(e?.response?.data?.message || e.message); } }}>Apply</button>
        )}
        {canManage && d.status === 'draft' && (
          <button type="button" className="text-xs font-semibold text-sky-700 hover:underline" onClick={async () => { await openDrive(d.id); load(); }}>Open</button>
        )}
        {canManage && d.status === 'open' && (
          <button type="button" className="text-xs font-semibold text-amber-700 hover:underline" onClick={async () => { await closeDrive(d.id); load(); }}>Close</button>
        )}
      </div>
    )},
  ];

  const appColumns: Column<PlacementApplicationPublic>[] = [
    { key: 'drive', header: 'Drive', render: (a) => <span className="text-sm font-medium">{a.drive?.title || a.driveId}</span> },
    { key: 'status', header: 'Status', render: (a) => <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100">{a.status}</span> },
    { key: 'actions', header: '', render: (a) => canManage ? (
      <div className="flex gap-2 flex-wrap">
        {a.status === 'applied' && <button type="button" className="text-xs font-semibold text-sky-700 hover:underline" onClick={async () => { await updateApplicationStatus(a.id, 'shortlisted'); load(); }}>Shortlist</button>}
        {(a.status === 'shortlisted' || a.status === 'interview') && (
          <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline" onClick={async () => {
            const role = prompt('Role title?') || 'Offer';
            await createOffer({ applicationId: a.id, roleTitle: role });
            load();
          }}>Offer</button>
        )}
        {!['rejected', 'accepted', 'withdrawn'].includes(a.status) && (
          <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={async () => { await updateApplicationStatus(a.id, 'rejected'); load(); }}>Reject</button>
        )}
      </div>
    ) : null },
  ];

  const offerColumns: Column<OfferPublic>[] = [
    { key: 'roleTitle', header: 'Role', render: (o) => (
      <div><span className="font-bold block">{o.roleTitle}</span>
      <span className="text-xs text-slate-500">{o.company?.name || o.companyId}</span></div>
    )},
    { key: 'packageAmount', header: 'Package', render: (o) => <span className="text-xs font-mono">{o.packageAmount != null ? `${o.packageAmount} ${o.currency}` : '—'}</span> },
    { key: 'status', header: 'Status', render: (o) => <span className="text-xs font-semibold capitalize">{o.status}</span> },
    { key: 'actions', header: '', render: (o) => isStudent && o.status === 'pending' ? (
      <div className="flex gap-2">
        <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline" onClick={async () => { await respondOffer(o.id, true); load(); }}>Accept</button>
        <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={async () => { await respondOffer(o.id, false); load(); }}>Decline</button>
      </div>
    ) : null },
  ];

  const companyColumns: Column<CompanyPublic>[] = [
    {
      key: 'name',
      header: 'Company',
      render: (c: CompanyPublic) => (
        <div>
          <span className="font-bold block">{c.name}</span>
          <span className="text-xs text-slate-500">{c.industry || '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: CompanyPublic) => <span className="text-xs capitalize">{c.status}</span>,
    },
  ];
  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader title="Placement & Internship" subtitle="Companies, drives, applications and offers" />
        <div className="flex flex-wrap gap-2 items-center">
          {(['drives', 'companies', 'applications', 'offers'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${tab === t ? 'bg-[#165239] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{t}</button>
          ))}
          {canManage && tab === 'companies' && (
            <button type="button" onClick={() => setShowCompany(true)} className="ml-auto inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#165239] text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Company</button>
          )}
          {canManage && tab === 'drives' && (
            <button type="button" onClick={async () => { if (!companies.length) setCompanies((await listCompanies()).items); setShowDrive(true); }}
              className="ml-auto inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#165239] text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Drive</button>
          )}
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>}
        {loading ? <div className="text-sm text-slate-500">Loading…</div>
          : tab === 'drives' ? <DataTable columns={driveColumns} data={drives} keyExtractor={(d) => d.id} />
          : tab === 'companies' ? <DataTable columns={companyColumns} data={companies} keyExtractor={(c) => c.id} />
          : tab === 'applications' ? <DataTable columns={appColumns} data={applications} keyExtractor={(a) => a.id} />
          : <DataTable columns={offerColumns} data={offers} keyExtractor={(o) => o.id} />}
      </div>

      {showCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-lg font-bold">Add company</h3>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Industry" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCompany(false)} className="text-sm px-3">Cancel</button>
              <button type="button" className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold" onClick={async () => {
                try { await createCompany({ name: companyForm.name, industry: companyForm.industry || undefined }); setShowCompany(false); load(); }
                catch (e: any) { alert(e?.response?.data?.message || e.message); }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-lg font-bold">Create drive</h3>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={driveForm.companyId} onChange={(e) => setDriveForm({ ...driveForm, companyId: e.target.value })}>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Title" value={driveForm.title} onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={driveForm.jobType} onChange={(e) => setDriveForm({ ...driveForm, jobType: e.target.value as any })}>
              <option value="placement">Placement</option>
              <option value="internship">Internship</option>
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Min CGPA (optional)" value={driveForm.minCgpa} onChange={(e) => setDriveForm({ ...driveForm, minCgpa: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDrive(false)} className="text-sm px-3">Cancel</button>
              <button type="button" className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold" onClick={async () => {
                try {
                  await createDrive({
                    companyId: driveForm.companyId, title: driveForm.title, jobType: driveForm.jobType,
                    eligibility: driveForm.minCgpa ? { minCgpa: Number(driveForm.minCgpa) } : undefined,
                  });
                  setShowDrive(false); load();
                } catch (e: any) { alert(e?.response?.data?.message || e.message); }
              }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
