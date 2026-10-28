import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './transcript.controller';

export const transcriptRouter = Router();
transcriptRouter.use(authenticate, resolveTenant);

transcriptRouter.get('/', requirePermission('transcript', 'read'), ctrl.listTranscripts);
transcriptRouter.get('/me', requirePermission('transcript', 'read'), ctrl.listTranscripts);
transcriptRouter.post('/generate', requirePermission('transcript', 'manage'), ctrl.generateTranscript);
transcriptRouter.get('/:id', requirePermission('transcript', 'read'), ctrl.getTranscript);
transcriptRouter.post('/:id/issue', requirePermission('transcript', 'issue'), ctrl.issueTranscript);
transcriptRouter.post('/:id/revoke', requirePermission('transcript', 'manage'), ctrl.revokeTranscript);

export const certificateRouter = Router();
certificateRouter.use(authenticate, resolveTenant);

certificateRouter.get('/', requirePermission('certificate', 'read'), ctrl.listCertificates);
certificateRouter.get('/me', requirePermission('certificate', 'read'), ctrl.listCertificates);
certificateRouter.post('/', requirePermission('certificate', 'manage'), ctrl.createCertificate);
certificateRouter.post('/:id/issue', requirePermission('certificate', 'issue'), ctrl.issueCertificate);
certificateRouter.post('/:id/revoke', requirePermission('certificate', 'manage'), ctrl.revokeCertificate);

/** Public verify — no auth */
export const publicVerifyRouter = Router();
publicVerifyRouter.get('/:code', ctrl.publicVerify);
