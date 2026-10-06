import { Routes, Route, Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-6">
          UL
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">University LMS</h1>
        <p className="text-slate-500 mb-8">
          Multi-tenant SaaS platform • Phase 0 &amp; 1 foundation ready
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-sm font-medium text-slate-500 mb-1">Frontend</div>
            <div className="font-semibold text-slate-800">
              React + Vite + TypeScript + Tailwind
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-sm font-medium text-slate-500 mb-1">Backend</div>
            <div className="font-semibold text-slate-800">
              Express Modular Monolith + MongoDB
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="http://localhost:4000/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
          >
            Check API Health
          </a>
          <Link
            to="/login"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Go to Login (Phase 2)
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Phase 0 + Phase 1 complete • Awaiting review before Phase 2
        </p>
      </div>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Authentication module will be implemented in Phase 2.
        </p>
        <Link
          to="/"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
