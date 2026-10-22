import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, CheckCircle2, AlertCircle, BookOpen, Award } from 'lucide-react';
import api from '../../lib/api';
import type {
  ApiResponse,
  FacultyPublic,
  FacultyAssignmentPublic,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge, Avatar } from '../../components/ui';

export function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const { data: faculty, isLoading, error } = useQuery({
    queryKey: ['faculty', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyPublic>>(`/faculty/${id}`);
      return data.data!;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ['faculty', id, 'assignments'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyAssignmentPublic[]>>(
        `/faculty/${id}/assignments`
      );
      return data.data || [];
    },
  });

  const statusMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/faculty/${id}/status`, { status });
      if (!data.success) throw new Error(data.error?.message || 'Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', id] });
      setMessage('Faculty status updated successfully');
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <PageShell>
          <div className="py-20 text-center text-slate-400 font-medium">
            Loading faculty profile…
          </div>
        </PageShell>
      </AppLayout>
    );
  }

  if (error || !faculty) {
    return (
      <AppLayout>
        <PageShell>
          <SurfaceCard className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Faculty Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">The requested faculty record could not be found.</p>
            <PillButton variant="outline" href="/faculty" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Faculty Directory
            </PillButton>
          </SurfaceCard>
        </PageShell>
      </AppLayout>
    );
  }

  const fullName = `${faculty.firstName} ${faculty.middleName ? faculty.middleName + ' ' : ''}${faculty.lastName}`;

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title="Faculty Profile"
          subtitle={`Faculty ID: ${faculty.employeeId}`}
          badge={<StatusBadge status={faculty.status === 'active' ? 'success' : 'neutral'} label={faculty.status} />}
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/faculty" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Directory
              </PillButton>
              <Can resource="faculty" action="update">
                <PillButton variant="primary" href={`/faculty/${id}/edit`} leftIcon={<Edit3 className="w-4 h-4" />}>
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
            <Avatar name={fullName} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                <StatusBadge status={faculty.status === 'active' ? 'success' : 'neutral'} label={faculty.status} />
                {faculty.designation && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#165239] border border-emerald-100">
                    {faculty.designation}
                  </span>
                )}
                {faculty.employmentType && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {faculty.employmentType.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-slate-500">Employee ID: {faculty.employeeId}</p>
              {faculty.bio && <p className="text-xs text-slate-600 mt-3 max-w-2xl">{faculty.bio}</p>}
            </div>
          </div>
        </SurfaceCard>

        {/* Details Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          <SurfaceCard title="Contact Information">
            <div className="space-y-3">
              <DetailRow label="Official Email" value={faculty.email} />
              <DetailRow label="Direct Phone" value={faculty.phone} />
              <DetailRow label="Office Location" value={faculty.officeLocation} />
              <DetailRow label="Consulting Hours" value={faculty.officeHours} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Institutional Appointment">
            <div className="space-y-3">
              <DetailRow label="Department ID" value={faculty.departmentId} mono />
              <DetailRow
                label="Date Joined"
                value={faculty.dateOfJoining ? String(faculty.dateOfJoining).slice(0, 10) : undefined}
              />
              <DetailRow
                label="Teaching Experience"
                value={faculty.experienceYears !== undefined ? `${faculty.experienceYears} Years` : undefined}
              />
            </div>
          </SurfaceCard>
        </div>

        {/* Qualifications & Specializations */}
        <div className="grid sm:grid-cols-2 gap-6">
          <SurfaceCard title="Academic Qualifications">
            {faculty.qualifications && faculty.qualifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {faculty.qualifications.map((q, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-slate-900">{q.degree}</span>
                      {q.institution && <span className="text-slate-500 ml-1.5">— {q.institution}</span>}
                    </div>
                    {q.year && <span className="text-slate-400 font-mono text-[11px]">({q.year})</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No qualifications recorded</p>
            )}
          </SurfaceCard>

          <SurfaceCard title="Areas of Specialization">
            {faculty.specializations && faculty.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {faculty.specializations.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#f0f7f4] text-[#165239] border border-[#c2decf]/80"
                  >
                    <Award className="w-3 h-3 text-[#165239]" />
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No specializations specified</p>
            )}
          </SurfaceCard>
        </div>

        {/* Lifecycle Status Management */}
        <Can resource="faculty" action="manage">
          <SurfaceCard title="Faculty Status Management">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={status || faculty.status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="retired">Retired</option>
                <option value="terminated">Terminated</option>
              </select>
              <PillButton
                variant="primary"
                onClick={() => statusMut.mutate()}
                loading={statusMut.isPending}
              >
                Update Status
              </PillButton>
            </div>
          </SurfaceCard>
        </Can>

        {/* Course & Section Assignments */}
        <SurfaceCard title="Course & Instructional Assignments">
          {(assignments || []).length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No teaching assignments recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {(assignments || []).map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <BookOpen className="w-3.5 h-3.5 text-[#165239]" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 capitalize">{a.role}</span>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Course: {a.courseId || '—'} · Section: {a.sectionId || '—'}
                      </p>
                    </div>
                  </div>
                  {a.workloadHours != null && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {a.workloadHours} hrs / week
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
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

