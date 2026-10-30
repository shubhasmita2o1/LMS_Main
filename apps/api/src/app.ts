import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { defaultApiRateLimit } from './middleware/rateLimit';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { tenantRouter } from './modules/tenants/tenant.routes';
import { billingRouter, webhookRouter } from './modules/billing/billing.routes';
import { academicRouter } from './modules/academic/academic.routes';
import { studentRouter } from './modules/students/student.routes';
import { facultyRouter } from './modules/faculty/faculty.routes';
import { courseRouter } from './modules/courses/course.routes';
import { learnRouter } from './modules/learn/learn.routes';
import { questionBankRouter } from './modules/question-bank/question-bank.routes';
import { assignmentRouter } from './modules/assignments/assignment.routes';
import { quizRouter } from './modules/quizzes/quiz.routes';
import { gradebookRouter } from './modules/gradebook/gradebook.routes';
import { attendanceRouter } from './modules/attendance/attendance.routes';
import { labRouter } from './modules/labs/lab.routes';
import { examRouter } from './modules/examinations/exam.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { announcementRouter } from './modules/announcements/announcement.routes';
import {
  discussionRouter,
  courseDiscussionRouter,
} from './modules/discussions/discussion.routes';
import { timetableRouter } from './modules/timetable/timetable.routes';
import {
  transcriptRouter,
  certificateRouter,
  publicVerifyRouter,
} from './modules/transcripts/transcript.routes';
import { libraryRouter } from './modules/library/library.routes';
import { placementRouter } from './modules/placement/placement.routes';
import { supportRouter } from './modules/support/support.routes';
import { env } from './config/env';
import path from 'path';

export function createApp() {
  const app = express();

  // Trust proxy when behind CDN / load balancer (custom domains, Cloudflare, etc.)
  app.set('trust proxy', 1);

  // Security & basics
  app.use(helmet());
  // CORS_ORIGIN: single origin or comma-separated list.
  // Also allow this project's Vercel production + preview hosts.
  const corsOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        try {
          const host = new URL(origin).hostname;
          if (
            host === 'university-lms-web.vercel.app' ||
            (host.endsWith('.vercel.app') && host.includes('university-lms-web'))
          ) {
            return callback(null, true);
          }
        } catch {
          /* ignore */
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Stripe webhooks need raw body for signature verification in production.
  // For skeleton we accept JSON; mount raw parser selectively if needed later.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Global rate limit (skeleton — tighten per-route later)
  app.use(defaultApiRateLimit);

  // Health check (no auth)
  app.use('/health', healthRouter);

  // API version prefix
  app.get('/api/v1', (_req, res) => {
    res.json({
      success: true,
      message: 'University LMS API v1',
      version: '0.16.0',
      phase: 16,
      docs: '/api/v1 (OpenAPI coming in later phases)',
    });
  });

  // Local uploads static serve (dev)
  app.use('/uploads', express.static(path.resolve(env.STORAGE_LOCAL_PATH || './uploads')));

  // Phase 2 modules
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);

  // Phase 3 modules
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/tenants', tenantRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/webhooks', webhookRouter);

  // Phase 4 — Academic hierarchy
  app.use('/api/v1/academic', academicRouter);

  // Phase 5 — Student Information System
  app.use('/api/v1/students', studentRouter);

  // Phase 6 — Faculty Management
  app.use('/api/v1/faculty', facultyRouter);

  // Phase 7 — Curriculum & Course Management
  app.use('/api/v1/courses', courseRouter);

  // Phase 8 — Core LMS / Theory Learning
  app.use('/api/v1/learn', learnRouter);

  // Phase 9 — Assignments, Quiz & Question Bank
  app.use('/api/v1/question-bank', questionBankRouter);
  app.use('/api/v1/assignments', assignmentRouter);
  app.use('/api/v1/quizzes', quizRouter);
  app.use('/api/v1/gradebook', gradebookRouter);
  app.use('/api/v1/attendance', attendanceRouter);

  // Phase 11 — Practical & Lab Platform (execution isolated via ExecutionAdapter)
  app.use('/api/v1/labs', labRouter);

  // Phase 12 — Examination System
  app.use('/api/v1/exams', examRouter);

  // Phase 13 — Communication, Notifications & Discussion
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/announcements', announcementRouter);
  app.use('/api/v1/discussions', discussionRouter);
  app.use('/api/v1/courses/:courseId/discussions', courseDiscussionRouter);

  // Phase 14 — Timetable & Transcripts
  app.use('/api/v1/timetable', timetableRouter);
  app.use('/api/v1/transcripts', transcriptRouter);
  app.use('/api/v1/certificates', certificateRouter);
  app.use('/api/v1/public/verify', publicVerifyRouter);

  // Phase 16 — Library, Placement, Support
  app.use('/api/v1/library', libraryRouter);
  app.use('/api/v1/placement', placementRouter);
  app.use('/api/v1/support', supportRouter);

  // 404 & error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
