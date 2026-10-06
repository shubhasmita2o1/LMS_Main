import { Router } from 'express';
import * as ctrl from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

export const userRouter = Router();

userRouter.use(authenticate, resolveTenant);

userRouter.get('/', requirePermission('user', 'read'), ctrl.listUsers);
userRouter.get('/:id', requirePermission('user', 'read'), ctrl.getUser);