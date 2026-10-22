import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore } from '../stores/authStore';
import { SuperAdminDashboard } from './dashboard/SuperAdminDashboard';
import { TenantAdminDashboard } from './dashboard/TenantAdminDashboard';
import { DepartmentHeadDashboard } from './dashboard/DepartmentHeadDashboard';
import { FacultyDashboard } from './dashboard/FacultyDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  // Determine primary active role
  const roles = user?.roles || [];
  const isSuperAdmin = roles.includes('super_admin');
  const isTenantAdmin = roles.includes('tenant_admin') || roles.includes('university_admin');
  const isDeptHead = roles.includes('department_head');
  const isFaculty = roles.includes('faculty');

  return (
    <AppLayout>
      {isSuperAdmin ? (
        <SuperAdminDashboard />
      ) : isTenantAdmin ? (
        <TenantAdminDashboard />
      ) : isDeptHead ? (
        <DepartmentHeadDashboard />
      ) : isFaculty ? (
        <FacultyDashboard />
      ) : (
        <StudentDashboard />
      )}
    </AppLayout>
  );
}
