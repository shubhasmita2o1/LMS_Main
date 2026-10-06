import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Mail, Lock, User, UserPlus, Building, ChevronDown, ChevronUp } from 'lucide-react';
import type { SystemRole } from '@university-lms/shared';

const registerFormSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Za-z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z
      .enum([
        'tenant_admin',
        'university_admin',
        'faculty',
        'student',
        'staff',
      ])
      .optional(),
    tenantId: z.string().optional(),
    rememberMe: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'tenant_admin',
      tenantId: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await registerUser(
        {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: data.role as SystemRole | undefined,
          tenantId: data.tenantId?.trim() ? data.tenantId.trim() : null,
        },
        data.rememberMe
      );

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    }
  };

  const roleOptions = [
    { value: 'tenant_admin', label: 'Tenant Administrator (Default)' },
    { value: 'university_admin', label: 'University Administrator' },
    { value: 'faculty', label: 'Faculty Member' },
    { value: 'student', label: 'Student' },
    { value: 'staff', label: 'Staff' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorMessage && (
        <Alert
          variant="error"
          title="Registration failed"
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="First Name"
          type="text"
          required
          autoComplete="given-name"
          placeholder="Jane"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.firstName?.message}
          {...register('firstName')}
        />

        <Input
          label="Last Name"
          type="text"
          required
          autoComplete="family-name"
          placeholder="Doe"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      {/* Email input */}
      <Input
        label="Email Address"
        type="email"
        required
        autoComplete="email"
        placeholder="jane.doe@university.edu"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password inputs */}
      <Input
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Min. 8 chars with letter & number"
        leftIcon={<Lock className="w-4 h-4" />}
        helperText="Must be at least 8 characters and include a letter and number."
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Confirm your password"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {/* Advanced / Role Selection Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors focus:outline-none"
        >
          <Building className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide advanced settings' : 'Configure role & tenant (Bootstrap / Demo)'}</span>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <Select
              label="Initial Role"
              options={roleOptions}
              helperText="Note: If this is the very first registered user in the database, the backend automatically grants super_admin bootstrap."
              error={errors.role?.message}
              {...register('role')}
            />

            <Input
              label="Tenant ID (Optional)"
              type="text"
              placeholder="e.g. 507f1f77bcf86cd799439011"
              helperText="Leave empty to auto-generate a demo tenant context"
              error={errors.tenantId?.message}
              {...register('tenantId')}
            />
          </div>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            {...register('rememberMe')}
          />
          <span className="text-xs sm:text-sm text-slate-600">Keep me signed in</span>
        </label>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        leftIcon={<UserPlus className="w-4 h-4" />}
        className="w-full justify-center shadow-md shadow-primary-600/10"
      >
        Create your account
      </Button>

      {/* Login redirect */}
      <div className="pt-2 text-center text-xs sm:text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}

export default RegisterForm;
