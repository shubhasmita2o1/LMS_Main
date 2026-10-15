import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './question-bank.controller';

export const questionBankRouter = Router();

questionBankRouter.use(authenticate, resolveTenant);

// Subjects
questionBankRouter.get('/subjects', requirePermission('question', 'read'), ctrl.listSubjects);
questionBankRouter.post('/subjects', requirePermission('question', 'manage'), ctrl.createSubject);
questionBankRouter.patch(
  '/subjects/:id',
  requirePermission('question', 'manage'),
  ctrl.updateSubject
);
questionBankRouter.delete(
  '/subjects/:id',
  requirePermission('question', 'manage'),
  ctrl.deleteSubject
);

// Units
questionBankRouter.get('/units', requirePermission('question', 'read'), ctrl.listUnits);
questionBankRouter.post('/units', requirePermission('question', 'manage'), ctrl.createUnit);
questionBankRouter.patch('/units/:id', requirePermission('question', 'manage'), ctrl.updateUnit);
questionBankRouter.delete('/units/:id', requirePermission('question', 'manage'), ctrl.deleteUnit);

// Topics
questionBankRouter.get('/topics', requirePermission('question', 'read'), ctrl.listTopics);
questionBankRouter.post('/topics', requirePermission('question', 'manage'), ctrl.createTopic);
questionBankRouter.patch('/topics/:id', requirePermission('question', 'manage'), ctrl.updateTopic);
questionBankRouter.delete('/topics/:id', requirePermission('question', 'manage'), ctrl.deleteTopic);

// Questions
questionBankRouter.get('/questions/export', requirePermission('question', 'read'), ctrl.exportQuestions);
questionBankRouter.post(
  '/questions/import',
  requirePermission('question', 'manage'),
  ctrl.importQuestions
);
questionBankRouter.get('/questions', requirePermission('question', 'read'), ctrl.listQuestions);
questionBankRouter.post('/questions', requirePermission('question', 'manage'), ctrl.createQuestion);
questionBankRouter.get('/questions/:id', requirePermission('question', 'read'), ctrl.getQuestion);
questionBankRouter.patch(
  '/questions/:id',
  requirePermission('question', 'manage'),
  ctrl.updateQuestion
);
questionBankRouter.delete(
  '/questions/:id',
  requirePermission('question', 'manage'),
  ctrl.deleteQuestion
);
