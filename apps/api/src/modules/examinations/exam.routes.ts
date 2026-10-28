import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './exam.controller';

export const examRouter = Router();

examRouter.use(authenticate, resolveTenant);

// Centers
examRouter.get('/centers', requirePermission('exam', 'manage'), ctrl.listCenters);
examRouter.post('/centers', requirePermission('exam', 'manage'), ctrl.createCenter);
examRouter.patch('/centers/:id', requirePermission('exam', 'manage'), ctrl.updateCenter);
examRouter.delete('/centers/:id', requirePermission('exam', 'manage'), ctrl.deleteCenter);

// Student shortcuts
examRouter.get('/my', requirePermission('exam', 'read'), ctrl.myExams);

// Exam list / create
examRouter.get('/', requirePermission('exam', 'read'), ctrl.list);
examRouter.post('/', requirePermission('exam', 'manage'), ctrl.create);

// Attempt nested under exam (before :id generic where needed)
examRouter.get('/:id/paper', requirePermission('exam', 'attempt'), ctrl.getPaper);
examRouter.post('/:id/attempts/start', requirePermission('exam', 'attempt'), ctrl.startAttempt);
examRouter.patch(
  '/:id/attempts/:attemptId/answers',
  requirePermission('exam', 'attempt'),
  ctrl.saveAnswers
);
examRouter.post(
  '/:id/attempts/:attemptId/flag',
  requirePermission('exam', 'attempt'),
  ctrl.flagQuestion
);
examRouter.post(
  '/:id/attempts/:attemptId/submit',
  requirePermission('exam', 'attempt'),
  ctrl.submitAttempt
);
examRouter.post(
  '/:id/attempts/:attemptId/events',
  requirePermission('exam', 'attempt'),
  ctrl.suspicionEvent
);
examRouter.get(
  '/:id/attempts/:attemptId/result',
  requirePermission('exam', 'read'),
  ctrl.getResult
);

examRouter.get('/:id/attempts', requirePermission('exam', 'manage'), ctrl.listAttempts);
examRouter.post(
  '/:id/attempts/:attemptId/manual-score',
  requirePermission('exam', 'manage'),
  ctrl.manualScore
);

examRouter.post('/:id/questions', requirePermission('exam', 'manage'), ctrl.attachQuestions);
examRouter.post('/:id/allocations', requirePermission('exam', 'manage'), ctrl.allocate);
examRouter.get('/:id/allocations', requirePermission('exam', 'manage'), ctrl.listAllocations);
examRouter.post('/:id/invigilators', requirePermission('exam', 'manage'), ctrl.addInvigilator);
examRouter.get('/:id/invigilators', requirePermission('exam', 'read'), ctrl.listInvigilators);
examRouter.post('/:id/publish', requirePermission('exam', 'manage'), ctrl.publish);
examRouter.post('/:id/close', requirePermission('exam', 'manage'), ctrl.close);

examRouter.get('/:id', requirePermission('exam', 'read'), ctrl.getById);
examRouter.patch('/:id', requirePermission('exam', 'manage'), ctrl.update);
