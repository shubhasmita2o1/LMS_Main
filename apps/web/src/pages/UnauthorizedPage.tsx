import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Access Denied (403)
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You don&apos;t have the necessary roles or permissions to access this page. Please contact your organization administrator if you believe this is a mistake.
        </p>

        {user && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left mb-6 space-y-1">
            <div className="text-slate-500">
              Signed in as: <span className="font-mono text-slate-800">{user.email}</span>
            </div>
            <div className="text-slate-500">
              Active role(s):{' '}
              <span className="font-medium text-slate-800">
                {user.roles?.join(', ') || 'None'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="flex-1">
            <Button variant="primary" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="flex-1"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
