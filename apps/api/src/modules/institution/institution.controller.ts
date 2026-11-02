import { Request, Response, NextFunction } from 'express';
import * as institutionService from './institution.service';

export async function getCurrentInstitution(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const institution = await institutionService.getInstitution();
    res.json({
      success: true,
      data: {
        id: String(institution._id),
        tenantId: String(institution.tenantId),
        name: institution.name,
        code: institution.code,
        type: institution.type,
        branding: institution.branding,
        hierarchyConfig: institution.hierarchyConfig,
        featureToggles: institution.featureToggles,
        settings: institution.settings,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCurrentInstitution(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const institution = await institutionService.updateInstitution(req.body);
    res.json({
      success: true,
      data: {
        id: String(institution._id),
        tenantId: String(institution.tenantId),
        name: institution.name,
        code: institution.code,
        type: institution.type,
        branding: institution.branding,
        hierarchyConfig: institution.hierarchyConfig,
        featureToggles: institution.featureToggles,
        settings: institution.settings,
        updatedAt: institution.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getInstallationStatus(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const state = await institutionService.getInstallationState();
    const locked = Boolean(state?.locked);
    res.json({
      success: true,
      data: {
        locked,
        lockedAt: state?.lockedAt ?? null,
        setupVersion: state?.setupVersion ?? null,
        completedSteps: state?.completedSteps ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
}
