import { Request, Response, NextFunction } from 'express';
import * as svc from './assignment.service';
import {
  listAssignmentsQuerySchema,
  assignmentCreateSchema,
  assignmentUpdateSchema,
  submitAssignmentSchema,
  updateSubmissionSchema,
  gradeSubmissionSchema,
  listSubmissionsQuerySchema,
} from './assignment.validation';
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
    const q = listAssignmentsQuerySchema.parse(req.query);
    const result = await svc.listAssignments(tenantIdFrom(req), q, userFrom(req));
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
    const body = assignmentCreateSchema.parse(req.body);
    created(res, await svc.createAssignment(tenantIdFrom(req), body, userFrom(req)), 'Assignment created');
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getAssignment(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignmentUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateAssignment(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteAssignment(tenantIdFrom(req), req.params.id, userFrom(req)), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.publishAssignment(tenantIdFrom(req), req.params.id, userFrom(req)), 'Published');
  } catch (e) {
    next(e);
  }
}

export async function close(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.closeAssignment(tenantIdFrom(req), req.params.id, userFrom(req)), 'Closed');
  } catch (e) {
    next(e);
  }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listSubmissionsQuerySchema.parse(req.query);
    const result = await svc.listSubmissions(
      tenantIdFrom(req),
      req.params.id,
      q,
      userFrom(req)
    );
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

export async function mySubmission(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getMySubmissions(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const body = submitAssignmentSchema.parse(req.body);
    created(
      res,
      await svc.submitAssignment(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Submitted'
    );
  } catch (e) {
    next(e);
  }
}

export async function updateSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateSubmissionSchema.parse(req.body);
    ok(
      res,
      await svc.updateSubmission(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function grade(req: Request, res: Response, next: NextFunction) {
  try {
    const body = gradeSubmissionSchema.parse(req.body);
    ok(
      res,
      await svc.gradeSubmission(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Graded'
    );
  } catch (e) {
    next(e);
  }
}
