import { Router } from 'express';
import * as controller from './setup.controller';

const router = Router();

/**
 * First-run setup endpoints.
 * Public while installation is unlocked; permanently 403 after lock.
 * No authentication required for bootstrap (there is no admin yet).
 */
router.get('/status', controller.getStatus);
router.post('/complete', controller.complete);

export const setupRouter = router;
