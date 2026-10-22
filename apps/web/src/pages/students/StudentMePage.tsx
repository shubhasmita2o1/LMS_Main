import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, StudentPublic } from '@university-lms/shared';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout/AppLayout';
import { GraduationCap, AlertCircle } from 'lucide-react';

export function StudentMePage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentPublic>>('/students/me');
      return data.data;
    },
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Identification
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Student Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Personal academic credentials, cohort mappings, and institutional records.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/gradebook/transcript"
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              Academic Transcript
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading student profile…
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No student profile record found</p>
              <p className="text-xs text-amber-700 mt-1">
                Your authenticated login ({user?.email}) is not currently linked to an active student roster record.
                Contact your institution's registrar or tenant administrator to map your SIS profile.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  `${data.firstName[0]}${data.lastName[0]}`
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {data.firstName} {data.middleName ? `${data.middleName} ` : ''}{data.lastName}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {data.status}
                  </span>
                </div>
                <p className="font-mono text-sm text-slate-500 mt-1">
                  Enrollment No: <span className="font-semibold text-slate-800">{data.enrollmentNumber}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{data.email || user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Admission Type</span>
                <span className="text-sm font-semibold text-slate-800 capitalize mt-1 block">
                  {data.admissionType || 'Regular'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Enrollment Status</span>
                <span className="text-sm font-semibold text-slate-800 capitalize mt-1 block">
                  {data.enrollmentStatus || 'Active'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Admission Date</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {data.admissionDate ? new Date(data.admissionDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Academic Mapping Identifiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-sans">Program ID</span>
                  <span className="text-slate-700 truncate block mt-0.5">{data.programId || '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-sans">Batch ID</span>
                  <span className="text-slate-700 truncate block mt-0.5">{data.batchId || '—'}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-sans">Section ID</span>
                  <span className="text-slate-700 truncate block mt-0.5">{data.sectionId || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
