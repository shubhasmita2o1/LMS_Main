import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_LIBRARY, type LibraryItem } from '../../data/mockData';
import {
  BookmarkCheck,
  X,
} from 'lucide-react';

export function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>(MOCK_LIBRARY);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);

  const [issueData, setIssueData] = useState({
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    dueDate: '2026-10-29',
  });

  const columns: Column<LibraryItem>[] = [
    {
      key: 'title',
      header: 'Title & Author',
      sortable: true,
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 block">{b.title}</span>
          <span className="text-xs text-slate-500">{b.author}</span>
        </div>
      ),
    },
    {
      key: 'isbn',
      header: 'ISBN / Accession #',
      sortable: true,
      render: (b) => <span className="font-mono text-xs text-primary-700">{b.isbn}</span>,
    },
    {
      key: 'category',
      header: 'Classification',
      sortable: true,
      render: (b) => (
        <span className="text-xs font-medium text-slate-700 px-2 py-0.5 rounded bg-slate-100">
          {b.category}
        </span>
      ),
    },
    {
      key: 'shelfLocation',
      header: 'Shelf / Stack Location',
      sortable: true,
      render: (b) => (
        <span className="text-xs font-semibold text-slate-800">{b.shelfLocation}</span>
      ),
    },
    {
      key: 'availableCopies',
      header: 'Availability',
      sortable: true,
      render: (b) => (
        <div>
          <span className="text-xs font-bold text-slate-900">
            {b.availableCopies} / {b.totalCopies} Available
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (b) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            b.status === 'Available'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {b.status}
        </span>
      ),
    },
  ];

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && selectedItem.availableCopies > 0) {
      setItems((prev) =>
        prev.map((b) =>
          b.id === selectedItem.id
            ? {
                ...b,
                availableCopies: b.availableCopies - 1,
                status: b.availableCopies - 1 === 0 ? 'Out of Stock' : 'Available',
              }
            : b
        )
      );
    }
    setIsIssueOpen(false);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Central Library & Digital Repository"
        subtitle="Manage physical monograph circulation, e-book subscriptions, ACM/IEEE digital libraries, and return fines"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Library' }]}
        stats={[
          { label: 'Monograph Titles', value: '48,500', variant: 'primary' },
          { label: 'E-Books & Journals', value: '120,000+', variant: 'success' },
          { label: 'Books Circulated', value: '1,840 Active', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Circulation Desk: Issue Book',
          onClick: () => {
            if (items.length > 0) {
              setSelectedItem(items[0]);
              setIsIssueOpen(true);
            }
          },
          icon: <BookmarkCheck className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search catalog by title, author, or ISBN..."
        exportTitle="library_catalog"
        onRowClick={(b) => {
          setSelectedItem(b);
          setIsDetailOpen(true);
        }}
      />

      {/* Library Detail Drawer */}
      {selectedItem && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedItem.title}
          subtitle={`By ${selectedItem.author} • ${selectedItem.isbn}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedItem.type}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Stack Location</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedItem.shelfLocation}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Copies In Stock</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedItem.availableCopies} Available ({selectedItem.totalCopies} Total)
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedItem.availableCopies === 0}
              onClick={() => {
                setIsDetailOpen(false);
                setIsIssueOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition disabled:opacity-50"
            >
              Issue Monograph to Student / Faculty
            </button>
          </div>
        </DetailDrawer>
      )}

      {/* Issue Book Modal */}
      {isIssueOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Circulation: Issue Book</h3>
              <button
                type="button"
                onClick={() => setIsIssueOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block">Book Title:</span>
                <strong className="text-slate-900">{selectedItem.title}</strong>
                <span className="text-slate-500 block mt-0.5 font-mono">{selectedItem.isbn}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Borrower Roll No</label>
                  <input
                    type="text"
                    required
                    value={issueData.studentRollNo}
                    onChange={(e) => setIssueData({ ...issueData, studentRollNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Return Date</label>
                  <input
                    type="date"
                    required
                    value={issueData.dueDate}
                    onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default LibraryPage;
