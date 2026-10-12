import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, FacultyPublic, DepartmentPublic } from '@university-lms/shared';

export function FacultyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    employmentType: 'full_time',
    departmentId: '',
    status: 'active',
    dateOfJoining: '',
    experienceYears: '',
    bio: '',
    officeLocation: '',
    officeHours: '',
    qualDegree: '',
    qualInstitution: '',
    specializations: '',
  });

  const { data: existing } = useQuery({
    queryKey: ['faculty', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyPublic>>(`/faculty/${id}`);
      return data.data!;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['academic', 'departments', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DepartmentPublic[]>>('/academic/departments', {
        params: { limit: 100 },
      });
      return data.data || [];
    },
  });

  useEffect(() => {
    if (existing) {
      setForm((f) => ({
        ...f,
        employeeId: existing.employeeId || '',
        firstName: existing.firstName || '',
        lastName: existing.lastName || '',
        email: existing.email || '',
        phone: existing.phone || '',
        designation: existing.designation || '',
        employmentType: existing.employmentType || 'full_time',
        departmentId: existing.departmentId || '',
        status: existing.status || 'active',
        dateOfJoining: existing.dateOfJoining
          ? String(existing.dateOfJoining).slice(0, 10)
          : '',
        experienceYears:
          existing.experienceYears !== undefined ? String(existing.experienceYears) : '',
        bio: existing.bio || '',
        officeLocation: existing.officeLocation || '',
        officeHours: existing.officeHours || '',
        qualDegree: existing.qualifications?.[0]?.degree || '',
        qualInstitution: existing.qualifications?.[0]?.institution || '',
        specializations: (existing.specializations || []).join(', '),
      }));
    }
  }, [existing]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        employeeId: form.employeeId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        designation: form.designation || undefined,
        employmentType: form.employmentType,
        departmentId: form.departmentId || null,
        status: form.status,
        dateOfJoining: form.dateOfJoining || null,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        bio: form.bio || undefined,
        officeLocation: form.officeLocation || undefined,
        officeHours: form.officeHours || undefined,
        specializations: form.specializations
          ? form.specializations.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (form.qualDegree) {
        payload.qualifications = [
          {
            degree: form.qualDegree,
            institution: form.qualInstitution || undefined,
          },
        ];
      }

      if (isEdit) {
        const { data } = await api.patch<ApiResponse>(`/faculty/${id}`, payload);
        if (!data.success) throw new Error(data.error?.message || 'Update failed');
        navigate(`/faculty/${id}`);
      } else {
        const { data } = await api.post<ApiResponse<FacultyPublic>>('/faculty', payload);
        if (!data.success || !data.data) throw new Error(data.error?.message || 'Create failed');
        navigate(`/faculty/${data.data.id}`);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: ApiResponse }; message?: string };
      setError(ax.response?.data?.error?.message || ax.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to={isEdit ? `/faculty/${id}` : '/faculty'} className="text-sm text-slate-600">
            ← Back
          </Link>
          <span className="font-semibold text-slate-900">
            {isEdit ? 'Edit Faculty' : 'Add Faculty'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Employee ID *" value={form.employeeId} onChange={(v) => set('employeeId', v)} required />
            <Field label="First name *" value={form.firstName} onChange={(v) => set('firstName', v)} required />
            <Field label="Last name *" value={form.lastName} onChange={(v) => set('lastName', v)} required />
            <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field label="Designation" value={form.designation} onChange={(v) => set('designation', v)} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employment type</label>
              <select
                value={form.employmentType}
                onChange={(e) => set('employmentType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="visiting">Visiting</option>
                <option value="contract">Contract</option>
                <option value="adjunct">Adjunct</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">—</option>
                {(departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Date of joining"
              value={form.dateOfJoining}
              onChange={(v) => set('dateOfJoining', v)}
              type="date"
            />
            <Field
              label="Experience (years)"
              value={form.experienceYears}
              onChange={(v) => set('experienceYears', v)}
              type="number"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On leave</option>
                <option value="retired">Retired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <Field label="Office location" value={form.officeLocation} onChange={(v) => set('officeLocation', v)} />
            <Field label="Office hours" value={form.officeHours} onChange={(v) => set('officeHours', v)} />
            <Field label="Qualification degree" value={form.qualDegree} onChange={(v) => set('qualDegree', v)} />
            <Field
              label="Qualification institution"
              value={form.qualInstitution}
              onChange={(v) => set('qualInstitution', v)}
            />
            <div className="sm:col-span-2">
              <Field
                label="Specializations (comma-separated)"
                value={form.specializations}
                onChange={(v) => set('specializations', v)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create faculty'}
          </button>
        </form>
      </main>
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
