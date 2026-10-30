import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import {
  listLibraryItems,
  createLibraryItem,
  listLoans,
  createLoan,
  returnLoan,
  listFines,
  waiveFine,
  createReservation,
  listReservations,
} from '../../lib/libraryApi';
import type {
  LibraryItemPublic,
  LibraryLoanPublic,
  LibraryFinePublic,
  LibraryReservationPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { BookOpen, Plus, RotateCcw, Search } from 'lucide-react';

type Tab = 'catalog' | 'loans' | 'fines' | 'reservations';

export function LibraryPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles || [];
  const isStudent =
    roles.includes('student') &&
    !roles.some((r) => ['tenant_admin', 'university_admin', 'librarian', 'staff'].includes(r));
  const canManage = roles.some((r) =>
    ['tenant_admin', 'university_admin', 'librarian', 'super_admin'].includes(r)
  );
  const canCirculate = canManage || roles.includes('staff') || roles.includes('librarian');

  const [tab, setTab] = useState<Tab>('catalog');
  const [items, setItems] = useState<LibraryItemPublic[]>([]);
  const [loans, setLoans] = useState<LibraryLoanPublic[]>([]);
  const [fines, setFines] = useState<LibraryFinePublic[]>([]);
  const [reservations, setReservations] = useState<LibraryReservationPublic[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showLoan, setShowLoan] = useState<LibraryItemPublic | null>(null);
  const [form, setForm] = useState({
    title: '',
    authors: '',
    isbn: '',
    totalCopies: 1,
    shelf: '',
  });
  const [loanForm, setLoanForm] = useState({ studentId: '', loanDays: 14 });

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLibraryItems({ q: q || undefined, limit: 50 });
      setItems(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [q]);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLoans();
      setLoans(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFines();
      setFines(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load fines');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReservations();
      setReservations(data.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'catalog') loadCatalog();
    else if (tab === 'loans') loadLoans();
    else if (tab === 'fines') loadFines();
    else loadReservations();
  }, [tab, loadCatalog, loadLoans, loadFines, loadReservations]);

  const catalogColumns: Column<LibraryItemPublic>[] = [
    {
      key: 'title',
      header: 'Title & Authors',
      sortable: true,
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 block">{b.title}</span>
          <span className="text-xs text-slate-500">{(b.authors || []).join(', ')}</span>
        </div>
      ),
    },
    {
      key: 'isbn',
      header: 'ISBN',
      render: (b) => <span className="font-mono text-xs">{b.isbn || '—'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (b) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 capitalize">{b.type}</span>
      ),
    },
    {
      key: 'availableCopies',
      header: 'Availability',
      render: (b) => (
        <span className="text-xs font-bold">
          {b.availableCopies} / {b.totalCopies}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <div className="flex gap-2">
          {canCirculate && b.availableCopies > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-emerald-700 hover:underline"
              onClick={() => setShowLoan(b)}
            >
              Issue
            </button>
          )}
          {isStudent && b.availableCopies <= 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-sky-700 hover:underline"
              onClick={async () => {
                try {
                  await createReservation(b.id);
                  alert('Reservation placed');
                } catch (e: any) {
                  alert(e?.response?.data?.message || e.message);
                }
              }}
            >
              Reserve
            </button>
          )}
        </div>
      ),
    },
  ];

  const loanColumns: Column<LibraryLoanPublic>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (l) => <span className="font-medium text-sm">{l.item?.title || l.itemId}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
            l.status === 'overdue'
              ? 'bg-red-100 text-red-800'
              : l.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {l.status}
        </span>
      ),
    },
    {
      key: 'dueAt',
      header: 'Due',
      render: (l) => <span className="text-xs">{new Date(l.dueAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (l) =>
        canCirculate && (l.status === 'active' || l.status === 'overdue') ? (
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
            onClick={async () => {
              try {
                await returnLoan(l.id);
                loadLoans();
                loadCatalog();
              } catch (e: any) {
                alert(e?.response?.data?.message || e.message);
              }
            }}
          >
            <RotateCcw className="w-3 h-3" /> Return
          </button>
        ) : null,
    },
  ];

  const fineColumns: Column<LibraryFinePublic>[] = [
    {
      key: 'reason',
      header: 'Reason',
      render: (f) => <span className="text-sm">{f.reason}</span>,
    },
    {
      key: 'amountMinor',
      header: 'Amount',
      render: (f) => (
        <span className="font-mono text-sm">
          {(f.amountMinor / 100).toFixed(2)} {f.currency}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => (
        <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100">
          {f.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (f) =>
        canManage && f.status === 'pending' ? (
          <button
            type="button"
            className="text-xs font-semibold text-amber-700 hover:underline"
            onClick={async () => {
              try {
                await waiveFine(f.id);
                loadFines();
              } catch (e: any) {
                alert(e?.response?.data?.message || e.message);
              }
            }}
          >
            Waive
          </button>
        ) : (
          <span className="text-xs text-slate-400">Record only</span>
        ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader
          title="Library"
          subtitle="Catalog, circulation, reservations & fines (payment in Phase 15)"
          icon={BookOpen}
        />
        <div className="flex flex-wrap gap-2 items-center">
          {(['catalog', 'loans', 'fines', 'reservations'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${
                tab === t ? 'bg-[#165239] text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
          {tab === 'catalog' && (
            <div className="ml-auto flex gap-2 items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
                <input
                  className="pl-8 pr-3 py-2 text-sm border rounded-lg w-56"
                  placeholder="Search title, author, ISBN"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadCatalog()}
                />
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#165239] text-white text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add item
                </button>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
        )}
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : tab === 'catalog' ? (
          <DataTable columns={catalogColumns} data={items} keyField="id" />
        ) : tab === 'loans' ? (
          <DataTable columns={loanColumns} data={loans} keyField="id" />
        ) : tab === 'fines' ? (
          <DataTable columns={fineColumns} data={fines} keyField="id" />
        ) : (
          <DataTable
            columns={[
              {
                key: 'item',
                header: 'Item',
                render: (r: LibraryReservationPublic) => (
                  <span className="text-sm font-medium">{r.item?.title || r.itemId}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r: LibraryReservationPublic) => <span className="text-xs capitalize">{r.status}</span>,
              },
              {
                key: 'queuedAt',
                header: 'Queued',
                render: (r: LibraryReservationPublic) => (
                  <span className="text-xs">{new Date(r.queuedAt).toLocaleString()}</span>
                ),
              },
            ]}
            data={reservations}
            keyField="id"
          />
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Add library item</h3>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Authors (comma separated)" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} className="border rounded-lg px-3 py-2 text-sm" placeholder="Copies" value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value) })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Shelf" value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 text-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold"
                onClick={async () => {
                  try {
                    await createLibraryItem({
                      title: form.title,
                      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
                      isbn: form.isbn || null,
                      type: 'book',
                      totalCopies: form.totalCopies,
                      shelf: form.shelf || null,
                    } as any);
                    setShowAdd(false);
                    loadCatalog();
                  } catch (e: any) {
                    alert(e?.response?.data?.message || e.message);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Issue loan</h3>
            <p className="text-sm text-slate-600">{showLoan.title}</p>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Student ID" value={loanForm.studentId} onChange={(e) => setLoanForm({ ...loanForm, studentId: e.target.value })} />
            <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Loan days" value={loanForm.loanDays} onChange={(e) => setLoanForm({ ...loanForm, loanDays: Number(e.target.value) })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 text-sm" onClick={() => setShowLoan(null)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold"
                onClick={async () => {
                  try {
                    await createLoan({ itemId: showLoan.id, studentId: loanForm.studentId, loanDays: loanForm.loanDays });
                    setShowLoan(null);
                    loadCatalog();
                    loadLoans();
                  } catch (e: any) {
                    alert(e?.response?.data?.message || e.message);
                  }
                }}
              >
                Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
