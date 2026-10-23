import { Request, Response, NextFunction } from 'express';
import * as service from './lab.service';
import {
  listPracticalsQuerySchema,
  practicalCreateSchema,
  practicalUpdateSchema,
  labCreateSchema,
  labUpdateSchema,
  experimentCreateSchema,
  experimentUpdateSchema,
  testCasesReplaceSchema,
  submitLabSchema,
  evaluateSubmissionSchema,
  listSubmissionsQuerySchema,
} from './lab.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantId(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant required', 'TENANT_REQUIRED');
  return String(id);
}

function user(req: Request) {
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  return req.user;
}

// ─── Practicals ─────────────────────────────────────────────────────────────

export async function listPracticals(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listPracticalsQuerySchema.parse(req.query);
    const data = await service.listPracticals(tenantId(req), user(req), q);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function createPractical(req: Request, res: Response, next: NextFunction) {
  try {
    const body = practicalCreateSchema.parse(req.body);
    const data = await service.createPractical(tenantId(req), user(req), body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getPractical(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getPractical(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function updatePractical(req: Request, res: Response, next: NextFunction) {
  try {
    const body = practicalUpdateSchema.parse(req.body);
    const data = await service.updatePractical(tenantId(req), req.params.id, user(req), body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function deletePractical(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.deletePractical(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function publishPractical(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.publishPractical(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// ─── Labs ───────────────────────────────────────────────────────────────────

export async function listLabs(req: Request, res: Response, next: NextFunction) {
  try {
    const practicalId = req.params.practicalId || (req.query.practicalId as string);
    if (!practicalId) throw new AppError(400, 'practicalId required', 'VALIDATION');
    const data = await service.listLabs(tenantId(req), practicalId, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function createLab(req: Request, res: Response, next: NextFunction) {
  try {
    const body = labCreateSchema.parse(req.body);
    const data = await service.createLab(tenantId(req), user(req), body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function updateLab(req: Request, res: Response, next: NextFunction) {
  try {
    const body = labUpdateSchema.parse(req.body);
    const data = await service.updateLab(tenantId(req), req.params.id, user(req), body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function deleteLab(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.deleteLab(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// ─── Experiments ────────────────────────────────────────────────────────────

export async function listExperiments(req: Request, res: Response, next: NextFunction) {
  try {
    const labId = req.params.labId || (req.query.labId as string);
    if (!labId) throw new AppError(400, 'labId required', 'VALIDATION');
    const data = await service.listExperiments(tenantId(req), labId, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function createExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = experimentCreateSchema.parse(req.body);
    const data = await service.createExperiment(tenantId(req), user(req), body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getExperiment(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function updateExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = experimentUpdateSchema.parse(req.body);
    const data = await service.updateExperiment(tenantId(req), req.params.id, user(req), body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function replaceTestCases(req: Request, res: Response, next: NextFunction) {
  try {
    const body = testCasesReplaceSchema.parse(req.body);
    const data = await service.replaceTestCases(
      tenantId(req),
      req.params.id,
      user(req),
      body.testCases
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function deleteExperiment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.deleteExperiment(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// ─── Submissions ────────────────────────────────────────────────────────────

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const body = submitLabSchema.parse(req.body);
    const data = await service.submitExperiment(
      tenantId(req),
      req.params.experimentId,
      user(req),
      body
    );
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function mySubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMySubmissions(
      tenantId(req),
      req.params.experimentId,
      user(req)
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listSubmissionsQuerySchema.parse(req.query);
    const data = await service.listSubmissionsForExperiment(
      tenantId(req),
      req.params.experimentId,
      q
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSubmission(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = evaluateSubmissionSchema.parse(req.body);
    const data = await service.evaluateSubmission(
      tenantId(req),
      req.params.id,
      user(req),
      body
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function requeue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.requeueSubmission(tenantId(req), req.params.id, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getExecutionJob(tenantId(req), req.params.jobId, user(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}
