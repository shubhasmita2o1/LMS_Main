import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, StudentPublic, StudentDocumentPublic } from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { AppLayout } from '../../components/layout/AppLayout';

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
      setMessage('Status updated');
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
      setMessage('Document added');
    },
  });

  const delDocMut = useMutation({
    mutationFn: (docId: string) => api.delete(`/students/${id}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', id, 'documents'] }),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-10 text-slate-400">Loading…</div>;
  }
  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 p-10">
        <p className="text-red-600">Student not found</p>
        <Link to="/students" className="text-primary-600 text-sm">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/students"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              ← Students Directory
            </Link>
          </div>
          <Can resource="student" action="update">
            <Link
              to={`/students/${id}/edit`}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition"
            >
              Edit Student Record
            </Link>
          </Can>
        </div>
        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-5">
          <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-bold shrink-0 overflow-hidden">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              `${student.firstName[0]}${student.lastName[0]}`
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">
              {student.firstName} {student.middleName} {student.lastName}
            </h1>
            <p className="font-mono text-sm text-slate-500 mt-0.5">{student.enrollmentNumber}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge>{student.status}</Badge>
              {student.enrollmentStatus && <Badge>{student.enrollmentStatus}</Badge>}
              {student.admissionType && <Badge>{student.admissionType}</Badge>}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card title="Contact">
            <Row label="Email" value={student.email} />
            <Row label="Phone" value={student.phone} />
            <Row label="Gender" value={student.gender} />
            <Row label="Blood group" value={student.bloodGroup} />
          </Card>
          <Card title="Placement">
            <Row label="Program" value={student.programId} mono />
            <Row label="Batch" value={student.batchId} mono />
            <Row label="Section" value={student.sectionId} mono />
            <Row
              label="Admission"
              value={
                student.admissionDate
                  ? String(student.admissionDate).slice(0, 10)
                  : undefined
              }
            />
          </Card>
        </div>

        {student.guardians?.length > 0 && (
          <Card title="Guardians">
            {student.guardians.map((g, i) => (
              <div key={i} className="text-sm py-1 border-b border-slate-50 last:border-0">
                <span className="font-medium">{g.name}</span>
                <span className="text-slate-400 ml-2">({g.relation})</span>
                {g.phone && <span className="text-slate-500 ml-2">{g.phone}</span>}
              </div>
            ))}
          </Card>
        )}

        <Can resource="student" action="manage">
          <Card title="Change status">
            <div className="flex flex-wrap gap-2">
              <select
                value={status || student.status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On leave</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="graduated">Graduated</option>
                <option value="alumni">Alumni</option>
              </select>
              <button
                onClick={() => statusMut.mutate()}
                disabled={statusMut.isPending}
                className="text-sm px-3 py-2 rounded-lg bg-primary-600 text-white"
              >
                Update status
              </button>
            </div>
          </Card>
        </Can>

        <Card title="Documents">
          <ul className="divide-y divide-slate-100 mb-3">
            {(documents || []).map((d) => (
              <li key={d.id} className="py-2 flex justify-between text-sm">
                <div>
                  <span className="font-medium">{d.fileName}</span>
                  <span className="text-slate-400 ml-2 text-xs">{d.type}</span>
                  <span className="text-slate-400 ml-2 text-xs">{d.verificationStatus}</span>
                </div>
                <div className="flex gap-3">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-xs">
                    Open
                  </a>
                  <Can resource="student" action="update">
                    <button
                      onClick={() => delDocMut.mutate(d.id)}
                      className="text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </Can>
                </div>
              </li>
            ))}
            {(documents || []).length === 0 && (
              <li className="py-3 text-slate-400 text-sm">No documents</li>
            )}
          </ul>
          <Can resource="student" action="update">
            <div className="grid sm:grid-cols-3 gap-2">
              <select
                value={docForm.type}
                onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded text-sm"
              >
                <option value="id_proof">ID proof</option>
                <option value="marksheet">Marksheet</option>
                <option value="photo">Photo</option>
                <option value="certificate">Certificate</option>
                <option value="address_proof">Address proof</option>
                <option value="other">Other</option>
              </select>
              <input
                placeholder="File name"
                value={docForm.fileName}
                onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded text-sm"
              />
              <input
                placeholder="https://…"
                value={docForm.fileUrl}
                onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded text-sm"
              />
              <button
                onClick={() => addDocMut.mutate()}
                disabled={!docForm.fileName || !docForm.fileUrl || addDocMut.isPending}
                className="sm:col-span-3 text-sm px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
              >
                Add document metadata
              </button>
            </div>
          </Can>
        </Card>
      </div>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="font-semibold text-slate-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
      {children}
    </span>
  );
}
