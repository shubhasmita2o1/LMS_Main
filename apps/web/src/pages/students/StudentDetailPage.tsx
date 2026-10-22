import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, FileText, Trash2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import type { ApiResponse, StudentPublic, StudentDocumentPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge, Avatar } from '../../components/ui';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [docForm, setDocForm] = useState({
    type: 'id_proof',
    fileName: '',
    fileUrl: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['students', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentPublic>>(`/students/${id}`);
      return data.data!;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['students', id, 'documents'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentDocumentPublic[]>>(`/students/${id}/documents`);
      return data.data || [];
    },
  });

  const statusMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/students/${id}/status`, { status });
      if (!data.success) throw new Error(data.error?.message || 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', id] });
      setMessage('Status updated successfully');
    },
  });

  const addDocMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/students/${id}/documents`, docForm);
      if (!data.success) throw new Error(data.error?.message || 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', id, 'documents'] });
      setDocForm({ type: 'id_proof', fileName: '', fileUrl: '' });
      setMessage('Document added successfully');
    },
  });

  const delDocMut = useMutation({
    mutationFn: (docId: string) => api.delete(`/students/${id}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', id, 'documents'] }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <PageShell>
          <div className="py-20 text-center text-slate-400 font-medium">
            Loading student profile…
          </div>
        </PageShell>
      </AppLayout>
    );
  }

  if (error || !student) {
    return (
      <AppLayout>
        <PageShell>
          <SurfaceCard className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Student Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">The student record could not be located.</p>
            <PillButton variant="outline" href="/students" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Students Directory
            </PillButton>
          </SurfaceCard>
        </PageShell>
      </AppLayout>
    );
  }

  const fullName = `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`;

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title="Student Record"
          subtitle={`Enrollment ID: ${student.enrollmentNumber}`}
          badge={<StatusBadge status={student.status === 'active' ? 'success' : 'neutral'} label={student.status} />}
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/students" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Directory
              </PillButton>
              <Can resource="student" action="update">
                <PillButton variant="primary" href={`/students/${id}/edit`} leftIcon={<Edit3 className="w-4 h-4" />}>
                  Edit Profile
                </PillButton>
              </Can>
            </div>
          }
        />

        {message && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#165239] bg-[#f0f7f4] border border-[#c2decf]/80 rounded-2xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#165239]" />
            <span>{message}</span>
          </div>
        )}

        {/* Hero Card */}
        <SurfaceCard>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar name={fullName} src={student.photoUrl || undefined} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                <StatusBadge status={student.status === 'active' ? 'success' : 'neutral'} label={student.status} />
                {student.enrollmentStatus && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {student.enrollmentStatus}
                  </span>
                )}
                {student.admissionType && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#165239] border border-emerald-100">
                    {student.admissionType}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-slate-500">Enrollment: {student.enrollmentNumber}</p>
            </div>
          </div>
        </SurfaceCard>

        {/* Details Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          <SurfaceCard title="Contact Information">
            <div className="space-y-3">
              <DetailRow label="Official Email" value={student.email} />
              <DetailRow label="Phone" value={student.phone} />
              <DetailRow label="Gender" value={student.gender} />
              <DetailRow label="Blood Group" value={student.bloodGroup} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Academic Placement">
            <div className="space-y-3">
              <DetailRow label="Program ID" value={student.programId} mono />
              <DetailRow label="Batch ID" value={student.batchId} mono />
              <DetailRow label="Section ID" value={student.sectionId} mono />
              <DetailRow
                label="Admission Date"
                value={student.admissionDate ? String(student.admissionDate).slice(0, 10) : undefined}
              />
            </div>
          </SurfaceCard>
        </div>

        {/* Guardians */}
        {student.guardians && student.guardians.length > 0 && (
          <SurfaceCard title="Guardian Information">
            <div className="divide-y divide-slate-100">
              {student.guardians.map((g, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-slate-900">{g.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({g.relation})</span>
                  </div>
                  {g.phone && <span className="text-xs font-mono text-slate-600">{g.phone}</span>}
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}

        {/* Status Lifecycle Management */}
        <Can resource="student" action="manage">
          <SurfaceCard title="Student Lifecycle Status">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={status || student.status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="graduated">Graduated</option>
                <option value="alumni">Alumni</option>
              </select>
              <PillButton
                variant="primary"
                onClick={() => statusMut.mutate()}
                loading={statusMut.isPending}
              >
                Update Lifecycle Status
              </PillButton>
            </div>
          </SurfaceCard>
        </Can>

        {/* Documents */}
        <SurfaceCard title="Verified Documents & Records">
          <div className="divide-y divide-slate-100 mb-6">
            {(documents || []).map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{d.fileName}</p>
                    <p className="text-[11px] text-slate-400">
                      Type: {d.type} · Verification: {d.verificationStatus}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#165239] hover:underline px-3 py-1.5 rounded-full hover:bg-slate-50"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Can resource="student" action="update">
                    <button
                      onClick={() => delDocMut.mutate(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
                      title="Remove document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Can>
                </div>
              </div>
            ))}
            {(documents || []).length === 0 && (
              <p className="py-4 text-center text-slate-400 text-xs">No documents attached to this record.</p>
            )}
          </div>

          <Can resource="student" action="update">
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Document Record</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-full text-xs text-slate-700 bg-white"
                >
                  <option value="id_proof">ID Proof</option>
                  <option value="marksheet">Marksheet</option>
                  <option value="photo">Photo</option>
                  <option value="certificate">Certificate</option>
                  <option value="address_proof">Address Proof</option>
                  <option value="other">Other</option>
                </select>
                <input
                  placeholder="Document Name / Title"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-full text-xs text-slate-800"
                />
                <input
                  placeholder="https://document-url…"
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-full text-xs text-slate-800"
                />
              </div>
              <div className="flex justify-end pt-2">
                <PillButton
                  variant="primary"
                  onClick={() => addDocMut.mutate()}
                  loading={addDocMut.isPending}
                  disabled={!docForm.fileName || !docForm.fileUrl}
                >
                  Add Document
                </PillButton>
              </div>
            </div>
          </Can>
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`text-slate-900 font-semibold ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

