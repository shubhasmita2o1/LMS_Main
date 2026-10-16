import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../lib/api';
import { isAxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setMessage(null);
    try {
      const { data } = await api.post<{ success: boolean; message?: string }>(
        '/auth/forgot-password',
        { email: values.email.trim().toLowerCase() }
      );
      setMessage(data.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      // Always show generic success-style message for privacy
      if (isAxiosError(err)) {
        setMessage('If an account exists, a reset link has been sent.');
      } else {
        setMessage('If an account exists, a reset link has been sent.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Forgot password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter your email and we will send a reset link if an account exists.
        </p>
        {message ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              {message}
            </p>
            <Link to="/login" className="text-sm font-semibold text-primary-600">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary-600 text-white py-2.5 text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-primary-600 font-medium">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
