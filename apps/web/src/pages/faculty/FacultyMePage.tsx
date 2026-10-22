import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, FacultyPublic } from '@university-lms/shared';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout/AppLayout';
import { GraduationCap, AlertCircle } from 'lucide-react';

export function FacultyMePage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['faculty', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyPublic>>('/faculty/me');
      return data.data;
    },
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty Identification
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Faculty Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Personal faculty credentials, academic appointment, and department designation.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/courses"
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              Curriculum Directory
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading faculty profile…
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No faculty profile record found</p>
              <p className="text-xs text-amber-700 mt-1">
                Your authenticated login ({user?.email}) is not currently linked to an active faculty record.
                Contact your institution's dean or tenant administrator to map your faculty employee profile.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
                {`${data.firstName[0]}${data.lastName[0]}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {data.firstName} {data.lastName}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                    {data.status}
                  </span>
                </div>
                <p className="font-semibold text-primary-700 text-sm mt-0.5">
                  {data.designation || 'Faculty Member'}
                </p>
                <p className="font-mono text-xs text-slate-500 mt-1">
                  Employee ID: <span className="font-semibold text-slate-800">{data.employeeId}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{data.email || user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Department Assignment</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {data.departmentId ? `Department ID: ${data.departmentId}` : 'University Wide'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Appointment Status</span>
                <span className="text-sm font-semibold text-slate-800 capitalize mt-1 block">
                  {data.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need to update employment records?</span>
              {data.id && (
                <Link to={`/faculty/${data.id}`} className="text-primary-600 hover:text-primary-700 font-semibold">
                  View full faculty dossier →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
