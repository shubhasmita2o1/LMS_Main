import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badgeText?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  badgeText = 'Academic Cloud • Multi-Tenant SaaS',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-900 selection:bg-primary-500 selection:text-white">
      {/* LEFT: Authentication Portal (Form Side) */}
      <div className="w-full lg:w-[54%] xl:w-[50%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white border-r border-slate-200/80 relative z-10 shadow-xl lg:shadow-none">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                University<span className="text-primary-600">LMS</span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Enterprise Academic Suite
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100/80">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              <span>{badgeText}</span>
            </span>
          </div>
        </header>

        {/* Center Content: Title & Form */}
        <main className="my-auto py-6 sm:py-8 max-w-lg w-full mx-auto">
          <div className="mb-8 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </main>

        {/* Bottom Footer */}
        <footer className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-600">All LMS Services Operational</span>
            <span className="text-slate-300">•</span>
            <span>v0.2.0</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#help" className="hover:text-slate-600 transition-colors">
              Help Center
            </a>
            <a href="#privacy" className="hover:text-slate-600 transition-colors">
              Privacy
            </a>
            <a href="#terms" className="hover:text-slate-600 transition-colors">
              Terms &amp; FERPA
            </a>
          </div>
        </footer>
      </div>

      {/* RIGHT: Visual Showcase & Brand Hero (Desktop only) */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] min-h-screen bg-slate-950 text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Background Gradients & Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary-950/70 to-indigo-950/90 pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Decorative subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Tagline */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/90">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Enterprise Security</span>
          </div>
          <span className="text-xs text-white/60 font-mono">SOC2 • FERPA • ISO 27001</span>
        </div>

        {/* Center: Hero Cards Mockups */}
        <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl mx-auto w-full">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-primary-400 mb-2 block">
              Higher Education Cloud
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              One unified platform for universities, faculty &amp; students.
            </h2>
            <p className="mt-3 text-slate-300 text-sm xl:text-base leading-relaxed">
              Automated course management, grading workflows, real-time analytics, and strictly isolated multi-tenant architecture designed for modern academia.
            </p>
          </div>

          {/* Interactive Feature Mockup Card 1: Live Course */}
          <div className="p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-400/30 flex items-center justify-center text-primary-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">CS-402: Distributed Systems</h4>
                  <p className="text-xs text-slate-300">Department of Computer Science</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> In Session
              </span>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>Semester Syllabus Progress</span>
                <span className="text-white font-bold">84%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-400 rounded-full w-[84%]" />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                <span>Next Lecture: Raft Consensus (Today, 2:00 PM)</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-white">
                <Users className="w-3.5 h-3.5 text-primary-400" />
                <span>148 Enrolled</span>
              </div>
            </div>
          </div>

          {/* Feature Badge Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-center">
              <div className="text-xl font-bold text-white">120+</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Universities</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-center">
              <div className="text-xl font-bold text-white">50K+</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Active Learners</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-center">
              <div className="text-xl font-bold text-white">99.99%</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Uptime SLA</div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 pt-6 border-t border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-600/30 border border-primary-400/40 flex items-center justify-center text-primary-300 shrink-0 font-bold text-sm">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs xl:text-sm text-slate-300 italic leading-relaxed">
                &ldquo;University LMS transformed our cross-campus collaboration. The multi-tenant security and intuitive portal make life effortless for faculty and students alike.&rdquo;
              </p>
              <div className="mt-2 text-xs font-semibold text-white flex items-center gap-2">
                <span>Dr. Evelyn Rivera</span>
                <span className="text-white/40">•</span>
                <span className="text-slate-400 font-normal">Dean of Academic Affairs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
