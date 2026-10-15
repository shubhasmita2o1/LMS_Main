import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_TENANTS, MOCK_CAMPUSES, type Tenant, type Campus } from '../data/mockData';

interface TenantState {
  currentTenant: Tenant;
  currentCampus: Campus;
  academicYear: string;
  currentTerm: string;
  theme: 'light' | 'dark';
  tenants: Tenant[];
  campuses: Campus[];
  setTenant: (tenant: Tenant) => void;
  setCampus: (campus: Campus) => void;
  setAcademicYear: (year: string) => void;
  setTerm: (term: string) => void;
  toggleTheme: () => void;
  getCampusesForTenant: (tenantId: string) => Campus[];
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: MOCK_TENANTS[0],
      currentCampus: MOCK_CAMPUSES[0],
      academicYear: 'AY 2026 - 2027',
      currentTerm: 'Fall Semester',
      theme: 'light',
      tenants: MOCK_TENANTS,
      campuses: MOCK_CAMPUSES,

      setTenant: (tenant) => {
        const tenantCampuses = get().campuses.filter((c) => c.tenantId === tenant.id);
        const mainCampus = tenantCampuses.find((c) => c.isMainCampus) || tenantCampuses[0] || get().currentCampus;
        set({ currentTenant: tenant, currentCampus: mainCampus });
      },

      setCampus: (campus) => set({ currentCampus: campus }),

      setAcademicYear: (academicYear) => set({ academicYear }),

      setTerm: (currentTerm) => set({ currentTerm }),

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme: next });
      },

      getCampusesForTenant: (tenantId) => {
        return get().campuses.filter((c) => c.tenantId === tenantId);
      },
    }),
    {
      name: 'ulms-tenant-context',
    }
  )
);
