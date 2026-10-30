import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './placement.controller';

export const placementRouter = Router();
placementRouter.use(authenticate, resolveTenant);

// Companies
placementRouter.get('/companies', requirePermission('placement', 'read'), ctrl.listCompanies);
placementRouter.post('/companies', requirePermission('placement', 'manage'), ctrl.createCompany);
placementRouter.patch(
  '/companies/:id',
  requirePermission('placement', 'manage'),
  ctrl.updateCompany
);
placementRouter.delete(
  '/companies/:id',
  requirePermission('placement', 'manage'),
  ctrl.deleteCompany
);

// Drives
placementRouter.get('/drives', requirePermission('placement', 'read'), ctrl.listDrives);
placementRouter.get('/drives/:id', requirePermission('placement', 'read'), ctrl.getDrive);
placementRouter.post('/drives', requirePermission('placement', 'manage'), ctrl.createDrive);
placementRouter.patch('/drives/:id', requirePermission('placement', 'manage'), ctrl.updateDrive);
placementRouter.post('/drives/:id/open', requirePermission('placement', 'manage'), ctrl.openDrive);
placementRouter.post('/drives/:id/close', requirePermission('placement', 'manage'), ctrl.closeDrive);
placementRouter.post(
  '/drives/:id/complete',
  requirePermission('placement', 'manage'),
  ctrl.completeDrive
);
placementRouter.delete('/drives/:id', requirePermission('placement', 'manage'), ctrl.deleteDrive);

// Applications
placementRouter.post('/applications', requirePermission('placement', 'apply'), ctrl.apply);
placementRouter.get(
  '/applications',
  requirePermission('placement', 'read'),
  ctrl.listApplications
);
placementRouter.get(
  '/applications/me',
  requirePermission('placement', 'read'),
  ctrl.listApplications
);
placementRouter.patch(
  '/applications/:id/status',
  requirePermission('placement', 'manage'),
  ctrl.updateApplicationStatus
);
placementRouter.post(
  '/applications/:id/withdraw',
  requirePermission('placement', 'apply'),
  ctrl.withdrawApplication
);

// Interviews
placementRouter.get('/interviews', requirePermission('placement', 'read'), ctrl.listInterviews);
placementRouter.post('/interviews', requirePermission('placement', 'manage'), ctrl.createInterview);
placementRouter.patch(
  '/interviews/:id',
  requirePermission('placement', 'manage'),
  ctrl.updateInterview
);

// Offers
placementRouter.get('/offers', requirePermission('placement', 'read'), ctrl.listOffers);
placementRouter.get('/offers/me', requirePermission('placement', 'read'), ctrl.listOffers);
placementRouter.post('/offers', requirePermission('placement', 'manage'), ctrl.createOffer);
placementRouter.post(
  '/offers/:id/respond',
  requirePermission('placement', 'apply'),
  ctrl.respondOffer
);
