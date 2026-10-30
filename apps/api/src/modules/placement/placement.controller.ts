import { Request, Response, NextFunction } from 'express';
import * as svc from './placement.service';
import {
  createCompanySchema,
  updateCompanySchema,
  createDriveSchema,
  updateDriveSchema,
  listDrivesQuerySchema,
  applySchema,
  updateApplicationStatusSchema,
  createInterviewSchema,
  updateInterviewSchema,
  createOfferSchema,
  respondOfferSchema,
  listApplicationsQuerySchema,
} from './placement.validation';
import { z } from 'zod';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}
function userId(req: Request): string {
  return String(req.user?.id || '');
}
function currentUser(req: Request) {
  return { id: userId(req), roles: (req.user?.roles || []) as string[] };
}

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const q = z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
      })
      .parse(req.query);
    const data = await svc.listCompanies(tenantId(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createCompanySchema.parse(req.body);
    const data = await svc.createCompany(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateCompanySchema.parse(req.body);
    const data = await svc.updateCompany(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.deleteCompany(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listDrives(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listDrivesQuerySchema.parse(req.query);
    const data = await svc.listDrives(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getDrive(tenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createDriveSchema.parse(req.body);
    const data = await svc.createDrive(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateDriveSchema.parse(req.body);
    const data = await svc.updateDrive(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function openDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.setDriveStatus(tenantId(req), req.params.id, 'open', userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function closeDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.setDriveStatus(tenantId(req), req.params.id, 'closed', userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function completeDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.setDriveStatus(tenantId(req), req.params.id, 'completed', userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteDrive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.deleteDrive(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const body = applySchema.parse(req.body);
    const data = await svc.applyToDrive(tenantId(req), body, currentUser(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listApplicationsQuerySchema.parse(req.query);
    const data = await svc.listApplications(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateApplicationStatusSchema.parse(req.body);
    const data = await svc.updateApplicationStatus(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function withdrawApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.withdrawApplication(tenantId(req), req.params.id, currentUser(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createInterview(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createInterviewSchema.parse(req.body);
    const data = await svc.createInterview(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateInterview(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateInterviewSchema.parse(req.body);
    const data = await svc.updateInterview(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listInterviews(req: Request, res: Response, next: NextFunction) {
  try {
    const applicationId = req.query.applicationId as string | undefined;
    const data = await svc.listInterviews(tenantId(req), applicationId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createOfferSchema.parse(req.body);
    const data = await svc.createOffer(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = z
      .object({ studentId: z.string().optional(), status: z.string().optional() })
      .parse(req.query);
    const data = await svc.listOffers(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function respondOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = respondOfferSchema.parse(req.body);
    const data = await svc.respondOffer(tenantId(req), req.params.id, body.accept, currentUser(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
