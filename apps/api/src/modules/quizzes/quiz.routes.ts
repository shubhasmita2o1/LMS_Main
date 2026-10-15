import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './quiz.controller';

export const quizRouter = Router();

quizRouter.use(authenticate, resolveTenant);

quizRouter.get('/', requirePermission('quiz', 'read'), ctrl.list);
quizRouter.post('/', requirePermission('quiz', 'manage'), ctrl.create);

quizRouter.get('/attempts/:id', requirePermission('quiz', 'read'), ctrl.getAttempt);
quizRouter.post('/attempts/:id/answer', requirePermission('quiz', 'read'), ctrl.saveAnswers);
quizRouter.post('/attempts/:id/submit', requirePermission('quiz', 'read'), ctrl.submit);
quizRouter.post('/attempts/:id/grade', requirePermission('quiz', 'manage'), ctrl.grade);

quizRouter.get('/:id', requirePermission('quiz', 'read'), ctrl.getById);
quizRouter.patch('/:id', requirePermission('quiz', 'manage'), ctrl.update);
quizRouter.delete('/:id', requirePermission('quiz', 'manage'), ctrl.remove);
quizRouter.post('/:id/publish', requirePermission('quiz', 'manage'), ctrl.publish);
quizRouter.post('/:id/questions', requirePermission('quiz', 'manage'), ctrl.attachQuestions);
quizRouter.post('/:id/start', requirePermission('quiz', 'read'), ctrl.start);
quizRouter.get('/:id/attempts/me', requirePermission('quiz', 'read'), ctrl.myAttempts);
quizRouter.get('/:id/attempts', requirePermission('quiz', 'manage'), ctrl.listAttempts);
