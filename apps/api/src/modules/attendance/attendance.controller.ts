import { Request, Response, NextFunction } from 'express';
import * as svc from './attendance.service';
import {
  listSessionsQuerySchema,
  sessionCreateSchema,
  sessionUpdateSchema,
  bulkRecordsSchema,
  singleRecordSchema,
  summaryQuerySchema,
  meAttendanceQuerySchema,
  shortageQuerySchema,
} from './attendance.validation';
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

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listSessionsQuerySchema.parse(req.query);
    const result = await svc.listSessions(tenantIdFrom(req), q, userFrom(req));
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

export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sessionCreateSchema.parse(req.body);
    created(
      res,
      await svc.createSession(tenantIdFrom(req), body, userFrom(req)),
      'Attendance session created'
    );
  } catch (e) {
    next(e);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getSession(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function updateSession(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sessionUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateSession(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Session updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function closeSession(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.closeSession(tenantIdFrom(req), req.params.id, userFrom(req)),
      'Session closed'
    );
  } catch (e) {
    next(e);
  }
}

export async function bulkRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const body = bulkRecordsSchema.parse(req.body);
    ok(
      res,
      await svc.bulkMarkRecords(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Attendance marked'
    );
  } catch (e) {
    next(e);
  }
}

export async function singleRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const body = singleRecordSchema.parse(req.body);
    ok(
      res,
      await svc.markSingle(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Attendance marked'
    );
  } catch (e) {
    next(e);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const q = summaryQuerySchema.parse(req.query);
    ok(res, await svc.getSummary(tenantIdFrom(req), q, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const q = meAttendanceQuerySchema.parse(req.query);
    ok(res, await svc.myAttendance(tenantIdFrom(req), q, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function shortageReport(req: Request, res: Response, next: NextFunction) {
  try {
    const q = shortageQuerySchema.parse(req.query);
    ok(res, await svc.shortageReport(tenantIdFrom(req), q, userFrom(req)));
  } catch (e) {
    next(e);
  }
}
