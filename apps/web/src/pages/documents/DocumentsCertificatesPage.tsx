import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { FileText, QrCode } from 'lucide-react';
import {
  listTranscripts,
  generateTranscript,
  issueTranscript,
  revokeTranscript,
  listCertificates,
  createCertificate,
  issueCertificate,
  revokeCertificate,
} from '../../lib/transcriptApi';
import { useAuthStore } from '../../stores/authStore';
import type { CertificateType } from '@university-lms/shared';
import { api } from '../../lib/api';

export function DocumentsCertificatesPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = (user?.roles || []).some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'registrar'].includes(r)
  );

  const [studentId, setStudentId] = useState('');
  const [certForm, setCertForm] = useState({
    studentId: '',
    type: 'bonafide' as CertificateType,
    title: 'Bonafide Certificate',
    programName: '',
    yearLabel: '',
  });

  const transcriptsQ = useQuery({
    queryKey: ['transcripts', studentId],
    queryFn: () => listTranscripts(isAdmin && studentId ? { studentId } : undefined),
  });
  const certsQ = useQuery({
    queryKey: ['certificates'],
    queryFn: () => listCertificates(),
  });
  const studentsQ = useQuery({
    queryKey: ['students', 'mini'],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { limit: 50 } });
      return (data.data?.items || data.data || []) as Array<{
        id: string;
        firstName?: string;
        lastName?: string;
        rollNumber?: string;
      }>;
    },
    enabled: isAdmin,
  });

  const genMut = useMutation({
    mutationFn: () => generateTranscript(studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transcripts'] }),
  });
  const issueTrMut = useMutation({
    mutationFn: issueTranscript,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transcripts'] }),
  });
  const revokeTrMut = useMutation({
    mutationFn: revokeTranscript,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transcripts'] }),
  });
  const createCertMut = useMutation({
    mutationFn: () =>
      createCertificate({
        studentId: certForm.studentId,
        type: certForm.type,
        title: certForm.title,
        programName: certForm.programName || null,
        yearLabel: certForm.yearLabel || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
  const issueCertMut = useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
  const revokeCertMut = useMutation({
    mutationFn: revokeCertificate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });

  const verifyBase = typeof window !== 'undefined' ? `${window.location.origin}/verify` : '/verify';

  return (
    <AppLayout>
      <ModuleHeader
        title="Documents & certificates"
        subtitle="Transcripts and certificates issued from published results"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Documents' }]}
        stats={[
          { label: 'Transcripts', value: transcriptsQ.data?.total ?? 0, variant: 'primary' },
          { label: 'Certificates', value: certsQ.data?.total ?? 0, variant: 'default' },
        ]}
      />

      {isAdmin && (
        <div className="mb-6 grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-4 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold">Generate transcript</h3>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select student</option>
              {(studentsQ.data || []).map((s: any) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.rollNumber || s.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!studentId || genMut.isPending}
              onClick={() => genMut.mutate()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
            >
              Generate draft from published results
            </button>
            {genMut.isError && (
              <p className="text-xs text-rose-600">Failed — ensure published gradebook results exist.</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border p-4 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold">Issue certificate</h3>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={certForm.studentId}
              onChange={(e) => setCertForm((f) => ({ ...f, studentId: e.target.value }))}
            >
              <option value="">Select student</option>
              {(studentsQ.data || []).map((s: any) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.rollNumber || s.id}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={certForm.type}
              onChange={(e) =>
                setCertForm((f) => ({ ...f, type: e.target.value as CertificateType }))
              }
            >
              <option value="bonafide">Bonafide</option>
              <option value="provisional">Provisional</option>
              <option value="degree">Degree</option>
              <option value="transcript">Transcript certificate</option>
            </select>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={certForm.title}
              onChange={(e) => setCertForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
            />
            <button
              type="button"
              disabled={!certForm.studentId || createCertMut.isPending}
              onClick={() => createCertMut.mutate()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
            >
              Create draft certificate
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-2xs">
          <div className="px-4 py-3 border-b font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transcripts
          </div>
          <div className="divide-y">
            {(transcriptsQ.data?.items || []).map((t) => (
              <div key={t.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-bold">{t.studentName || t.studentId}</div>
                    <div className="text-xs text-slate-500">
                      {t.status} · {t.serialNumber || 'no serial'} · GPA {t.gpa ?? '—'} ·{' '}
                      {t.snapshot?.length || 0} courses
                    </div>
                    {t.verificationCode && (
                      <a
                        className="text-[11px] font-semibold text-indigo-600 inline-flex items-center gap-1 mt-1"
                        href={`${verifyBase}/${t.verificationCode}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <QrCode className="w-3 h-3" /> Verify link
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-1">
                      {t.status === 'draft' && (
                        <button
                          type="button"
                          className="text-[11px] font-bold text-emerald-700"
                          onClick={() => issueTrMut.mutate(t.id)}
                        >
                          Issue
                        </button>
                      )}
                      {t.status === 'issued' && (
                        <button
                          type="button"
                          className="text-[11px] font-bold text-rose-600"
                          onClick={() => revokeTrMut.mutate(t.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {t.status === 'issued' && t.snapshot?.length > 0 && (
                  <div className="mt-2 overflow-x-auto print:block">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-1">Code</th>
                          <th>Title</th>
                          <th>Cr</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.snapshot.map((line, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-1 font-mono">{line.courseCode}</td>
                            <td>{line.courseTitle}</td>
                            <td>{line.credits}</td>
                            <td>{line.grade || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {!transcriptsQ.isLoading && !(transcriptsQ.data?.items || []).length && (
              <div className="p-8 text-center text-sm text-slate-500">No transcripts yet</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-2xs">
          <div className="px-4 py-3 border-b font-bold text-sm">Certificates</div>
          <div className="divide-y">
            {(certsQ.data?.items || []).map((c) => (
              <div key={c.id} className="px-4 py-3 text-sm flex justify-between gap-2">
                <div>
                  <div className="font-bold">{c.title}</div>
                  <div className="text-xs text-slate-500">
                    {c.type} · {c.studentName || c.studentId} · {c.status} ·{' '}
                    {c.serialNumber || 'no serial'}
                  </div>
                  {c.verificationCode && (
                    <a
                      className="text-[11px] font-semibold text-indigo-600 inline-flex items-center gap-1 mt-1"
                      href={`${verifyBase}/${c.verificationCode}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <QrCode className="w-3 h-3" /> Verify link
                    </a>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    {c.status === 'draft' && (
                      <button
                        type="button"
                        className="text-[11px] font-bold text-emerald-700"
                        onClick={() => issueCertMut.mutate(c.id)}
                      >
                        Issue
                      </button>
                    )}
                    {c.status === 'issued' && (
                      <button
                        type="button"
                        className="text-[11px] font-bold text-rose-600"
                        onClick={() => revokeCertMut.mutate(c.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!certsQ.isLoading && !(certsQ.data?.items || []).length && (
              <div className="p-8 text-center text-sm text-slate-500">No certificates yet</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default DocumentsCertificatesPage;
