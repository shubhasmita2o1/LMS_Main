import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as svc from './course.service';
import { Faculty } from '../faculty/faculty.model';
import {
  listCoursesQuerySchema,
  courseCreateSchema,
  courseUpdateSchema,
  setPrerequisitesSchema,
  moduleCreateSchema,
  moduleUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
  offeringCreateSchema,
  assignFacultySchema,
  curriculumCreateSchema,
  enrollmentCreateSchema,
  listEnrollmentsQuerySchema,
} from './course.validation';
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
    const q = listCoursesQuerySchema.parse(req.query);
    const tenantId = tenantIdFrom(req);
    let facultyId = q.facultyId;
    if (q.mine && req.user?.id) {
      const f = await Faculty.findOne({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(req.user.id),
        isDeleted: false,
      }).lean();
      if (f) facultyId = String(f._id);
    }
    const result = await svc.listCourses(tenantId, { ...q, facultyId });
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
    const body = courseCreateSchema.parse(req.body);
    created(
      res,
      await svc.createCourse(tenantIdFrom(req), body, req.user?.id),
      'Course created'
    );
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getCourse(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = courseUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateCourse(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.softDeleteCourse(tenantIdFrom(req), req.params.id, req.user?.id),
      'Deleted'
    );
  } catch (e) {
    next(e);
  }
}

export async function setPrerequisites(req: Request, res: Response, next: NextFunction) {
  try {
    const body = setPrerequisitesSchema.parse(req.body);
    ok(
      res,
      await svc.setPrerequisites(
        tenantIdFrom(req),
        req.params.id,
        body.prerequisites,
        req.user?.id
      ),
      'Prerequisites updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listModules(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const body = moduleCreateSchema.parse(req.body);
    created(
      res,
      await svc.createModule(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Module created'
    );
  } catch (e) {
    next(e);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const body = moduleUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateModule(tenantIdFrom(req), req.params.moduleId, body, req.user?.id),
      'Module updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function removeModule(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.softDeleteModule(tenantIdFrom(req), req.params.moduleId, req.user?.id),
      'Module deleted'
    );
  } catch (e) {
    next(e);
  }
}

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const body = lessonCreateSchema.parse(req.body);
    created(
      res,
      await svc.createLesson(tenantIdFrom(req), req.params.moduleId, body, req.user?.id),
      'Lesson created'
    );
  } catch (e) {
    next(e);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const body = lessonUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateLesson(tenantIdFrom(req), req.params.lessonId, body, req.user?.id),
      'Lesson updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function removeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.softDeleteLesson(tenantIdFrom(req), req.params.lessonId, req.user?.id),
      'Lesson deleted'
    );
  } catch (e) {
    next(e);
  }
}

export async function listLessons(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listLessons(tenantIdFrom(req), req.params.moduleId));
  } catch (e) {
    next(e);
  }
}

export async function listOfferings(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listOfferings(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function createOffering(req: Request, res: Response, next: NextFunction) {
  try {
    const body = offeringCreateSchema.parse(req.body);
    created(
      res,
      await svc.createOffering(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Offering created'
    );
  } catch (e) {
    next(e);
  }
}

export async function assignFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignFacultySchema.parse(req.body);
    ok(
      res,
      await svc.assignFacultyToOffering(
        tenantIdFrom(req),
        req.params.id,
        body.facultyIds,
        req.user?.id
      ),
      'Faculty assigned'
    );
  } catch (e) {
    next(e);
  }
}

export async function getCurriculum(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getCurriculum(tenantIdFrom(req), req.params.programId));
  } catch (e) {
    next(e);
  }
}

export async function addCurriculum(req: Request, res: Response, next: NextFunction) {
  try {
    const body = curriculumCreateSchema.parse(req.body);
    created(
      res,
      await svc.addCurriculumEntry(tenantIdFrom(req), body, req.user?.id),
      'Course added to curriculum'
    );
  } catch (e) {
    next(e);
  }
}

export async function removeCurriculum(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.removeCurriculumEntry(tenantIdFrom(req), req.params.entryId, req.user?.id),
      'Removed from curriculum'
    );
  } catch (e) {
    next(e);
  }
}

export async function listEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listEnrollmentsQuerySchema.parse(req.query);
    const result = await svc.listEnrollments(tenantIdFrom(req), q);
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

export async function enroll(req: Request, res: Response, next: NextFunction) {
  try {
    const body = enrollmentCreateSchema.parse(req.body);
    created(
      res,
      await svc.enrollStudent(tenantIdFrom(req), body, req.user?.id),
      'Student enrolled'
    );
  } catch (e) {
    next(e);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.courseStats(tenantIdFrom(req)));
  } catch (e) {
    next(e);
  }
}
