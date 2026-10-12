import { Request, Response, NextFunction } from 'express';
import * as svc from './student.service';
import {
  listStudentsQuerySchema,
  studentCreateSchema,
  studentUpdateSchema,
  statusChangeSchema,
  enrollSchema,
  documentCreateSchema,
  bulkCreateSchema,
  exportQuerySchema,
} from './student.validation';
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
    const q = listStudentsQuerySchema.parse(req.query);
    const result = await svc.listStudents(tenantIdFrom(req), q);
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
    const body = studentCreateSchema.parse(req.body);
    created(res, await svc.createStudent(tenantIdFrom(req), body, req.user?.id), 'Student created');
  } catch (e) {
    next(e);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    ok(res, await svc.getStudentByUserId(tenantIdFrom(req), req.user.id));
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getStudent(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = studentUpdateSchema.parse(req.body);
    ok(res, await svc.updateStudent(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteStudent(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = statusChangeSchema.parse(req.body);
    ok(
      res,
      await svc.changeStatus(
        tenantIdFrom(req),
        req.params.id,
        body.status,
        body.academicNotes,
        req.user?.id
      ),
      'Status updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function enroll(req: Request, res: Response, next: NextFunction) {
  try {
    const body = enrollSchema.parse(req.body);
    ok(res, await svc.enrollStudent(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Enrolled');
  } catch (e) {
    next(e);
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listDocuments(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function addDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const body = documentCreateSchema.parse(req.body);
    created(
      res,
      await svc.addDocument(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Document added'
    );
  } catch (e) {
    next(e);
  }
}

export async function removeDocument(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.removeDocument(tenantIdFrom(req), req.params.id, req.params.docId),
      'Document removed'
    );
  } catch (e) {
    next(e);
  }
}

export async function bulk(req: Request, res: Response, next: NextFunction) {
  try {
    const body = bulkCreateSchema.parse(req.body);
    ok(res, await svc.bulkCreate(tenantIdFrom(req), body.students, req.user?.id), 'Bulk processed');
  } catch (e) {
    next(e);
  }
}

export async function exportList(req: Request, res: Response, next: NextFunction) {
  try {
    const q = exportQuerySchema.parse(req.query);
    const result = await svc.exportStudents(tenantIdFrom(req), q);
    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
      res.status(200).send(result.content);
      return;
    }
    ok(res, result.content, undefined, { count: result.count, format: 'json' });
  } catch (e) {
    next(e);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getStudentStats(tenantIdFrom(req)));
  } catch (e) {
    next(e);
  }
}
