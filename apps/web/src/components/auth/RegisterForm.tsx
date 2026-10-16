import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Mail, Lock, User, UserPlus, Building2 } from 'lucide-react';

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
    organizationName: z.string().max(200).optional(),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must acknowledge the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const { registerAccount } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      organizationName: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await registerAccount({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        organizationName: data.organizationName?.trim() || undefined,
      });
      setSuccessMessage(result.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    }
  };

  if (successMessage) {
    return (
      <div className="space-y-4">
        <Alert variant="success" title="Check your email">
          {successMessage}
        </Alert>
        <p className="text-sm text-slate-600">
          After you verify your email, an administrator must approve and activate your account
          before you can sign in.
        </p>
        <div className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorMessage && (
        <Alert variant="error" title="Registration failed" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

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

      <Input
        label="Organization (optional)"
        type="text"
        autoComplete="organization"
        placeholder="Your university or institution"
        leftIcon={<Building2 className="w-4 h-4" />}
        helperText="Shown to administrators during approval review. Does not bind a tenant automatically."
        error={errors.organizationName?.message}
        {...register('organizationName')}
      />

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

      <label className="flex items-start gap-2 cursor-pointer select-none text-sm text-slate-600">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          {...register('acceptTerms')}
        />
        <span>
          I understand that access requires email verification and administrator approval.
        </span>
      </label>
      {errors.acceptTerms?.message && (
        <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
      )}

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
