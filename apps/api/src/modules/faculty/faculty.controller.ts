import { Request, Response, NextFunction } from 'express';
import * as svc from './faculty.service';
import {
  listFacultyQuerySchema,
  facultyCreateSchema,
  facultyUpdateSchema,
  statusChangeSchema,
  assignDepartmentSchema,
  assignmentCreateSchema,
} from './faculty.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantIdFrom(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  return id;
}

function ok(res: Response, data: unknown, message?: string, meta?: unknown) {
  res.status(200).json({ success: true, data, message, meta });
}

function created(res: Response, data: unknown, message?: string) {
  res.status(201).json({ success: true, data, message });
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listFacultyQuerySchema.parse(req.query);
    const result = await svc.listFaculty(tenantIdFrom(req), q);
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
    const body = facultyCreateSchema.parse(req.body);
    created(res, await svc.createFaculty(tenantIdFrom(req), body, req.user?.id), 'Faculty created');
  } catch (e) {
    next(e);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    ok(res, await svc.getFacultyByUserId(tenantIdFrom(req), req.user.id));
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getFaculty(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = facultyUpdateSchema.parse(req.body);
    ok(res, await svc.updateFaculty(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteFaculty(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = statusChangeSchema.parse(req.body);
    ok(
      res,
      await svc.changeStatus(tenantIdFrom(req), req.params.id, body.status, req.user?.id),
      'Status updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function assignDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignDepartmentSchema.parse(req.body);
    ok(
      res,
      await svc.assignDepartments(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Department assigned'
    );
  } catch (e) {
    next(e);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listAssignments(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function addAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignmentCreateSchema.parse(req.body);
    created(
      res,
      await svc.addAssignment(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Assignment added'
    );
  } catch (e) {
    next(e);
  }
}

export async function removeAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.removeAssignment(tenantIdFrom(req), req.params.id, req.params.assignmentId),
      'Assignment removed'
    );
  } catch (e) {
    next(e);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getFacultyStats(tenantIdFrom(req)));
  } catch (e) {
    next(e);
  }
}
