import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, StudentPublic, ProgramPublic, BatchPublic, SectionPublic } from '@university-lms/shared';

export function StudentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    enrollmentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    status: 'active',
    admissionType: 'regular',
    programId: '',
    batchId: '',
    sectionId: '',
    admissionDate: '',
    photoUrl: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  });

  const { data: existing } = useQuery({
    queryKey: ['students', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentPublic>>(`/students/${id}`);
      return data.data!;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['academic', 'programs', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgramPublic[]>>('/academic/programs', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data: batches } = useQuery({
    queryKey: ['academic', 'batches', form.programId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BatchPublic[]>>('/academic/batches', {
        params: { limit: 100, programId: form.programId || undefined },
      });
      return data.data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['academic', 'sections', form.batchId],
    enabled: Boolean(form.batchId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SectionPublic[]>>('/academic/sections', {
        params: { limit: 100, batchId: form.batchId },
      });
      return data.data || [];
    },
  });

  useEffect(() => {
    if (existing) {
      setForm((f) => ({
        ...f,
        enrollmentNumber: existing.enrollmentNumber || '',
        firstName: existing.firstName || '',
        lastName: existing.lastName || '',
        email: existing.email || '',
        phone: existing.phone || '',
        gender: existing.gender || '',
        status: existing.status || 'active',
        admissionType: existing.admissionType || 'regular',
        programId: existing.programId || '',
        batchId: existing.batchId || '',
        sectionId: existing.sectionId || '',
        admissionDate: existing.admissionDate
          ? String(existing.admissionDate).slice(0, 10)
          : '',
        photoUrl: existing.photoUrl || '',
        guardianName: existing.guardians?.[0]?.name || '',
        guardianRelation: existing.guardians?.[0]?.relation || '',
        guardianPhone: existing.guardians?.[0]?.phone || '',
        emergencyName: existing.emergencyContacts?.[0]?.name || '',
        emergencyRelation: existing.emergencyContacts?.[0]?.relation || '',
        emergencyPhone: existing.emergencyContacts?.[0]?.phone || '',
      }));
    }
  }, [existing]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        enrollmentNumber: form.enrollmentNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        status: form.status,
        admissionType: form.admissionType,
        programId: form.programId || null,
        batchId: form.batchId || null,
        sectionId: form.sectionId || null,
        admissionDate: form.admissionDate || null,
        photoUrl: form.photoUrl || undefined,
      };
      if (form.guardianName) {
        payload.guardians = [
          {
            name: form.guardianName,
            relation: form.guardianRelation || 'parent',
            phone: form.guardianPhone || undefined,
            isPrimary: true,
          },
        ];
      }
      if (form.emergencyName && form.emergencyPhone) {
        payload.emergencyContacts = [
          {
            name: form.emergencyName,
            relation: form.emergencyRelation || 'other',
            phone: form.emergencyPhone,
          },
        ];
      }

      if (isEdit) {
        const { data } = await api.patch<ApiResponse>(`/students/${id}`, payload);
        if (!data.success) throw new Error(data.error?.message || 'Update failed');
        navigate(`/students/${id}`);
      } else {
        const { data } = await api.post<ApiResponse<StudentPublic>>('/students', payload);
        if (!data.success || !data.data) throw new Error(data.error?.message || 'Create failed');
        navigate(`/students/${data.data.id}`);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: ApiResponse }; message?: string };
      setError(ax.response?.data?.error?.message || ax.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to={isEdit ? `/students/${id}` : '/students'} className="text-sm text-slate-600">
            ← Back
          </Link>
          <span className="font-semibold text-slate-900">
            {isEdit ? 'Edit Student' : 'Add Student'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Section title="Identity">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Enrollment number *" value={form.enrollmentNumber} onChange={(v) => set('enrollmentNumber', v)} required />
              <Field label="First name *" value={form.firstName} onChange={(v) => set('firstName', v)} required />
              <Field label="Last name *" value={form.lastName} onChange={(v) => set('lastName', v)} required />
              <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <Field label="Photo URL" value={form.photoUrl} onChange={(v) => set('photoUrl', v)} />
            </div>
          </Section>

          <Section title="Academic placement">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                <select value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value, batchId: '', sectionId: '' }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">—</option>
                  {(programs || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                <select value={form.batchId} onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value, sectionId: '' }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">—</option>
                  {(batches || []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <select value={form.sectionId} onChange={(e) => set('sectionId', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">—</option>
                  {(sections || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <Field label="Admission date" value={form.admissionDate} onChange={(v) => set('admissionDate', v)} type="date" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admission type</label>
                <select value={form.admissionType} onChange={(e) => set('admissionType', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="regular">Regular</option>
                  <option value="lateral">Lateral</option>
                  <option value="transfer">Transfer</option>
                  <option value="nri">NRI</option>
                  <option value="management">Management</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On leave</option>
                  <option value="suspended">Suspended</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="graduated">Graduated</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Guardian">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Name" value={form.guardianName} onChange={(v) => set('guardianName', v)} />
              <Field label="Relation" value={form.guardianRelation} onChange={(v) => set('guardianRelation', v)} />
              <Field label="Phone" value={form.guardianPhone} onChange={(v) => set('guardianPhone', v)} />
            </div>
          </Section>

          <Section title="Emergency contact">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Name" value={form.emergencyName} onChange={(v) => set('emergencyName', v)} />
              <Field label="Relation" value={form.emergencyRelation} onChange={(v) => set('emergencyRelation', v)} />
              <Field label="Phone" value={form.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} />
            </div>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create student'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
      />
    </div>
  );
}
