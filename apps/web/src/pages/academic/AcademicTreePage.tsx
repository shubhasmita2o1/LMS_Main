import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, AcademicTreeNode } from '@university-lms/shared';
import { useAuth } from '../../hooks/useAuth';
import { Can } from '../../components/auth/Can';

function TreeNode({ node, depth = 0 }: { node: AcademicTreeNode; depth?: number }) {
  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-1.5 text-sm"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <span className="text-xs uppercase tracking-wide text-slate-400 w-20 shrink-0">
          {node.type}
        </span>
        <span className="font-medium text-slate-800">{node.name}</span>
        {node.code && <span className="font-mono text-xs text-slate-400">{node.code}</span>}
        {node.status && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              node.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {node.status}
          </span>
        )}
      </div>
      {node.children?.map((c) => (
        <TreeNode key={`${c.type}-${c.id}`} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export function AcademicTreePage() {
  const { user, logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['academic', 'tree'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AcademicTreeNode[]>>('/academic/tree');
      return data.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Dashboard
            </Link>
            <span className="font-semibold text-slate-900">Academic Structure</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <NavChip to="/academic" active>
            Hierarchy
          </NavChip>
          <NavChip to="/academic/departments">Departments</NavChip>
          <NavChip to="/academic/programs">Programs</NavChip>
          <NavChip to="/academic/batches">Batches & Sections</NavChip>
          <NavChip to="/academic/years">Years & Semesters</NavChip>
          <NavChip to="/academic/settings">Settings</NavChip>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hierarchy overview</h1>
            <p className="text-sm text-slate-500">
              University → Campus → School → Department → Program → Batch → Section
            </p>
          </div>
          <Can resource="university" action="create">
            <Link
              to="/academic/universities/new"
              className="text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              + University
            </Link>
          </Can>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          {isLoading && <p className="text-slate-400 text-sm">Loading hierarchy…</p>}
          {error && <p className="text-red-600 text-sm">Failed to load academic tree</p>}
          {!isLoading && data && data.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-3">No academic structure yet.</p>
              <Can resource="university" action="create">
                <Link
                  to="/academic/universities/new"
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Create your first university →
                </Link>
              </Can>
            </div>
          )}
          {data?.map((n) => (
            <TreeNode key={n.id} node={n} />
          ))}
        </div>
      </main>
    </div>
  );
}

function NavChip({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}
