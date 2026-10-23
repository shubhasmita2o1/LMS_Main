import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell } from '../../components/ui';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import api from '../../lib/api';
import { isAxiosError } from 'axios';
import type { ApiResponse } from '@university-lms/shared';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId: string | null;
  organizationName?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

const ASSIGNABLE_ROLES = [
  'tenant_admin',
  'university_admin',
  'faculty',
  'student',
  'staff',
  'registrar',
  'department_head',
] as const;

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>('faculty');
  const [tenantId, setTenantId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        filter === 'pending' ? { approvalStatus: 'pending', limit: 50 } : { limit: 50 };
      const { data } = await api.get<ApiResponse<UserRow[]>>('/users', { params });
      if (data.success && data.data) setUsers(data.data);
      else setError('Failed to load users');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: { message?: string } })?.error?.message ||
            'Failed to load users'
        );
      } else setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setActionMsg(null);
    try {
      await api.post(`/users/${id}/approve`, {
        role,
        tenantId: tenantId.trim() || undefined,
        activate: true,
      });
      setActionMsg('User approved and activated');
      setApproveId(null);
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionMsg(
          (err.response?.data as { error?: { message?: string } })?.error?.message ||
            'Approve failed'
        );
      }
    }
  };

  const reject = async (id: string) => {
    setActionMsg(null);
    try {
      await api.post(`/users/${id}/reject`, { reason: 'Rejected by administrator' });
      setActionMsg('User rejected');
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionMsg(
          (err.response?.data as { error?: { message?: string } })?.error?.message ||
            'Reject failed'
        );
      }
    }
  };

  const toggleActive = async (u: UserRow) => {
    try {
      await api.patch(`/users/${u.id}/active`, { isActive: !u.isActive });
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionMsg(
          (err.response?.data as { error?: { message?: string } })?.error?.message ||
            'Update failed'
        );
      }
    }
  };

  return (
    <AppLayout>
      <PageShell>
        <ModuleHeader
          title="User management"
          subtitle="Review registrations, assign roles and tenants, activate accounts"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition shadow-xs ${
              filter === 'pending'
                ? 'bg-[#165239] text-white border border-[#165239]'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Pending Approvals
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition shadow-xs ${
              filter === 'all'
                ? 'bg-[#165239] text-white border border-[#165239]'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            All Registered Users
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200/70 text-red-700 text-xs font-medium px-4 py-3">
            {error}
          </div>
        )}
        {actionMsg && (
          <div className="rounded-2xl bg-[#f0f7f4] border border-[#c2decf]/80 text-[#165239] text-xs font-semibold px-4 py-3">
            {actionMsg}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200/70 shadow-card">
            Loading university user directory…
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Organization</th>
                    <th className="px-5 py-3.5">Verified</th>
                    <th className="px-5 py-3.5">Approval</th>
                    <th className="px-5 py-3.5">Active</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                        No users found in this directory view
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="px-5 py-3.5 text-slate-500">{u.organizationName || '—'}</td>
                      <td className="px-5 py-3.5">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#165239] border border-emerald-200/60">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            u.approvalStatus === 'approved'
                              ? 'bg-emerald-50 text-[#165239] border-emerald-200/60'
                              : u.approvalStatus === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                              : 'bg-rose-50 text-rose-700 border-rose-200/60'
                          }`}
                        >
                          {u.approvalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                            u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-slate-700 font-medium">{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {u.approvalStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-full bg-[#165239] hover:bg-[#11402c] text-white text-[11px] font-bold shadow-xs transition"
                              onClick={() => setApproveId(u.id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition"
                              onClick={() => void reject(u.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {u.approvalStatus === 'approved' && (
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition"
                            onClick={() => void toggleActive(u)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {approveId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[26px] p-6 w-full max-w-md space-y-4 shadow-xl border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base">Approve Registration</h3>
              <p className="text-xs text-slate-500">
                Assign institutional role and tenant boundary. Super Admin must specify tenant ID.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Role</label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tenant ID (Mongo ObjectId)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="e.g. 507f1f77bcf86cd799439011"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-bold rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setApproveId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-bold rounded-full bg-[#165239] hover:bg-[#11402c] text-white shadow-xs transition"
                  onClick={() => void approve(approveId)}
                >
                  Confirm Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}

export default UserManagementPage;
