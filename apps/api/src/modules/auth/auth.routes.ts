import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimit, loginRateLimit } from '../../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, ctrl.register);
authRouter.post('/login', loginRateLimit, ctrl.login);
authRouter.post('/refresh', authRateLimit, ctrl.refresh);
authRouter.post('/logout', authenticate, ctrl.logout);
authRouter.post('/logout-all', authenticate, ctrl.logoutAll);
authRouter.get('/me', authenticate, ctrl.me);
authRouter.post('/forgot-password', authRateLimit, ctrl.forgotPassword);
authRouter.post('/reset-password', authRateLimit, ctrl.resetPassword);
