import { Request, Response, NextFunction } from 'express';
import * as svc from './academic.service';
import {
  listQuerySchema,
  universityCreateSchema,
  universityUpdateSchema,
  campusCreateSchema,
  campusUpdateSchema,
  schoolCreateSchema,
  schoolUpdateSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  programCreateSchema,
  programUpdateSchema,
  academicYearCreateSchema,
  academicYearUpdateSchema,
  semesterCreateSchema,
  semesterUpdateSchema,
  batchCreateSchema,
  batchUpdateSchema,
  sectionCreateSchema,
  sectionUpdateSchema,
  assignUserSchema,
  academicConfigUpdateSchema,
} from './academic.validation';
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

// Universities
export async function listUniversities(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listUniversities(tenantIdFrom(req), q);
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

export async function createUniversity(req: Request, res: Response, next: NextFunction) {
  try {
    const body = universityCreateSchema.parse(req.body);
    const data = await svc.createUniversity(tenantIdFrom(req), body, req.user?.id);
    created(res, data, 'University created');
  } catch (e) {
    next(e);
  }
}

export async function getUniversity(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getUniversity(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateUniversity(req: Request, res: Response, next: NextFunction) {
  try {
    const body = universityUpdateSchema.parse(req.body);
    ok(res, await svc.updateUniversity(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteUniversity(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteUniversity(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Campuses
export async function listCampuses(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listCampuses(tenantIdFrom(req), q);
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

export async function createCampus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = campusCreateSchema.parse(req.body);
    created(res, await svc.createCampus(tenantIdFrom(req), body, req.user?.id), 'Campus created');
  } catch (e) {
    next(e);
  }
}

export async function getCampus(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getCampus(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateCampus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = campusUpdateSchema.parse(req.body);
    ok(res, await svc.updateCampus(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteCampus(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteCampus(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Schools
export async function listSchools(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listSchools(tenantIdFrom(req), q);
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

export async function createSchool(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schoolCreateSchema.parse(req.body);
    created(res, await svc.createSchool(tenantIdFrom(req), body, req.user?.id), 'School created');
  } catch (e) {
    next(e);
  }
}

export async function getSchool(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getSchool(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateSchool(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schoolUpdateSchema.parse(req.body);
    ok(res, await svc.updateSchool(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteSchool(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteSchool(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Departments
export async function listDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listDepartments(tenantIdFrom(req), q);
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

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = departmentCreateSchema.parse(req.body);
    created(
      res,
      await svc.createDepartment(tenantIdFrom(req), body, req.user?.id),
      'Department created'
    );
  } catch (e) {
    next(e);
  }
}

export async function getDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getDepartment(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = departmentUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateDepartment(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.softDeleteDepartment(tenantIdFrom(req), req.params.id, req.user?.id),
      'Deleted'
    );
  } catch (e) {
    next(e);
  }
}

export async function assignHod(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignUserSchema.parse(req.body);
    ok(
      res,
      await svc.assignHod(tenantIdFrom(req), req.params.id, body.userId, req.user?.id),
      'HOD assigned'
    );
  } catch (e) {
    next(e);
  }
}

// Programs
export async function listPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listPrograms(tenantIdFrom(req), q);
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

export async function createProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const body = programCreateSchema.parse(req.body);
    created(res, await svc.createProgram(tenantIdFrom(req), body, req.user?.id), 'Program created');
  } catch (e) {
    next(e);
  }
}

export async function getProgram(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getProgram(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const body = programUpdateSchema.parse(req.body);
    ok(res, await svc.updateProgram(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteProgram(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function assignCoordinator(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignUserSchema.parse(req.body);
    ok(
      res,
      await svc.assignCoordinator(tenantIdFrom(req), req.params.id, body.userId, req.user?.id),
      'Coordinator assigned'
    );
  } catch (e) {
    next(e);
  }
}

// Academic years
export async function listAcademicYears(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listAcademicYears(tenantIdFrom(req), q);
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

export async function createAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = academicYearCreateSchema.parse(req.body);
    created(
      res,
      await svc.createAcademicYear(tenantIdFrom(req), body, req.user?.id),
      'Academic year created'
    );
  } catch (e) {
    next(e);
  }
}

export async function getAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getAcademicYear(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = academicYearUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateAcademicYear(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function setCurrentAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.setCurrentAcademicYear(tenantIdFrom(req), req.params.id, req.user?.id),
      'Set as current'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteAcademicYear(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.softDeleteAcademicYear(tenantIdFrom(req), req.params.id, req.user?.id),
      'Deleted'
    );
  } catch (e) {
    next(e);
  }
}

// Semesters
export async function listSemesters(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listSemesters(tenantIdFrom(req), q);
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

export async function createSemester(req: Request, res: Response, next: NextFunction) {
  try {
    const body = semesterCreateSchema.parse(req.body);
    created(res, await svc.createSemester(tenantIdFrom(req), body, req.user?.id), 'Semester created');
  } catch (e) {
    next(e);
  }
}

export async function getSemester(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getSemester(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateSemester(req: Request, res: Response, next: NextFunction) {
  try {
    const body = semesterUpdateSchema.parse(req.body);
    ok(res, await svc.updateSemester(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function setCurrentSemester(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.setCurrentSemester(tenantIdFrom(req), req.params.id, req.user?.id),
      'Set as current'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteSemester(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteSemester(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Batches
export async function listBatches(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listBatches(tenantIdFrom(req), q);
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

export async function createBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const body = batchCreateSchema.parse(req.body);
    created(res, await svc.createBatch(tenantIdFrom(req), body, req.user?.id), 'Batch created');
  } catch (e) {
    next(e);
  }
}

export async function getBatch(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getBatch(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const body = batchUpdateSchema.parse(req.body);
    ok(res, await svc.updateBatch(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteBatch(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteBatch(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Sections
export async function listSections(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await svc.listSections(tenantIdFrom(req), q);
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

export async function createSection(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sectionCreateSchema.parse(req.body);
    created(res, await svc.createSection(tenantIdFrom(req), body, req.user?.id), 'Section created');
  } catch (e) {
    next(e);
  }
}

export async function getSection(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getSection(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function updateSection(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sectionUpdateSchema.parse(req.body);
    ok(res, await svc.updateSection(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteSection(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteSection(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function assignAdvisor(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignUserSchema.parse(req.body);
    ok(
      res,
      await svc.assignAdvisor(tenantIdFrom(req), req.params.id, body.userId, req.user?.id),
      'Advisor assigned'
    );
  } catch (e) {
    next(e);
  }
}

// Tree + config
export async function getTree(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getAcademicTree(tenantIdFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getAcademicConfig(tenantIdFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const body = academicConfigUpdateSchema.parse(req.body);
    ok(res, await svc.updateAcademicConfig(tenantIdFrom(req), body, req.user?.id), 'Config updated');
  } catch (e) {
    next(e);
  }
}
