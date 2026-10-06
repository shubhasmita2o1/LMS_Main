import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import {
  Mail,
  Lock,
  Building,
  ChevronDown,
  ChevronUp,
  LogIn,
  Sparkles,
} from 'lucide-react';

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid institutional email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(),
  rememberMe: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTenantField, setShowTenantField] = useState<boolean>(false);
  const [quickRoleActive, setQuickRoleActive] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantId: '',
      rememberMe: true,
    },
  });

  // Demo accounts helper for quick developer & evaluator login
  const handleQuickFill = (role: 'super_admin' | 'tenant_admin' | 'faculty' | 'student') => {
    setQuickRoleActive(role);
    setErrorMessage(null);

    const presets = {
      super_admin: {
        email: 'admin@university.edu',
        password: 'Password123!',
        tenantId: '',
      },
      tenant_admin: {
        email: 'dean.mitchell@stanford.edu',
        password: 'Password123!',
        tenantId: '',
      },
      faculty: {
        email: 'prof.jenkins@stanford.edu',
        password: 'Password123!',
        tenantId: '',
      },
      student: {
        email: 'alex.rivera@stanford.edu',
        password: 'Password123!',
        tenantId: '',
      },
    };

    const selected = presets[role];
    setValue('email', selected.email, { shouldValidate: true });
    setValue('password', selected.password, { shouldValidate: true });
    if (selected.tenantId) {
      setValue('tenantId', selected.tenantId);
      setShowTenantField(true);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data.email, data.password, data.tenantId, data.rememberMe);

      // Navigate to previous location or dashboard
      const from =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Quick Demo Fill Bar for Testing */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Demo Autofill
          </span>
          <span className="text-[11px] text-slate-400">Click to autofill sample credentials</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill('super_admin')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
              quickRoleActive === 'super_admin'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('tenant_admin')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
              quickRoleActive === 'tenant_admin'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Tenant Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('faculty')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
              quickRoleActive === 'faculty'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Faculty
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('student')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
              quickRoleActive === 'student'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Student
          </button>
        </div>
      </div>

      {/* Institutional SSO Buttons (Canvas / SaaS Style) */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => {
            setValue('email', 'sso.user@university.edu');
            setValue('password', 'Password123!');
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200/90 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {/* Google SVG */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign in with Institutional Google Account</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setValue('email', 'faculty.m365@university.edu');
            setValue('password', 'Password123!');
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200/90 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {/* Microsoft SVG */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span>Sign in with Microsoft 365 / Entra ID</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0">
          Or sign in with email credentials
        </span>
        <div className="border-t border-slate-200 w-full" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errorMessage && (
          <Alert
            variant="error"
            title="Authentication Error"
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {/* Email input */}
        <Input
          label="Institutional Email"
          type="email"
          required
          autoComplete="username"
          placeholder="e.g. j.doe@university.edu"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password input */}
        <div>
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your security password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {/* Optional Tenant / Campus Selection Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTenantField(!showTenantField)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors focus:outline-none"
          >
            <Building className="w-3.5 h-3.5" />
            <span>
              {showTenantField
                ? 'Hide Campus / Tenant Context'
                : 'Sign in to a specific Campus or Tenant ID'}
            </span>
            {showTenantField ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTenantField && (
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <Input
                label="Institution / Tenant ID"
                type="text"
                placeholder="e.g. 507f1f77bcf86cd799439011"
                helperText="Scoped tenant routing header (x-tenant-id) will be attached automatically."
                error={errors.tenantId?.message}
                {...register('tenantId')}
              />
            </div>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              {...register('rememberMe')}
            />
            <span className="text-slate-600 font-medium">Remember this device</span>
          </label>

          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Self-service password recovery will be enabled in Phase 3. Please contact your institutional tenant administrator.');
            }}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="w-4 h-4" />}
          className="w-full justify-center shadow-lg shadow-primary-600/20 text-sm font-bold py-3 mt-2"
        >
          Sign in to LMS Portal
        </Button>

        {/* Register redirect */}
        <div className="pt-3 text-center text-xs sm:text-sm text-slate-500">
          New student, faculty, or institution?{' '}
          <Link
            to="/register"
            className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4 ml-1"
          >
            Create an account / Register
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
