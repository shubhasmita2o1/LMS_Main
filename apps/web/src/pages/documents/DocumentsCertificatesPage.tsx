import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import {
  Award,
  Printer,
  QrCode,
  ShieldCheck,
  Plus,
  X,
} from 'lucide-react';

interface IssuedCertificate {
  id: string;
  certNo: string;
  studentName: string;
  studentRollNo: string;
  certType: 'Degree Certificate' | 'Bonafide Letter' | 'Provisional Certificate' | 'Transfer Certificate';
  issueDate: string;
  verifiedStatus: 'Verified & Active' | 'Revoked';
}

const MOCK_CERTIFICATES: IssuedCertificate[] = [
  { id: '1', certNo: 'NRU-DEG-2026-0041', studentName: 'Zoe Washington', studentRollNo: '2022CSE0045', certType: 'Degree Certificate', issueDate: '2026-08-15', verifiedStatus: 'Verified & Active' },
  { id: '2', certNo: 'NRU-BON-2026-1189', studentName: 'Jordan Hayes', studentRollNo: '2023CSE0101', certType: 'Bonafide Letter', issueDate: '2026-10-10', verifiedStatus: 'Verified & Active' },
  { id: '3', certNo: 'NRU-PRV-2026-0412', studentName: 'Aarav Patel', studentRollNo: '2023CSE0102', certType: 'Provisional Certificate', issueDate: '2026-09-28', verifiedStatus: 'Verified & Active' },
  { id: '4', certNo: 'NRU-TRF-2026-0082', studentName: 'David Kim', studentRollNo: '2024CSE0210', certType: 'Transfer Certificate', issueDate: '2026-09-14', verifiedStatus: 'Verified & Active' },
];

export function DocumentsCertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>(MOCK_CERTIFICATES);
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(MOCK_CERTIFICATES[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentName: 'Jordan Hayes',
    studentRollNo: '2023CSE0101',
    certType: 'Bonafide Letter' as IssuedCertificate['certType'],
  });

  const columns: Column<IssuedCertificate>[] = [
    {
      key: 'certNo',
      header: 'Certificate ID',
      sortable: true,
      render: (c) => <span className="font-mono text-xs font-bold text-primary-700">{c.certNo}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Roll No',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-bold text-slate-900 block">{c.studentName}</span>
          <span className="text-xs text-slate-400 font-mono">{c.studentRollNo}</span>
        </div>
      ),
    },
    {
      key: 'certType',
      header: 'Document Type',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
          {c.certType}
        </span>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      sortable: true,
      render: (c) => <span className="text-xs text-slate-600">{c.issueDate}</span>,
    },
    {
      key: 'verifiedStatus',
      header: 'Cryptographic Status',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{c.verifiedStatus}</span>
        </span>
      ),
    },
  ];

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCert: IssuedCertificate = {
      id: String(Date.now()),
      certNo: `NRU-CRT-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      studentName: formData.studentName,
      studentRollNo: formData.studentRollNo,
      certType: formData.certType,
      issueDate: '2026-10-15',
      verifiedStatus: 'Verified & Active',
    };
    setCertificates([newCert, ...certificates]);
    setSelectedCert(newCert);
    setIsGenerateOpen(false);
    setIsPreviewOpen(true);
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Official Documents, Degrees & Verifications"
        subtitle="Generate tamper-proof university degrees, bonafide letters, transcripts, and cryptographic QR certificates"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Documents & Certificates' }]}
        stats={[
          { label: 'Certificates Issued', value: '8,420', variant: 'primary' },
          { label: 'Online Verification', value: '100% Active', variant: 'success' },
          { label: 'Revocation Rate', value: '0.0%', variant: 'default' },
        ]}
        primaryAction={{
          label: 'Issue Document / Certificate',
          onClick: () => setIsGenerateOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={certificates}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search certificates by student name, roll no, or cert ID..."
        exportTitle="issued_certificates_registry"
        onRowClick={(c) => {
          setSelectedCert(c);
          setIsPreviewOpen(true);
        }}
      />

      {/* Official Certificate Preview Modal */}
      {isPreviewOpen && selectedCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-800">Verified Certificate Document View</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Canvas */}
            <div className="p-10 border-8 border-double border-primary-900/20 m-4 rounded-2xl bg-amber-50/20 text-center space-y-6">
              <div>
                <Award className="w-12 h-12 text-primary-700 mx-auto mb-2" />
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                  Northridge University
                </h2>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Boston, Massachusetts • Established 1968
                </p>
              </div>

              <div className="py-2">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                  This is to certify that
                </span>
                <h3 className="text-xl font-bold text-slate-900 underline decoration-primary-500 underline-offset-4">
                  {selectedCert.studentName}
                </h3>
                <span className="text-xs font-mono text-slate-500 block mt-1">
                  Roll No: {selectedCert.studentRollNo}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
                has successfully fulfilled all institutional requirements prescribed by the Academic Senate for the award of the{' '}
                <strong className="text-slate-900 font-bold">{selectedCert.certType}</strong> with distinction in Computer Science & Engineering.
              </p>

              <div className="flex justify-between items-end pt-8 text-xs text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold block text-slate-900">
                      {selectedCert.certNo}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Issued: {selectedCert.issueDate}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700 block text-[11px]">Chancellor & Registrar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Issue Verified Certificate</h3>
              <button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="p-5 space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Type</label>
                <select
                  value={formData.certType}
                  onChange={(e) => setFormData({ ...formData, certType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Bonafide Letter">Bonafide Student Certificate</option>
                  <option value="Degree Certificate">Official Degree Certificate</option>
                  <option value="Provisional Certificate">Provisional Passing Certificate</option>
                  <option value="Transfer Certificate">Transfer / Migration Certificate</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Generate & Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default DocumentsCertificatesPage;
