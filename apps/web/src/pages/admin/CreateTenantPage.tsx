import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { createTenant, type CreateTenantInput } from '../../lib/adminApi';
import { slugify } from '@university-lms/shared';
import {
  Building,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Palette,
  CheckCircle2,
} from 'lucide-react';

const createTenantSchema = z.object({
  name: z.string().min(2, 'Institution name must be at least 2 characters').max(200),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']),
  trialDays: z.coerce.number().int().min(0).max(90),
  // Optional Owner
  ownerFirstName: z.string().max(100).optional(),
  ownerLastName: z.string().max(100).optional(),
  ownerEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  // Optional Branding
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex code (e.g. #2563eb)')
    .optional()
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex code')
    .optional()
    .or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  customDomain: z.string().max(253).optional().or(z.literal('')),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

export function CreateTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      planTier: 'free',
      trialDays: 14,
      ownerFirstName: '',
      ownerLastName: '',
      ownerEmail: '',
      ownerPassword: '',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: '',
      customDomain: '',
    },
  });

  const nameValue = watch('name');

  const createMutation = useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      navigate(`/admin/tenants/${data.id}`);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create tenant institution.');
    },
  });

  const onSubmit = (data: CreateTenantFormData) => {
    setErrorMessage(null);

    const payload: CreateTenantInput = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      planTier: data.planTier,
      trialDays: Number(data.trialDays),
      branding: {
        name: data.name.trim(),
        primaryColor: data.primaryColor || undefined,
        secondaryColor: data.secondaryColor || undefined,
        logoUrl: data.logoUrl || undefined,
        customDomain: data.customDomain?.trim() || undefined,
      },
    };

    if (data.ownerEmail && data.ownerPassword) {
      payload.ownerEmail = data.ownerEmail.trim().toLowerCase();
      payload.ownerPassword = data.ownerPassword;
      payload.ownerFirstName = data.ownerFirstName?.trim() || 'Admin';
      payload.ownerLastName = data.ownerLastName?.trim() || 'User';
    }

    createMutation.mutate(payload);
  };

  const handleNameBlur = () => {
    const currentSlug = watch('slug');
    if (!currentSlug && nameValue) {
      setValue('slug', slugify(nameValue), { shouldValidate: true });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-2">
          <Link
            to="/admin/tenants"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Tenants</span>
          </Link>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Super Admin Action
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-7 h-7 text-primary-600" />
            <span>Provision New University Tenant</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create an isolated multi-tenant academic instance, assign subscription limits, and bootstrap its initial institution administrator.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Creation Failed" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Section 1: Core Institution Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-primary-600" />
                <span>Institution Identity &amp; Routing</span>
              </CardTitle>
              <CardDescription>
                Essential identifier information for multi-tenant database partitioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Institution / University Name"
                  placeholder="e.g. Stanford University"
                  required
                  error={errors.name?.message}
                  {...register('name', { onBlur: handleNameBlur })}
                />

                <div>
                  <Input
                    label="Tenant Slug (Subdomain identifier)"
                    placeholder="e.g. stanford"
                    required
                    helperText="Used for headers, subdomains, and URL paths"
                    error={errors.slug?.message}
                    {...register('slug')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Select
                  label="Subscription Plan Tier"
                  options={[
                    { value: 'free', label: 'Free (Evaluation & Sandbox)' },
                    { value: 'starter', label: 'Starter (Small Colleges, 500 Students)' },
                    { value: 'professional', label: 'Professional (Full Depts, 5,000 Students)' },
                    { value: 'enterprise', label: 'Enterprise (Multi-Campus, 100K+ Students)' },
                  ]}
                  error={errors.planTier?.message}
                  {...register('planTier')}
                />

                <Input
                  label="Initial Trial Period (Days)"
                  type="number"
                  placeholder="14"
                  helperText="Days before the tenant moves from trialing to active/past_due"
                  error={errors.trialDays?.message}
                  {...register('trialDays')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Initial Institution Administrator (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Primary Tenant Administrator Account (Optional)</span>
              </CardTitle>
              <CardDescription>
                Optionally provision the institution dean or primary administrator account immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Admin First Name"
                  placeholder="Jane"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.ownerFirstName?.message}
                  {...register('ownerFirstName')}
                />

                <Input
                  label="Admin Last Name"
                  placeholder="Doe"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.ownerLastName?.message}
                  {...register('ownerLastName')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Admin Email Address"
                  type="email"
                  placeholder="dean.doe@stanford.edu"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.ownerEmail?.message}
                  {...register('ownerEmail')}
                />

                <Input
                  label="Initial Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.ownerPassword?.message}
                  {...register('ownerPassword')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Branding & Custom Domain (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                <span>Institutional Branding &amp; Custom Domain</span>
              </CardTitle>
              <CardDescription>
                Customize colors, campus logos, and domain routing for this instance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Primary Brand Color (Hex)"
                  placeholder="#2563eb"
                  helperText="Primary buttons, navigation highlights"
                  error={errors.primaryColor?.message}
                  {...register('primaryColor')}
                />

                <Input
                  label="Secondary Brand Color (Hex)"
                  placeholder="#1e40af"
                  error={errors.secondaryColor?.message}
                  {...register('secondaryColor')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Logo URL"
                  placeholder="https://example.com/logo.png"
                  helperText="Public image link for campus header"
                  error={errors.logoUrl?.message}
                  {...register('logoUrl')}
                />

                <Input
                  label="Custom Domain (Optional)"
                  placeholder="lms.stanford.edu"
                  helperText="Requires Professional or Enterprise tier"
                  error={errors.customDomain?.message}
                  {...register('customDomain')}
                />
              </div>
            </CardContent>

            <CardFooter className="justify-end gap-3">
              <Link to="/admin/tenants">
                <Button variant="outline" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={createMutation.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Provision Tenant Instance
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}

export default CreateTenantPage;
