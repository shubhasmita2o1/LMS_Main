import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { isAxiosError } from 'axios';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    (async () => {
      try {
        const { data } = await api.post<{ success: boolean; message?: string }>('/auth/verify-email', {
          token,
        });
        setStatus('ok');
        setMessage(
          data.message ||
            'Email verified successfully. Your account is awaiting administrator approval. You will be able to sign in once your account is approved and activated.'
        );
      } catch (err) {
        setStatus('error');
        if (isAxiosError(err)) {
          const msg =
            (err.response?.data as { error?: { message?: string }; message?: string })?.error
              ?.message ||
            (err.response?.data as { message?: string })?.message;
          setMessage(msg || 'Verification failed.');
        } else {
          setMessage('Verification failed.');
        }
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-3">Email verification</h1>
        {status === 'loading' && <p className="text-slate-500 text-sm">Verifying…</p>}
        {status === 'ok' && (
          <div className="space-y-4">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              {message}
            </p>
            <Link to="/login" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              Go to sign in
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {message}
            </p>
            <Link to="/login" className="text-sm font-semibold text-primary-600">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
