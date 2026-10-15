import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { DEMO_PERSONAS } from '../../stores/authStore';
import {
  KeyRound,
  Plus,
  Lock,
  X,
} from 'lucide-react';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  twoFactorEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Invited';
  lastLogin: string;
  avatar: string;
}

const MOCK_USERS: UserAccount[] = DEMO_PERSONAS.map((p, idx) => ({
  id: `usr-${idx + 1}`,
  name: p.name,
  email: p.email,
  role: p.label,
  department: p.department,
  twoFactorEnabled: idx % 2 === 0,
  status: 'Active',
  lastLogin: idx === 0 ? '5 mins ago' : idx === 1 ? '1 hour ago' : 'Yesterday',
  avatar: p.avatar,
}));

export function UserManagementPage() {
  const [userList, setUserList] = useState<UserAccount[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Faculty',
    department: 'Computer Science & Engineering',
  });

  const columns: Column<UserAccount>[] = [
    {
      key: 'name',
      header: 'User Account',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <img
            src={u.avatar}
            alt={u.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="font-bold text-slate-900 block truncate">{u.name}</span>
            <span className="text-xs text-slate-400 truncate block">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (u) => (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
          {u.role}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department / Scope',
      sortable: true,
      render: (u) => <span className="text-xs text-slate-700 font-medium">{u.department}</span>,
    },
    {
      key: 'twoFactorEnabled',
      header: '2FA Security',
      sortable: true,
      render: (u) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            u.twoFactorEnabled
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {u.twoFactorEnabled ? '2FA Active ✓' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Active',
      sortable: true,
      render: (u) => <span className="text-xs text-slate-500">{u.lastLogin}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase">
          {u.status}
        </span>
      ),
    },
  ];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      twoFactorEnabled: false,
      status: 'Invited',
      lastLogin: 'Never',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    };
    setUserList([newUser, ...userList]);
    setIsInviteOpen(false);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="User Accounts & Identity Directory"
        subtitle="Manage faculty, student, staff, and administration platform logins with SAML 2.0 & multi-factor authentication"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Users' }]}
        stats={[
          { label: 'Total Users', value: userList.length, variant: 'primary' },
          { label: '2FA Enforced', value: '84%', variant: 'success' },
          { label: 'Active Sessions', value: '142', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Invite User Account',
          onClick: () => setIsInviteOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={userList}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search users by name, email, or role..."
        exportTitle="users_directory"
        onRowClick={(u) => {
          setSelectedUser(u);
          setIsDetailOpen(true);
        }}
      />

      {/* User Detail Drawer */}
      {selectedUser && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedUser.name}
          subtitle={`${selectedUser.email} • ${selectedUser.role}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedUser.status}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Department:</span>
                <strong className="text-slate-800">{selectedUser.department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Multi-Factor Status:</span>
                <strong className="text-slate-800">
                  {selectedUser.twoFactorEnabled ? 'FIDO2 / TOTP Enabled' : 'Not Configured'}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Send Password Reset Email</span>
              </button>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-rose-500" />
                <span>Force Sign Out All Active Sessions</span>
              </button>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Invite User Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Invite Institutional User</h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prof. Arthur Pendelton"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@northridge.edu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Student">Student</option>
                    <option value="Registrar">Registrar</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Exam Controller">Exam Controller</option>
                    <option value="Finance">Finance / Bursar</option>
                    <option value="Librarian">Librarian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default UserManagementPage;
