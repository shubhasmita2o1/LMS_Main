import { RegisterForm } from '../components/auth/RegisterForm';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white text-xl font-bold mb-4 shadow-lg shadow-primary-600/20">
            UL
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Verify your email, then wait for administrator approval before signing in.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <RegisterForm />
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

export default RegisterPage;
