import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicVerify } from '../../lib/transcriptApi';
import { ShieldCheck, ShieldX } from 'lucide-react';

export function VerifyPage() {
  const { code = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', code],
    queryFn: () => publicVerify(code),
    enabled: code.length >= 16,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Document verification</h1>
        <p className="text-xs text-slate-500 mb-6">
          University LMS authenticity check. Limited public details only.
        </p>
        {isLoading && <p className="text-sm text-slate-500">Checking…</p>}
        {error && (
          <div className="flex items-start gap-3 text-rose-700">
            <ShieldX className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Could not verify</p>
              <p className="text-xs">Invalid or unknown code.</p>
            </div>
          </div>
        )}
        {data && (
          <div className="space-y-3">
            <div
              className={`flex items-start gap-3 ${
                data.valid ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {data.valid ? (
                <ShieldCheck className="w-7 h-7 shrink-0" />
              ) : (
                <ShieldX className="w-7 h-7 shrink-0" />
              )}
              <div>
                <p className="font-bold">{data.valid ? 'Valid document' : 'Not valid'}</p>
                <p className="text-xs opacity-80">
                  {data.revoked ? 'This document has been revoked.' : data.status || ''}
                </p>
              </div>
            </div>
            <dl className="text-sm space-y-2 border-t pt-3">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-semibold capitalize">{data.type}</dd>
              </div>
              {data.studentName && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Student</dt>
                  <dd className="font-semibold">{data.studentName}</dd>
                </div>
              )}
              {data.programName && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Program</dt>
                  <dd className="font-semibold">{data.programName}</dd>
                </div>
              )}
              {data.title && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Title</dt>
                  <dd className="font-semibold">{data.title}</dd>
                </div>
              )}
              {data.serialNumber && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Serial</dt>
                  <dd className="font-mono text-xs">{data.serialNumber}</dd>
                </div>
              )}
              {data.issuedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Issued</dt>
                  <dd className="text-xs">{new Date(data.issuedAt).toLocaleString()}</dd>
                </div>
              )}
              {data.summary && (
                <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 mt-2">
                  {data.summary.gpa != null && <div>GPA: {data.summary.gpa}</div>}
                  {data.summary.cgpa != null && <div>CGPA: {data.summary.cgpa}</div>}
                  {data.summary.totalCredits != null && (
                    <div>Credits: {data.summary.totalCredits}</div>
                  )}
                  {data.summary.lineCount != null && (
                    <div>Courses on record: {data.summary.lineCount}</div>
                  )}
                </div>
              )}
            </dl>
          </div>
        )}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-semibold text-indigo-600">
            Go to LMS login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
