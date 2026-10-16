import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthTokens, Permission, ResourceType, PermissionAction, SystemRole } from '@university-lms/shared';

export interface DemoPersona {
  role: SystemRole;
  label: string;
  name: string;
  title: string;
  email: string;
  department: string;
  avatar: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    name: 'Dr. Alexander Wright',
    title: 'Global Platform Administrator',
    email: 'admin@platform.edu',
    department: 'Central IT & Cloud Governance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'university_admin',
    label: 'University Admin',
    name: 'Dr. Elizabeth Vance',
    title: 'Provost & Academic Vice Chancellor',
    email: 'provost@northridge.edu',
    department: 'University Executive Council',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'registrar',
    label: 'Registrar',
    name: 'Marcus Holloway',
    title: 'Chief Registrar & Records Officer',
    email: 'registrar@northridge.edu',
    department: 'Office of Academic Records',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'faculty',
    label: 'Faculty',
    name: 'Prof. Elena Rostova',
    title: 'Professor & Course Director',
    email: 'faculty.cs@northridge.edu',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'student',
    label: 'Student',
    name: 'Jordan Hayes',
    title: 'B.Tech CSE — Semester 5 (Roll #2023CSE0101)',
    email: 'student.cs23@northridge.edu',
    department: 'Undergraduate Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'department_head',
    label: 'Department Head',
    name: 'Prof. Vikram Malhotra',
    title: 'Head of Department (HOD)',
    email: 'hod.cse@northridge.edu',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'exam_controller',
    label: 'Exam Controller',
    name: 'Dr. Sarah Jenkins',
    title: 'Controller of Examinations',
    email: 'exam.controller@northridge.edu',
    department: 'Evaluation & Degree Certification',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'finance',
    label: 'Finance / Bursar',
    name: 'Jonathan Sterling',
    title: 'Bursar & Chief Financial Officer',
    email: 'finance@northridge.edu',
    department: 'Treasury, Billing & Financial Aid',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    role: 'librarian',
    label: 'Librarian',
    name: 'Margaret Atwood',
    title: 'Chief University Librarian',
    email: 'librarian@northridge.edu',
    department: 'Central Digital & Archival Library',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
];

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  loginWithDemoUser: (role: SystemRole, tenantId?: string) => void;
  isAuthenticated: () => boolean;
  hasPermission: (resource: ResourceType, action: PermissionAction) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

function isRealToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return !token.startsWith('demo-');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,

      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
        }),

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),

      loginWithDemoUser: (role, tenantId = 't-northridge') => {
        const persona = DEMO_PERSONAS.find((p) => p.role === role) || DEMO_PERSONAS[0];
        const names = persona.name.split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ');

        const mockUser: AuthUser = {
          id: `usr-${role}-${Date.now()}`,
          tenantId: role === 'super_admin' ? null : tenantId,
          email: persona.email,
          firstName,
          lastName,
          roles: [role],
          permissions: [
            { resource: 'university', action: 'manage' },
            { resource: 'campus', action: 'manage' },
            { resource: 'student', action: 'manage' },
            { resource: 'faculty', action: 'manage' },
            { resource: 'course', action: 'manage' },
            { resource: 'assignment', action: 'manage' },
            { resource: 'attendance', action: 'manage' },
            { resource: 'grade', action: 'manage' },
            { resource: 'exam', action: 'manage' },
            { resource: 'analytics', action: 'manage' },
            { resource: 'user', action: 'manage' },
          ],
        };

        const mockTokens: AuthTokens = {
          accessToken: `demo-token-${role}-${Date.now()}`,
          refreshToken: `demo-refresh-${role}-${Date.now()}`,
          expiresIn: 3600 * 24 * 7,
        };

        set({
          user: mockUser,
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          expiresAt: Date.now() + mockTokens.expiresIn * 1000,
        });
      },

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return Boolean(user && isRealToken(accessToken));
      },

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes('super_admin')) return true;
        return user.permissions.some(
          (p: Permission) =>
            p.resource === resource && (p.action === action || p.action === 'manage')
        );
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.some((r) => user.roles.includes(r as never));
      },
    }),
    {
      name: 'ul-auth-v2',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      }),
    }
  )
);
