import { Request, Response, NextFunction } from 'express';
import * as svc from './gradebook.service';
import {
  listGradebooksQuerySchema,
  gradebookCreateSchema,
  gradebookUpdateSchema,
  upsertEntriesSchema,
  publishResultsSchema,
} from './gradebook.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantIdFrom(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  return id;
}

function userFrom(req: Request) {
  if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return { id: req.user.id, roles: req.user.roles || [] };
}

function ok(res: Response, data: unknown, message?: string, meta?: unknown) {
  res.status(200).json({ success: true, data, message, meta });
}

function created(res: Response, data: unknown, message?: string) {
  res.status(201).json({ success: true, data, message });
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listGradebooksQuerySchema.parse(req.query);
    const result = await svc.listGradebooks(tenantIdFrom(req), q, userFrom(req));
    ok(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = gradebookCreateSchema.parse(req.body);
    created(
      res,
      await svc.createGradebook(tenantIdFrom(req), body, userFrom(req)),
      'Gradebook created'
    );
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getGradebook(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = gradebookUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateGradebook(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Gradebook updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function lock(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.lockGradebook(tenantIdFrom(req), req.params.id, userFrom(req)),
      'Gradebook locked'
    );
  } catch (e) {
    next(e);
  }
}

export async function unlock(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.unlockGradebook(tenantIdFrom(req), req.params.id, userFrom(req)),
      'Gradebook unlocked'
    );
  } catch (e) {
    next(e);
  }
}

export async function recompute(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.recomputeGradebook(tenantIdFrom(req), req.params.id, userFrom(req)),
      'Gradebook recomputed'
    );
  } catch (e) {
    next(e);
  }
}

export async function roster(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getRoster(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function upsertEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const body = upsertEntriesSchema.parse(req.body);
    ok(
      res,
      await svc.upsertEntries(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Entries updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function publishResults(req: Request, res: Response, next: NextFunction) {
  try {
    const body = publishResultsSchema.parse(req.body || {});
    ok(
      res,
      await svc.publishResults(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Results published'
    );
  } catch (e) {
    next(e);
  }
}

export async function myGrades(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.myGrades(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function transcript(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.myTranscript(tenantIdFrom(req), userFrom(req)));
  } catch (e) {
    next(e);
  }
}
