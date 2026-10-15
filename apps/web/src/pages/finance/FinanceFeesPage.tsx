import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_FEES, type FeeInvoice } from '../../data/mockData';
import {
  Printer,
  Plus,
  X,
} from 'lucide-react';

export function FinanceFeesPage() {
  const [invoices, setInvoices] = useState<FeeInvoice[]>(MOCK_FEES);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState({
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    program: 'B.Tech CSE',
    semester: 'Semester 5',
    amount: 8500,
    dueDate: '2026-11-20',
    category: 'Tuition' as FeeInvoice['category'],
  });

  const columns: Column<FeeInvoice>[] = [
    {
      key: 'invoiceNo',
      header: 'Invoice #',
      sortable: true,
      render: (f) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900 block">{f.invoiceNo}</span>
          <span className="text-[11px] text-slate-400">{f.category}</span>
        </div>
      ),
    },
    {
      key: 'studentName',
      header: 'Student & Program',
      sortable: true,
      render: (f) => (
        <div>
          <span className="font-bold text-slate-900 block">{f.studentName}</span>
          <span className="text-xs font-mono text-primary-700">
            {f.studentRollNo} • {f.program}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Total Demanded',
      sortable: true,
      render: (f) => (
        <span className="text-xs font-bold text-slate-900">${f.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid Amount',
      sortable: true,
      render: (f) => (
        <span className="text-xs font-bold text-emerald-700">${f.paidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (f) => <span className="text-xs text-slate-600">{f.dueDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (f) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            f.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : f.status === 'Partially Paid'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
          }`}
        >
          {f.status}
        </span>
      ),
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv: FeeInvoice = {
      id: `fee-${Date.now()}`,
      invoiceNo: `INV-2026-00${Math.floor(Math.random() * 900 + 100)}`,
      studentRollNo: formData.studentRollNo,
      studentName: formData.studentName,
      program: formData.program,
      semester: formData.semester,
      amount: Number(formData.amount),
      dueDate: formData.dueDate,
      paidAmount: 0,
      status: 'Overdue',
      category: formData.category,
    };
    setInvoices([newInv, ...invoices]);
    setIsCreateOpen(false);
  };

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter === 'All') return true;
    return i.status === statusFilter;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Finance, Tuition Fees & Scholarship Ledger"
        subtitle="Manage student fee schedules, invoice reconciliation, online payment receipts, and financial aid grants"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance & Fees' }]}
        stats={[
          { label: 'Total Invoiced', value: '$14.2M', variant: 'primary' },
          { label: 'Collected Rate', value: '92.6%', variant: 'success' },
          { label: 'Outstanding Dues', value: '$1.1M', variant: 'danger' },
          { label: 'Scholarships Awarded', value: '$850k', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Generate Fee Invoice',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(f) => f.id}
        searchPlaceholder="Search invoices by student name, roll no, or invoice #..."
        exportTitle="fee_invoices_ledger"
        onRowClick={(f) => {
          setSelectedInvoice(f);
          setIsDetailOpen(true);
        }}
        filterComponent={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Filter Status:</span>
            {['All', 'Paid', 'Partially Paid', 'Overdue'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      />

      {/* Invoice Detail Drawer */}
      {selectedInvoice && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Invoice: ${selectedInvoice.invoiceNo}`}
          subtitle={`${selectedInvoice.studentName} (${selectedInvoice.studentRollNo})`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedInvoice.status}
            </span>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Invoice Category:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.category}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Semester Period:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.semester}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-rose-600">{selectedInvoice.dueDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Payment Reconciliation Ledger
              </h4>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Total Amount Invoiced:</span>
                <span className="font-bold text-slate-900">${selectedInvoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>${selectedInvoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-700 font-extrabold pt-2 border-t border-slate-100">
                <span>Remaining Balance Due:</span>
                <span>${(selectedInvoice.amount - selectedInvoice.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official University Fee Receipt</span>
            </button>
          </div>
        </DetailDrawer>
      )}

      {/* Generate Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Generate Student Fee Invoice</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll No</label>
                  <input
                    type="text"
                    required
                    value={formData.studentRollNo}
                    onChange={(e) => setFormData({ ...formData, studentRollNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fee Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Tuition">Tuition Fee</option>
                    <option value="Hostel & Mess">Hostel & Mess</option>
                    <option value="Lab & Library">Lab & Library Deposit</option>
                    <option value="Examination">Examination Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Issue Invoice Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default FinanceFeesPage;
