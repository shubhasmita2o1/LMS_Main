import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  FacultyPublic,
  FacultyAssignmentPublic,
} from '@university-lms/shared';
import { Can } from '../../components/auth/Can';

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
      setMessage('Status updated');
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-10 text-slate-400">Loading…</div>;
  }
  if (error || !faculty) {
    return (
      <div className="min-h-screen bg-slate-50 p-10">
        <p className="text-red-600">Faculty not found</p>
        <Link to="/faculty" className="text-primary-600 text-sm">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/faculty" className="text-sm text-slate-600">
              ← Faculty
            </Link>
            <span className="font-semibold text-slate-900">
              {faculty.firstName} {faculty.lastName}
            </span>
          </div>
          <Can resource="faculty" action="update">
            <Link
              to={`/faculty/${id}/edit`}
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              Edit
            </Link>
          </Can>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h1 className="text-xl font-bold text-slate-900">
            {faculty.firstName} {faculty.middleName} {faculty.lastName}
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-0.5">{faculty.employeeId}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge>{faculty.status}</Badge>
            {faculty.designation && <Badge>{faculty.designation}</Badge>}
            {faculty.employmentType && (
              <Badge>{faculty.employmentType.replace('_', ' ')}</Badge>
            )}
          </div>
          {faculty.bio && <p className="text-sm text-slate-600 mt-4">{faculty.bio}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card title="Contact">
            <Row label="Email" value={faculty.email} />
            <Row label="Phone" value={faculty.phone} />
            <Row label="Office" value={faculty.officeLocation} />
            <Row label="Hours" value={faculty.officeHours} />
          </Card>
          <Card title="Employment">
            <Row label="Department" value={faculty.departmentId} mono />
            <Row
              label="Joined"
              value={
                faculty.dateOfJoining
                  ? String(faculty.dateOfJoining).slice(0, 10)
                  : undefined
              }
            />
            <Row
              label="Experience"
              value={
                faculty.experienceYears !== undefined
                  ? `${faculty.experienceYears} yrs`
                  : undefined
              }
            />
          </Card>
        </div>

        {faculty.qualifications?.length > 0 && (
          <Card title="Qualifications">
            {faculty.qualifications.map((q, i) => (
              <div key={i} className="text-sm py-1 border-b border-slate-50 last:border-0">
                <span className="font-medium">{q.degree}</span>
                {q.institution && (
                  <span className="text-slate-500 ml-2">— {q.institution}</span>
                )}
                {q.year && <span className="text-slate-400 ml-2">({q.year})</span>}
              </div>
            ))}
          </Card>
        )}

        {faculty.specializations?.length > 0 && (
          <Card title="Specializations">
            <div className="flex flex-wrap gap-2">
              {faculty.specializations.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </Card>
        )}

        <Can resource="faculty" action="manage">
          <Card title="Change status">
            <div className="flex flex-wrap gap-2">
              <select
                value={status || faculty.status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On leave</option>
                <option value="retired">Retired</option>
                <option value="terminated">Terminated</option>
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

        <Card title="Course / section assignments">
          <p className="text-xs text-slate-400 mb-2">
            Ready for Phase 7 courses. Assignments can store courseId, sectionId, workload.
          </p>
          {(assignments || []).length === 0 ? (
            <p className="text-sm text-slate-400">No assignments yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(assignments || []).map((a) => (
                <li key={a.id} className="py-2 text-sm flex justify-between">
                  <span className="capitalize">{a.role}</span>
                  <span className="font-mono text-xs text-slate-500">
                    course: {a.courseId || '—'} · section: {a.sectionId || '—'}
                    {a.workloadHours != null ? ` · ${a.workloadHours}h` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
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
