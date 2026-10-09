import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import type { ApiResponse, UniversityPublic } from '@university-lms/shared';

export function CreateUniversityPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'private',
    address: '',
    contactEmail: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ApiResponse<UniversityPublic>>('/academic/universities', form);
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed');
      }
      navigate('/academic');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: ApiResponse }; message?: string };
      setError(ax.response?.data?.error?.message || ax.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/academic" className="text-sm text-slate-600 hover:text-slate-900">
            ← Academic
          </Link>
          <span className="font-semibold text-slate-900">New University</span>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-6 py-8">
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="deemed">Deemed</option>
              <option value="autonomous">Autonomous</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create university'}
          </button>
        </form>
      </main>
    </div>
  );
}
