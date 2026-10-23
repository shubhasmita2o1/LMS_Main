import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { rateLimit } from '../../middleware/rateLimit';
import * as ctrl from './lab.controller';

export const labRouter = Router();

labRouter.use(authenticate, resolveTenant);

/** Stricter rate limit on student code submissions */
const submitRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `lab-submit:${req.user?.id || req.ip || 'unknown'}`,
});

const requeueRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => `lab-requeue:${req.user?.id || req.ip || 'unknown'}`,
});

// ─── Practicals ─────────────────────────────────────────────────────────────
labRouter.get('/practicals', requirePermission('lab', 'read'), ctrl.listPracticals);
labRouter.post('/practicals', requirePermission('lab', 'manage'), ctrl.createPractical);
labRouter.get('/practicals/:id', requirePermission('lab', 'read'), ctrl.getPractical);
labRouter.patch('/practicals/:id', requirePermission('lab', 'manage'), ctrl.updatePractical);
labRouter.delete('/practicals/:id', requirePermission('lab', 'manage'), ctrl.deletePractical);
labRouter.post(
  '/practicals/:id/publish',
  requirePermission('lab', 'manage'),
  ctrl.publishPractical
);

// ─── Labs under practical ───────────────────────────────────────────────────
labRouter.get(
  '/practicals/:practicalId/labs',
  requirePermission('lab', 'read'),
  ctrl.listLabs
);
labRouter.post('/labs', requirePermission('lab', 'manage'), ctrl.createLab);
labRouter.patch('/labs/:id', requirePermission('lab', 'manage'), ctrl.updateLab);
labRouter.delete('/labs/:id', requirePermission('lab', 'manage'), ctrl.deleteLab);

// ─── Experiments ────────────────────────────────────────────────────────────
labRouter.get(
  '/labs/:labId/experiments',
  requirePermission('lab', 'read'),
  ctrl.listExperiments
);
labRouter.post('/experiments', requirePermission('lab', 'manage'), ctrl.createExperiment);
labRouter.get('/experiments/:id', requirePermission('lab', 'read'), ctrl.getExperiment);
labRouter.patch('/experiments/:id', requirePermission('lab', 'manage'), ctrl.updateExperiment);
labRouter.put(
  '/experiments/:id/test-cases',
  requirePermission('lab', 'manage'),
  ctrl.replaceTestCases
);
labRouter.delete('/experiments/:id', requirePermission('lab', 'manage'), ctrl.deleteExperiment);

// ─── Submissions (student) ──────────────────────────────────────────────────
labRouter.post(
  '/experiments/:experimentId/submissions',
  requirePermission('lab', 'submit'),
  submitRateLimit,
  ctrl.submit
);
// Also allow read permission for students who may only have lab:read in older role sets
labRouter.post(
  '/experiments/:experimentId/submit',
  requirePermission('lab', 'read'),
  submitRateLimit,
  ctrl.submit
);
labRouter.get(
  '/experiments/:experimentId/my-submissions',
  requirePermission('lab', 'read'),
  ctrl.mySubmissions
);
labRouter.get(
  '/experiments/:experimentId/submissions',
  requirePermission('lab', 'manage'),
  ctrl.listSubmissions
);

labRouter.get('/submissions/:id', requirePermission('lab', 'read'), ctrl.getSubmission);
labRouter.post(
  '/submissions/:id/evaluate',
  requirePermission('lab', 'manage'),
  ctrl.evaluate
);
labRouter.post(
  '/submissions/:id/requeue',
  requirePermission('lab', 'manage'),
  requeueRateLimit,
  ctrl.requeue
);

// ─── Execution jobs ─────────────────────────────────────────────────────────
labRouter.get('/executions/:jobId', requirePermission('lab', 'read'), ctrl.getJob);
