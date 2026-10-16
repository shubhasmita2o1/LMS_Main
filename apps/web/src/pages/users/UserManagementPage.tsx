import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
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
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <ModuleHeader
          title="User management"
          subtitle="Review registrations, assign roles and tenants, activate accounts"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === 'pending'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === 'all'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            All users
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}
        {actionMsg && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm px-4 py-3">
            {actionMsg}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Org</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.organizationName || '—'}</td>
                    <td className="px-4 py-3">
                      {u.isEmailVerified ? (
                        <span className="text-emerald-700 text-xs font-semibold">Yes</span>
                      ) : (
                        <span className="text-amber-700 text-xs font-semibold">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase">{u.approvalStatus}</span>
                    </td>
                    <td className="px-4 py-3">{u.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                      {u.approvalStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="text-xs font-semibold text-primary-600"
                            onClick={() => setApproveId(u.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600"
                            onClick={() => void reject(u.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {u.approvalStatus === 'approved' && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-slate-600"
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
        )}

        {approveId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <h3 className="font-bold text-slate-900">Approve registration</h3>
              <p className="text-xs text-slate-500">
                Server assigns role and tenant. Super Admin must provide tenantId.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
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
                <label className="block text-sm font-medium mb-1">Tenant ID (Super Admin)</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Mongo ObjectId of tenant"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-lg border"
                  onClick={() => setApproveId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white"
                  onClick={() => void approve(approveId)}
                >
                  Confirm approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default UserManagementPage;
