import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { GraduationCap } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/25 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">University LMS</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Sign in with your institutional account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
