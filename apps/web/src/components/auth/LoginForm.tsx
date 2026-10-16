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
  Eye,
  EyeOff,
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

const DEMO_ENABLED =
  import.meta.env.DEV === true && import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTenantField, setShowTenantField] = useState<boolean>(false);
  const [quickRoleActive, setQuickRoleActive] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleQuickFill = (role: 'super_admin' | 'tenant_admin' | 'faculty' | 'student') => {
    if (!DEMO_ENABLED) return;
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
      const from =
        (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
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
      {DEMO_ENABLED && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo Autofill
            </span>
            <span className="text-[11px] text-slate-400">Dev only</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(['super_admin', 'tenant_admin', 'faculty', 'student'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleQuickFill(role)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
                  quickRoleActive === role
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {role === 'super_admin'
                  ? 'Super Admin'
                  : role === 'tenant_admin'
                    ? 'Tenant Admin'
                    : role === 'faculty'
                      ? 'Faculty'
                      : 'Student'}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errorMessage && (
          <Alert variant="error" title="Sign in failed" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@university.edu"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Your password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              {...register('rememberMe')}
            />
            <span className="text-slate-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowTenantField((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600"
          >
            <Building className="w-3.5 h-3.5" />
            {showTenantField ? 'Hide tenant ID' : 'Tenant ID (optional)'}
            {showTenantField ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showTenantField && (
            <div className="mt-2">
              <Input
                label="Tenant ID"
                type="text"
                placeholder="Optional tenant ObjectId"
                {...register('tenantId')}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="w-4 h-4" />}
          className="w-full justify-center"
        >
          Sign in
        </Button>

        <div className="pt-2 text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
