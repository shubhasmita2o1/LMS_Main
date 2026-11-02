import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as controller from './institution.controller';

const router = Router();

/** Public-ish status for setup UI (no auth required) */
router.get('/installation-status', controller.getInstallationStatus);

/** Authenticated institution profile */
router.get(
  '/',
  authenticate,
  controller.getCurrentInstitution
);

router.patch(
  '/',
  authenticate,
  requirePermission('setting', 'manage'),
  controller.updateCurrentInstitution
);

export const institutionRouter = router;
