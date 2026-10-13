import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../lib/api';
import type { ApiResponse, TenantPublic } from '@university-lms/shared';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers, hyphens only'),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownerFirstName: z.string().optional(),
  ownerLastName: z.string().optional(),
  ownerPassword: z.string().optional(),
  trialDays: z.coerce.number().int().min(0).max(90).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateTenantPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { planTier: 'free', trialDays: 14 },
  });

  const name = watch('name');

  const onNameBlur = () => {
    if (name) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
      setValue('slug', slug, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        slug: values.slug,
        planTier: values.planTier,
        trialDays: values.trialDays,
      };
      if (values.ownerEmail) {
        payload.ownerEmail = values.ownerEmail;
        payload.ownerFirstName = values.ownerFirstName || 'Tenant';
        payload.ownerLastName = values.ownerLastName || 'Admin';
        payload.ownerPassword = values.ownerPassword || 'ChangeMe1!';
      }
      const { data } = await api.post<ApiResponse<TenantPublic>>('/admin/tenants', payload);
      if (data.success && data.data) {
        navigate(`/admin/tenants/${data.data.id}`);
      } else {
        setServerError(data.error?.message || 'Failed to create tenant');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: ApiResponse } };
      setServerError(ax.response?.data?.error?.message || 'Request failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin/tenants" className="text-sm text-slate-600 hover:text-slate-900">
            ← Tenants
          </Link>
          <span className="font-semibold text-slate-900">Create Tenant</span>
          <span />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          {serverError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization name</label>
            <input
              {...register('name')}
              onBlur={onNameBlur}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Acme University"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input
              {...register('slug')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="acme-university"
            />
            {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
              <select
                {...register('planTier')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trial days</label>
              <input
                type="number"
                {...register('trialDays')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Owner account (optional)
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner email</label>
                <input
                  type="email"
                  {...register('ownerEmail')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="admin@acme.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                <input
                  {...register('ownerFirstName')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                <input
                  {...register('ownerLastName')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Temporary password
                </label>
                <input
                  type="password"
                  {...register('ownerPassword')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Min 8 chars, letter + number"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/admin/tenants"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-60"
            >
              {isSubmitting ? 'Creating…' : 'Create tenant'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
