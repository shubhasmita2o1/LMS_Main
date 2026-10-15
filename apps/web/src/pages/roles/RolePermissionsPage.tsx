import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DEMO_PERSONAS } from '../../stores/authStore';
import {
  Check,
  Save,
  Lock,
  RotateCcw,
} from 'lucide-react';

const RESOURCES = [
  { key: 'students', label: 'Student SIS & Personal Records', category: 'Academic Community' },
  { key: 'faculty', label: 'Faculty Directory & Appraisals', category: 'Academic Community' },
  { key: 'admissions', label: 'Admissions Pipeline & Verification', category: 'Academic Community' },
  { key: 'courses', label: 'Curriculum & Syllabi (OBE)', category: 'Curriculum' },
  { key: 'learn', label: 'LMS Theory Learning & Video Player', category: 'Curriculum' },
  { key: 'labs', label: 'Practical Labs & Workstations', category: 'Curriculum' },
  { key: 'assessments', label: 'Continuous Assessments & Rubrics', category: 'Evaluation' },
  { key: 'examinations', label: 'Examinations, Seating & Admit Cards', category: 'Evaluation' },
  { key: 'attendance', label: 'Attendance Registers & Biometrics', category: 'Evaluation' },
  { key: 'results', label: 'Results, Gradebook & Transcripts', category: 'Evaluation' },
  { key: 'finance', label: 'Fee Structures & Invoices', category: 'Operations' },
  { key: 'library', label: 'Library Catalog & Circulation Desk', category: 'Operations' },
  { key: 'reports', label: 'Accreditation Reports (NAAC/NBA)', category: 'Governance' },
  { key: 'audit', label: 'Security Compliance Audit Trail', category: 'Governance' },
  { key: 'settings', label: 'System Configuration & Branding', category: 'Governance' },
];

const ACTIONS = ['Read', 'Create', 'Update', 'Delete', 'Approve', 'Export'];

export function RolePermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<string>('university_admin');
  const [isSaved, setIsSaved] = useState(false);

  // Initialize matrix state
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    RESOURCES.forEach((r) => {
      initial[r.key] = {
        Read: true,
        Create: true,
        Update: true,
        Delete: false,
        Approve: true,
        Export: true,
      };
    });
    return initial;
  });

  const togglePermission = (resourceKey: string, action: string) => {
    setMatrix((prev) => ({
      ...prev,
      [resourceKey]: {
        ...prev[resourceKey],
        [action]: !prev[resourceKey]?.[action],
      },
    }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    const resetState: Record<string, Record<string, boolean>> = {};
    RESOURCES.forEach((r) => {
      resetState[r.key] = {
        Read: true,
        Create: selectedRole !== 'student',
        Update: selectedRole !== 'student',
        Delete: selectedRole === 'super_admin' || selectedRole === 'university_admin',
        Approve: selectedRole !== 'student' && selectedRole !== 'faculty',
        Export: true,
      };
    });
    setMatrix(resetState);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Role-Based Access Control (RBAC) Matrix"
        subtitle="Manage granular access permissions across all 25 higher education ERP resources and 9 roles"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'RBAC Matrix' }]}
        stats={[
          { label: 'Configured Roles', value: '9 System Roles', variant: 'primary' },
          { label: 'Managed Resources', value: '25 Entities', variant: 'success' },
          { label: 'Granularity', value: '6 Action Levels', variant: 'default' },
        ]}
        primaryAction={{
          label: isSaved ? 'Saved to Database ✓' : 'Save Permission Rules',
          onClick: handleSave,
          icon: <Save className="w-4 h-4" />,
        }}
        secondaryAction={{
          label: 'Reset to System Defaults',
          onClick: handleReset,
          icon: <RotateCcw className="w-4 h-4" />,
        }}
      />

      {/* Role Picker Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {DEMO_PERSONAS.map((p) => {
            const isSelected = p.role === selectedRole;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => setSelectedRole(p.role)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permission Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Active Privilege Matrix for:{' '}
              <span className="text-primary-700 capitalize">
                {selectedRole.replace('_', ' ')}
              </span>
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click checkboxes to modify permissions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">ERP Resource Domain</th>
                {ACTIONS.map((act) => (
                  <th key={act} className="px-4 py-3.5 text-center">
                    {act}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RESOURCES.map((res) => (
                <tr key={res.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900 block text-xs">{res.label}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {res.category}
                    </span>
                  </td>
                  {ACTIONS.map((act) => {
                    const isChecked = Boolean(matrix[res.key]?.[act]);
                    return (
                      <td key={act} className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(res.key, act)}
                          className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition ${
                            isChecked
                              ? 'bg-primary-600 text-white shadow-2xs'
                              : 'border border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
export default RolePermissionsPage;
