import { Router } from 'express';
import * as ctrl from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

export const userRouter = Router();

userRouter.use(authenticate, resolveTenant);

userRouter.get('/', requirePermission('user', 'read'), ctrl.listUsers);
userRouter.get('/pending', requirePermission('user', 'manage'), ctrl.listPendingUsers);
userRouter.get('/:id', requirePermission('user', 'read'), ctrl.getUser);
userRouter.post('/:id/approve', requirePermission('user', 'manage'), ctrl.approveUser);
userRouter.post('/:id/reject', requirePermission('user', 'manage'), ctrl.rejectUser);
userRouter.patch('/:id/active', requirePermission('user', 'manage'), ctrl.setUserActive);
