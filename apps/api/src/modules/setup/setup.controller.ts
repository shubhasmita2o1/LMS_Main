import { Request, Response, NextFunction } from 'express';
import { completeSetupSchema } from './setup.validation';
import * as setupService from './setup.service';
import {
  getInstallationState,
  isInstallationLocked,
  ensureInstallationDocument,
} from '../institution/institution.service';
import { AppError } from '../../middleware/errorHandler';

export async function getStatus(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await ensureInstallationDocument();
    const state = await getInstallationState();
    res.json({
      success: true,
      data: {
        locked: Boolean(state?.locked),
        lockedAt: state?.lockedAt ?? null,
        setupVersion: state?.setupVersion ?? null,
        completedSteps: state?.completedSteps ?? [],
        canRunSetup: !state?.locked,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function complete(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (await isInstallationLocked()) {
      throw new AppError(403, 'Installation is already completed and locked.', 'INSTALLATION_LOCKED');
    }

    const parsed = completeSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten());
    }

    const result = await setupService.completeSetup(parsed.data);

    res.status(201).json({
      success: true,
      message:
        'Installation completed. Sign in with the Institution Super Admin credentials. Setup endpoints are now locked permanently.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
