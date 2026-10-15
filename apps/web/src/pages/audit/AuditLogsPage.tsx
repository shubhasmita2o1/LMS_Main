import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  Terminal,
  Clock,
  User,
  Globe,
  Activity,
  Check,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { MOCK_AUDIT_LOGS, AuditLogItem } from '../../data/mockData';

// Extended realistic audit records
const EXTENDED_AUDIT_LOGS: (AuditLogItem & {
  sessionId?: string;
  userAgent?: string;
  sha256?: string;
  diffPayload?: { before: Record<string, any>; after: Record<string, any> };
})[] = [
  ...MOCK_AUDIT_LOGS.map((log) => ({
    ...log,
    sessionId: `sess_${log.id}_99x`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0',
    sha256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
    diffPayload: {
      before: { status: 'draft', version: '1.0' },
      after: { status: 'approved', version: '2.0', approvedBy: log.actorName },
    },
  })),
  {
    id: 'aud-1405',
    timestamp: '2026-10-15 08:32:40',
    actorName: 'Dr. Sarah Jenkins',
    actorRole: 'Exam Controller',
    ipAddress: '192.168.10.15',
    action: 'UPDATE',
    resourceType: 'Examination Results',
    resourceId: 'RES-FALL26-CS301',
    details: 'Applied 5% moderation grace curve to Digital Signal Processing mid-term scores.',
    severity: 'high',
    sessionId: 'sess_aud1405_44a',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    diffPayload: {
      before: { moderationApplied: false, meanScore: 68.4 },
      after: { moderationApplied: true, meanScore: 71.8, rationale: 'Standardized difficulty adjustment' },
    },
  },
  {
    id: 'aud-1406',
    timestamp: '2026-10-15 07:14:22',
    actorName: 'David Kalu',
    actorRole: 'Finance Bursar',
    ipAddress: '192.168.12.04',
    action: 'CREATE',
    resourceType: 'Fee Scholarship',
    resourceId: 'SCHOL-2026-8841',
    details: 'Disbursed Merit Scholarship waiver of $3,500 for Student roll 2023CSE0102.',
    severity: 'medium',
    sessionId: 'sess_aud1406_82z',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/130.0.0.0',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    diffPayload: {
      before: { balanceDue: 4500, status: 'Overdue' },
      after: { balanceDue: 1000, status: 'Partial', waiverCode: 'MERIT_FALL26' },
    },
  },
  {
    id: 'aud-1407',
    timestamp: '2026-10-14 22:50:11',
    actorName: 'Security Automation Daemon',
    actorRole: 'System Bot',
    ipAddress: '127.0.0.1',
    action: 'DELETE',
    resourceType: 'Session Tokens',
    resourceId: 'BATCH_EXPIRY_CRON',
    details: 'Purged 42 expired inactive sessions older than 24 hours.',
    severity: 'low',
    sessionId: 'sess_cron_001',
    userAgent: 'LMS-Cron-Daemon/4.2.0-prod',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    diffPayload: {
      before: { activeSessions: 1482 },
      after: { activeSessions: 1440, purgedCount: 42 },
    },
  },
  {
    id: 'aud-1408',
    timestamp: '2026-10-14 18:22:05',
    actorName: 'Admin SecOps',
    actorRole: 'Super Admin',
    ipAddress: '10.0.1.50',
    action: 'UPDATE',
    resourceType: 'Security Policy',
    resourceId: 'AUTH_2FA_POLICY',
    details: 'Enforced mandatory hardware FIDO2 / Authenticator 2FA for all examination proctors.',
    severity: 'high',
    sessionId: 'sess_secops_771',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0',
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    diffPayload: {
      before: { mandatory2FA: ['super_admin'] },
      after: { mandatory2FA: ['super_admin', 'exam_controller', 'finance'] },
    },
  },
];

export function AuditLogsPage() {
  const [logs] = useState(EXTENDED_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<(typeof EXTENDED_AUDIT_LOGS)[0] | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchTerm === '' ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      const matchAction = selectedAction === 'all' || log.action === selectedAction;

      return matchSearch && matchSeverity && matchAction;
    });
  }, [logs, searchTerm, selectedSeverity, selectedAction]);

  // Statistics
  const totalEvents = logs.length;
  const highSeverityCount = logs.filter((l) => l.severity === 'high').length;
  const uniqueActors = new Set(logs.map((l) => l.actorName)).size;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Audit_Compliance_Trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const columns: Column<(typeof EXTENDED_AUDIT_LOGS)[0]>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-xs text-slate-900 font-medium whitespace-nowrap">
            {row.timestamp}
          </span>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor & Identity',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
            <User className="w-3 h-3 text-slate-400" />
            {row.actorName}
          </div>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
            {row.actorRole}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => {
        const actionColors: Record<string, string> = {
          CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          UPDATE: 'bg-sky-50 text-sky-700 border-sky-200',
          DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
          APPROVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          EXPORT: 'bg-amber-50 text-amber-700 border-amber-200',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${
              actionColors[row.action] || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {row.action}
          </span>
        );
      },
    },
    {
      key: 'resource',
      header: 'Resource Target',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{row.resourceType}</p>
          <p className="text-[11px] font-mono text-slate-500">{row.resourceId}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details & Event Summary',
      render: (row) => (
        <p className="text-xs text-slate-700 line-clamp-1 max-w-sm" title={row.details}>
          {row.details}
        </p>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP & Origin',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-xs text-slate-600">{row.ipAddress}</span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => {
        const severityStyles = {
          low: 'bg-slate-100 text-slate-700 border-slate-200',
          medium: 'bg-amber-100 text-amber-800 border-amber-200',
          high: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${
              severityStyles[row.severity as keyof typeof severityStyles] || severityStyles.low
            }`}
          >
            {row.severity}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Inspection',
      render: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-md transition"
        >
          <Eye className="w-3.5 h-3.5" />
          Diff
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader
          title="Audit Trail & Regulatory Compliance Log"
          subtitle="Cryptographically sealed, append-only immutable audit trail ensuring compliance with FERPA, GDPR, and ISO/IEC 27001 data protection mandates."
          breadcrumbs={[
            { label: 'Governance & Admin' },
            { label: 'Audit Trail' },
          ]}
          stats={[
            { label: 'Integrity Chain', value: 'HMAC-SHA256' },
            { label: 'Retention Window', value: '7 Years (Mandatory)' },
            { label: 'Tamper Protection', value: 'Append-Only Ledger' },
          ]}
          secondaryAction={{
            label: 'Export Ledger JSON',
            onClick: handleExportJSON,
            icon: <Download className="w-4 h-4 text-slate-500" />,
          }}
        />

        {/* Top Security Posture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Audit Events</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalEvents}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Delivery Rate</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">High Severity Events</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{highSeverityCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Grade changes &amp; 2FA adjustments</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Authorized Actors</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{uniqueActors}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Institutional staff &amp; daemons</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Ledger Hash Verification</p>
              <h3 className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-1">SHA-256 Chain Intact</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by actor, IP address, resource ID, or description..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>

              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="all">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="APPROVE">APPROVE</option>
                <option value="EXPORT">EXPORT</option>
              </select>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <DataTable
            data={filteredLogs}
            columns={columns}
            keyExtractor={(row) => row.id}
            exportTitle="University_Audit_Logs"
          />
        </div>

        {/* Detailed Inspection Modal with JSON Diff */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-primary-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Audit Event Record: {selectedLog.id}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Timestamp: {selectedLog.timestamp} UTC
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Event Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Actor
                    </span>
                    <span className="font-bold text-slate-900">{selectedLog.actorName}</span>
                    <span className="text-slate-500 block">({selectedLog.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Action Type
                    </span>
                    <span className="font-mono font-bold text-primary-700">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Severity
                    </span>
                    <span className="font-bold uppercase text-slate-800">{selectedLog.severity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Client IP
                    </span>
                    <span className="font-mono text-slate-800">{selectedLog.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Target Resource
                    </span>
                    <span className="font-medium text-slate-800">{selectedLog.resourceType}</span>
                    <span className="font-mono text-slate-500 block">{selectedLog.resourceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                      Session ID
                    </span>
                    <span className="font-mono text-slate-600">{selectedLog.sessionId}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Action Narrative &amp; Reason
                  </h4>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {selectedLog.details}
                  </p>
                </div>

                {/* State Before vs After Diff */}
                {selectedLog.diffPayload && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Payload State Mutation (Before &amp; After)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                        <div className="text-rose-400 font-bold mb-1 pb-1 border-b border-slate-800">
                          --- Prior State
                        </div>
                        <pre>{JSON.stringify(selectedLog.diffPayload.before, null, 2)}</pre>
                      </div>
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                        <div className="text-emerald-400 font-bold mb-1 pb-1 border-b border-slate-800">
                          +++ Applied Mutation
                        </div>
                        <pre>{JSON.stringify(selectedLog.diffPayload.after, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cryptographic Proof */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cryptographic Seal (SHA-256 Ledger Digest)
                  </h4>
                  <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-700 break-all">
                      {selectedLog.sha256}
                    </span>
                    <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> Valid
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
