import mongoose from 'mongoose';
import {
  DEFAULT_GRADING_SCHEME,
  DEFAULT_CREDIT_STRUCTURE,
  DEFAULT_ATTENDANCE_RULES,
  DEFAULT_PROMOTION_RULES,
} from '@university-lms/shared';
import type { AcademicTreeNode } from '@university-lms/shared';
import { AppError } from '../../middleware/errorHandler';
import {
  University,
  Campus,
  School,
  Department,
  Program,
  AcademicYear,
  Semester,
  Batch,
  Section,
  AcademicConfigModel,
} from './academic.models';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}

function requireTenantId(tenantId: string | null | undefined): string {
  if (!tenantId) {
    throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  }
  return tenantId;
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function paginate(page: number, limit: number) {
  return { skip: (page - 1) * limit, limit };
}

// ─── University ─────────────────────────────────────────────────────────────

export async function listUniversities(
  tenantId: string,
  q: { page: number; limit: number; search?: string; status?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.search) {
    const s = q.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
    ];
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    University.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    University.countDocuments(filter),
  ]);
  return {
    items: items.map(mapUniversity),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createUniversity(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await University.create({
    ...body,
    tenantId: tid(tenantId),
    code: String(body.code).toUpperCase(),
    createdBy: userId ? tid(userId) : null,
  });
  return mapUniversity(doc.toObject());
}

export async function getUniversity(tenantId: string, id: string) {
  const doc = await University.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'University not found', 'NOT_FOUND');
  return mapUniversity(doc);
}

export async function updateUniversity(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.code) body.code = String(body.code).toUpperCase();
  const doc = await University.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: { ...body, updatedBy: userId ? tid(userId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'University not found', 'NOT_FOUND');
  return mapUniversity(doc);
}

export async function softDeleteUniversity(tenantId: string, id: string, userId?: string) {
  const doc = await University.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'University not found', 'NOT_FOUND');
  return mapUniversity(doc);
}

function mapUniversity(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    name: d.name,
    code: d.code,
    type: d.type,
    address: d.address,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    logoUrl: d.logoUrl,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Campus ─────────────────────────────────────────────────────────────────

export async function listCampuses(
  tenantId: string,
  q: { page: number; limit: number; search?: string; status?: string; universityId?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.universityId) filter.universityId = tid(q.universityId);
  if (q.search) {
    const s = q.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
    ];
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Campus.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Campus.countDocuments(filter),
  ]);
  return {
    items: items.map(mapCampus),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createCampus(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const uni = await University.findOne(
    baseFilter(tenantId, { _id: body.universityId })
  ).lean();
  if (!uni) throw new AppError(400, 'University not found in tenant', 'VALIDATION_ERROR');

  const doc = await Campus.create({
    ...body,
    tenantId: tid(tenantId),
    universityId: tid(String(body.universityId)),
    code: String(body.code).toUpperCase(),
    createdBy: userId ? tid(userId) : null,
  });
  return mapCampus(doc.toObject());
}

export async function getCampus(tenantId: string, id: string) {
  const doc = await Campus.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Campus not found', 'NOT_FOUND');
  return mapCampus(doc);
}

export async function updateCampus(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.code) body.code = String(body.code).toUpperCase();
  const doc = await Campus.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: { ...body, updatedBy: userId ? tid(userId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Campus not found', 'NOT_FOUND');
  return mapCampus(doc);
}

export async function softDeleteCampus(tenantId: string, id: string, userId?: string) {
  const doc = await Campus.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Campus not found', 'NOT_FOUND');
  return mapCampus(doc);
}

function mapCampus(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    universityId: String(d.universityId),
    name: d.name,
    code: d.code,
    address: d.address,
    isMainCampus: Boolean(d.isMainCampus),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── School ─────────────────────────────────────────────────────────────────

export async function listSchools(
  tenantId: string,
  q: { page: number; limit: number; search?: string; status?: string; universityId?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.universityId) filter.universityId = tid(q.universityId);
  if (q.search) {
    const s = q.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
    ];
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    School.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    School.countDocuments(filter),
  ]);
  return {
    items: items.map(mapSchool),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createSchool(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await School.create({
    ...body,
    tenantId: tid(tenantId),
    universityId: tid(String(body.universityId)),
    campusId: body.campusId ? tid(String(body.campusId)) : null,
    code: String(body.code).toUpperCase(),
    createdBy: userId ? tid(userId) : null,
  });
  return mapSchool(doc.toObject());
}

export async function getSchool(tenantId: string, id: string) {
  const doc = await School.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'School not found', 'NOT_FOUND');
  return mapSchool(doc);
}

export async function updateSchool(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.code) body.code = String(body.code).toUpperCase();
  if (body.campusId !== undefined) {
    body.campusId = body.campusId ? tid(String(body.campusId)) : null;
  }
  const doc = await School.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: { ...body, updatedBy: userId ? tid(userId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'School not found', 'NOT_FOUND');
  return mapSchool(doc);
}

export async function softDeleteSchool(tenantId: string, id: string, userId?: string) {
  const doc = await School.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'School not found', 'NOT_FOUND');
  return mapSchool(doc);
}

function mapSchool(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    universityId: String(d.universityId),
    campusId: idStr(d.campusId),
    name: d.name,
    code: d.code,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Department ─────────────────────────────────────────────────────────────

export async function listDepartments(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    universityId?: string;
    campusId?: string;
    schoolId?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.universityId) filter.universityId = tid(q.universityId);
  if (q.campusId) filter.campusId = tid(q.campusId);
  if (q.schoolId) filter.schoolId = tid(q.schoolId);
  if (q.search) {
    const s = q.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
    ];
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Department.countDocuments(filter),
  ]);
  return {
    items: items.map(mapDepartment),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createDepartment(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await Department.create({
    tenantId: tid(tenantId),
    universityId: tid(String(body.universityId)),
    campusId: body.campusId ? tid(String(body.campusId)) : null,
    schoolId: body.schoolId ? tid(String(body.schoolId)) : null,
    name: body.name,
    code: String(body.code).toUpperCase(),
    hodUserId: body.hodUserId ? tid(String(body.hodUserId)) : null,
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapDepartment(doc.toObject());
}

export async function getDepartment(tenantId: string, id: string) {
  const doc = await Department.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Department not found', 'NOT_FOUND');
  return mapDepartment(doc);
}

export async function updateDepartment(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.code) set.code = String(body.code).toUpperCase();
  if (body.hodUserId !== undefined) {
    set.hodUserId = body.hodUserId ? tid(String(body.hodUserId)) : null;
  }
  if (body.campusId !== undefined) {
    set.campusId = body.campusId ? tid(String(body.campusId)) : null;
  }
  if (body.schoolId !== undefined) {
    set.schoolId = body.schoolId ? tid(String(body.schoolId)) : null;
  }
  const doc = await Department.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Department not found', 'NOT_FOUND');
  return mapDepartment(doc);
}

export async function softDeleteDepartment(tenantId: string, id: string, userId?: string) {
  const doc = await Department.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Department not found', 'NOT_FOUND');
  return mapDepartment(doc);
}

export async function assignHod(tenantId: string, id: string, userId: string | null, actorId?: string) {
  return updateDepartment(tenantId, id, { hodUserId: userId }, actorId);
}

function mapDepartment(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    universityId: String(d.universityId),
    campusId: idStr(d.campusId),
    schoolId: idStr(d.schoolId),
    name: d.name,
    code: d.code,
    hodUserId: idStr(d.hodUserId),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Program ────────────────────────────────────────────────────────────────

export async function listPrograms(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    departmentId?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.departmentId) filter.departmentId = tid(q.departmentId);
  if (q.search) {
    const s = q.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
    ];
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Program.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Program.countDocuments(filter),
  ]);
  return {
    items: items.map(mapProgram),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createProgram(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const dept = await Department.findOne(
    baseFilter(tenantId, { _id: body.departmentId })
  ).lean();
  if (!dept) throw new AppError(400, 'Department not found in tenant', 'VALIDATION_ERROR');

  const doc = await Program.create({
    tenantId: tid(tenantId),
    departmentId: tid(String(body.departmentId)),
    name: body.name,
    code: String(body.code).toUpperCase(),
    degreeType: body.degreeType || 'ug',
    durationYears: body.durationYears,
    totalCredits: body.totalCredits,
    coordinatorUserId: body.coordinatorUserId
      ? tid(String(body.coordinatorUserId))
      : null,
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapProgram(doc.toObject());
}

export async function getProgram(tenantId: string, id: string) {
  const doc = await Program.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Program not found', 'NOT_FOUND');
  return mapProgram(doc);
}

export async function updateProgram(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.code) set.code = String(body.code).toUpperCase();
  if (body.coordinatorUserId !== undefined) {
    set.coordinatorUserId = body.coordinatorUserId
      ? tid(String(body.coordinatorUserId))
      : null;
  }
  if (body.departmentId) set.departmentId = tid(String(body.departmentId));
  const doc = await Program.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Program not found', 'NOT_FOUND');
  return mapProgram(doc);
}

export async function softDeleteProgram(tenantId: string, id: string, userId?: string) {
  const doc = await Program.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Program not found', 'NOT_FOUND');
  return mapProgram(doc);
}

export async function assignCoordinator(
  tenantId: string,
  id: string,
  userId: string | null,
  actorId?: string
) {
  return updateProgram(tenantId, id, { coordinatorUserId: userId }, actorId);
}

function mapProgram(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    departmentId: String(d.departmentId),
    name: d.name,
    code: d.code,
    degreeType: d.degreeType,
    durationYears: d.durationYears,
    totalCredits: d.totalCredits,
    coordinatorUserId: idStr(d.coordinatorUserId),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Academic Year ──────────────────────────────────────────────────────────

export async function listAcademicYears(
  tenantId: string,
  q: { page: number; limit: number; search?: string; status?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.search) {
    filter.name = { $regex: q.search.trim(), $options: 'i' };
  }
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    AcademicYear.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit).lean(),
    AcademicYear.countDocuments(filter),
  ]);
  return {
    items: items.map(mapAcademicYear),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createAcademicYear(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.isCurrent) {
    await AcademicYear.updateMany(baseFilter(tenantId), { $set: { isCurrent: false } });
  }
  const doc = await AcademicYear.create({
    tenantId: tid(tenantId),
    name: body.name,
    startDate: body.startDate,
    endDate: body.endDate,
    isCurrent: Boolean(body.isCurrent),
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapAcademicYear(doc.toObject());
}

export async function getAcademicYear(tenantId: string, id: string) {
  const doc = await AcademicYear.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Academic year not found', 'NOT_FOUND');
  return mapAcademicYear(doc);
}

export async function updateAcademicYear(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.isCurrent === true) {
    await AcademicYear.updateMany(baseFilter(tenantId), { $set: { isCurrent: false } });
  }
  const doc = await AcademicYear.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: { ...body, updatedBy: userId ? tid(userId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Academic year not found', 'NOT_FOUND');
  return mapAcademicYear(doc);
}

export async function setCurrentAcademicYear(tenantId: string, id: string, userId?: string) {
  return updateAcademicYear(tenantId, id, { isCurrent: true }, userId);
}

export async function softDeleteAcademicYear(tenantId: string, id: string, userId?: string) {
  const doc = await AcademicYear.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isCurrent: false,
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Academic year not found', 'NOT_FOUND');
  return mapAcademicYear(doc);
}

function mapAcademicYear(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    name: d.name,
    startDate: d.startDate,
    endDate: d.endDate,
    isCurrent: Boolean(d.isCurrent),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Semester ───────────────────────────────────────────────────────────────

export async function listSemesters(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    academicYearId?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.academicYearId) filter.academicYearId = tid(q.academicYearId);
  if (q.search) filter.name = { $regex: q.search.trim(), $options: 'i' };
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Semester.find(filter).sort({ sequence: 1 }).skip(skip).limit(limit).lean(),
    Semester.countDocuments(filter),
  ]);
  return {
    items: items.map(mapSemester),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createSemester(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.isCurrent) {
    await Semester.updateMany(baseFilter(tenantId), { $set: { isCurrent: false } });
  }
  const doc = await Semester.create({
    tenantId: tid(tenantId),
    academicYearId: tid(String(body.academicYearId)),
    name: body.name,
    sequence: body.sequence,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
    isCurrent: Boolean(body.isCurrent),
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapSemester(doc.toObject());
}

export async function getSemester(tenantId: string, id: string) {
  const doc = await Semester.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Semester not found', 'NOT_FOUND');
  return mapSemester(doc);
}

export async function updateSemester(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  if (body.isCurrent === true) {
    await Semester.updateMany(baseFilter(tenantId), { $set: { isCurrent: false } });
  }
  if (body.academicYearId) body.academicYearId = tid(String(body.academicYearId));
  const doc = await Semester.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: { ...body, updatedBy: userId ? tid(userId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Semester not found', 'NOT_FOUND');
  return mapSemester(doc);
}

export async function setCurrentSemester(tenantId: string, id: string, userId?: string) {
  return updateSemester(tenantId, id, { isCurrent: true }, userId);
}

export async function softDeleteSemester(tenantId: string, id: string, userId?: string) {
  const doc = await Semester.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isCurrent: false,
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Semester not found', 'NOT_FOUND');
  return mapSemester(doc);
}

function mapSemester(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    academicYearId: String(d.academicYearId),
    name: d.name,
    sequence: d.sequence,
    startDate: d.startDate,
    endDate: d.endDate,
    isCurrent: Boolean(d.isCurrent),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Batch ──────────────────────────────────────────────────────────────────

export async function listBatches(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    programId?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.programId) filter.programId = tid(q.programId);
  if (q.search) filter.name = { $regex: q.search.trim(), $options: 'i' };
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Batch.find(filter).sort({ startYear: -1 }).skip(skip).limit(limit).lean(),
    Batch.countDocuments(filter),
  ]);
  return {
    items: items.map(mapBatch),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createBatch(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const prog = await Program.findOne(baseFilter(tenantId, { _id: body.programId })).lean();
  if (!prog) throw new AppError(400, 'Program not found in tenant', 'VALIDATION_ERROR');

  const doc = await Batch.create({
    tenantId: tid(tenantId),
    programId: tid(String(body.programId)),
    academicYearId: body.academicYearId ? tid(String(body.academicYearId)) : null,
    name: body.name,
    startYear: body.startYear,
    endYear: body.endYear,
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapBatch(doc.toObject());
}

export async function getBatch(tenantId: string, id: string) {
  const doc = await Batch.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Batch not found', 'NOT_FOUND');
  return mapBatch(doc);
}

export async function updateBatch(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.programId) set.programId = tid(String(body.programId));
  if (body.academicYearId !== undefined) {
    set.academicYearId = body.academicYearId ? tid(String(body.academicYearId)) : null;
  }
  const doc = await Batch.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Batch not found', 'NOT_FOUND');
  return mapBatch(doc);
}

export async function softDeleteBatch(tenantId: string, id: string, userId?: string) {
  const doc = await Batch.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Batch not found', 'NOT_FOUND');
  return mapBatch(doc);
}

function mapBatch(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    programId: String(d.programId),
    academicYearId: idStr(d.academicYearId),
    name: d.name,
    startYear: d.startYear,
    endYear: d.endYear,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Section ────────────────────────────────────────────────────────────────

export async function listSections(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    batchId?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.batchId) filter.batchId = tid(q.batchId);
  if (q.search) filter.name = { $regex: q.search.trim(), $options: 'i' };
  const { skip, limit } = paginate(q.page, q.limit);
  const [items, total] = await Promise.all([
    Section.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Section.countDocuments(filter),
  ]);
  return {
    items: items.map(mapSection),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createSection(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const batch = await Batch.findOne(baseFilter(tenantId, { _id: body.batchId })).lean();
  if (!batch) throw new AppError(400, 'Batch not found in tenant', 'VALIDATION_ERROR');

  const doc = await Section.create({
    tenantId: tid(tenantId),
    batchId: tid(String(body.batchId)),
    name: body.name,
    maxStudents: body.maxStudents ?? 60,
    advisorUserId: body.advisorUserId ? tid(String(body.advisorUserId)) : null,
    status: body.status || 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapSection(doc.toObject());
}

export async function getSection(tenantId: string, id: string) {
  const doc = await Section.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Section not found', 'NOT_FOUND');
  return mapSection(doc);
}

export async function updateSection(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.batchId) set.batchId = tid(String(body.batchId));
  if (body.advisorUserId !== undefined) {
    set.advisorUserId = body.advisorUserId ? tid(String(body.advisorUserId)) : null;
  }
  const doc = await Section.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Section not found', 'NOT_FOUND');
  return mapSection(doc);
}

export async function softDeleteSection(tenantId: string, id: string, userId?: string) {
  const doc = await Section.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Section not found', 'NOT_FOUND');
  return mapSection(doc);
}

export async function assignAdvisor(
  tenantId: string,
  id: string,
  userId: string | null,
  actorId?: string
) {
  return updateSection(tenantId, id, { advisorUserId: userId }, actorId);
}

function mapSection(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    batchId: String(d.batchId),
    name: d.name,
    maxStudents: d.maxStudents,
    advisorUserId: idStr(d.advisorUserId),
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Academic Config ────────────────────────────────────────────────────────

export async function getAcademicConfig(tenantId: string) {
  let doc = await AcademicConfigModel.findOne({ tenantId: tid(tenantId) }).lean();
  if (!doc) {
    const created = await AcademicConfigModel.create({
      tenantId: tid(tenantId),
      gradingScheme: DEFAULT_GRADING_SCHEME,
      creditStructure: DEFAULT_CREDIT_STRUCTURE,
      attendanceRules: DEFAULT_ATTENDANCE_RULES,
      promotionRules: DEFAULT_PROMOTION_RULES,
    });
    doc = created.toObject() as typeof doc;
  }
  return {
    tenantId,
    gradingScheme: doc.gradingScheme,
    creditStructure: doc.creditStructure,
    attendanceRules: doc.attendanceRules,
    promotionRules: doc.promotionRules,
    updatedAt: doc.updatedAt,
  };
}

export async function updateAcademicConfig(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await AcademicConfigModel.findOneAndUpdate(
    { tenantId: tid(tenantId) },
    {
      $set: {
        ...body,
        updatedBy: userId ? tid(userId) : null,
      },
      $setOnInsert: {
        tenantId: tid(tenantId),
        gradingScheme: DEFAULT_GRADING_SCHEME,
        creditStructure: DEFAULT_CREDIT_STRUCTURE,
        attendanceRules: DEFAULT_ATTENDANCE_RULES,
        promotionRules: DEFAULT_PROMOTION_RULES,
      },
    },
    { new: true, upsert: true }
  ).lean();
  return {
    tenantId,
    gradingScheme: doc!.gradingScheme,
    creditStructure: doc!.creditStructure,
    attendanceRules: doc!.attendanceRules,
    promotionRules: doc!.promotionRules,
    updatedAt: doc!.updatedAt,
  };
}

// ─── Hierarchy tree ─────────────────────────────────────────────────────────

export async function getAcademicTree(tenantId: string): Promise<AcademicTreeNode[]> {
  const [universities, campuses, schools, departments, programs, batches, sections] =
    await Promise.all([
      University.find(baseFilter(tenantId)).lean(),
      Campus.find(baseFilter(tenantId)).lean(),
      School.find(baseFilter(tenantId)).lean(),
      Department.find(baseFilter(tenantId)).lean(),
      Program.find(baseFilter(tenantId)).lean(),
      Batch.find(baseFilter(tenantId)).lean(),
      Section.find(baseFilter(tenantId)).lean(),
    ]);

  const sectionsByBatch = new Map<string, AcademicTreeNode[]>();
  for (const s of sections) {
    const key = String(s.batchId);
    const list = sectionsByBatch.get(key) || [];
    list.push({
      id: String(s._id),
      type: 'section',
      name: s.name,
      status: s.status as AcademicTreeNode['status'],
    });
    sectionsByBatch.set(key, list);
  }

  const batchesByProgram = new Map<string, AcademicTreeNode[]>();
  for (const b of batches) {
    const key = String(b.programId);
    const list = batchesByProgram.get(key) || [];
    list.push({
      id: String(b._id),
      type: 'batch',
      name: b.name,
      status: b.status as AcademicTreeNode['status'],
      children: sectionsByBatch.get(String(b._id)) || [],
    });
    batchesByProgram.set(key, list);
  }

  const programsByDept = new Map<string, AcademicTreeNode[]>();
  for (const p of programs) {
    const key = String(p.departmentId);
    const list = programsByDept.get(key) || [];
    list.push({
      id: String(p._id),
      type: 'program',
      name: p.name,
      code: p.code,
      status: p.status as AcademicTreeNode['status'],
      children: batchesByProgram.get(String(p._id)) || [],
    });
    programsByDept.set(key, list);
  }

  const deptsByUni = new Map<string, AcademicTreeNode[]>();
  const deptsBySchool = new Map<string, AcademicTreeNode[]>();
  for (const d of departments) {
    const node: AcademicTreeNode = {
      id: String(d._id),
      type: 'department',
      name: d.name,
      code: d.code,
      status: d.status as AcademicTreeNode['status'],
      children: programsByDept.get(String(d._id)) || [],
    };
    if (d.schoolId) {
      const key = String(d.schoolId);
      const list = deptsBySchool.get(key) || [];
      list.push(node);
      deptsBySchool.set(key, list);
    } else {
      const key = String(d.universityId);
      const list = deptsByUni.get(key) || [];
      list.push(node);
      deptsByUni.set(key, list);
    }
  }

  const schoolsByCampus = new Map<string, AcademicTreeNode[]>();
  const schoolsByUni = new Map<string, AcademicTreeNode[]>();
  for (const s of schools) {
    const node: AcademicTreeNode = {
      id: String(s._id),
      type: 'school',
      name: s.name,
      code: s.code,
      status: s.status as AcademicTreeNode['status'],
      children: deptsBySchool.get(String(s._id)) || [],
    };
    if (s.campusId) {
      const key = String(s.campusId);
      const list = schoolsByCampus.get(key) || [];
      list.push(node);
      schoolsByCampus.set(key, list);
    } else {
      const key = String(s.universityId);
      const list = schoolsByUni.get(key) || [];
      list.push(node);
      schoolsByUni.set(key, list);
    }
  }

  const campusesByUni = new Map<string, AcademicTreeNode[]>();
  for (const c of campuses) {
    const key = String(c.universityId);
    const list = campusesByUni.get(key) || [];
    list.push({
      id: String(c._id),
      type: 'campus',
      name: c.name,
      code: c.code,
      status: c.status as AcademicTreeNode['status'],
      children: schoolsByCampus.get(String(c._id)) || [],
    });
    campusesByUni.set(key, list);
  }

  return universities.map((u) => {
    const uniId = String(u._id);
    const children: AcademicTreeNode[] = [
      ...(campusesByUni.get(uniId) || []),
      ...(schoolsByUni.get(uniId) || []),
      ...(deptsByUni.get(uniId) || []),
    ];
    return {
      id: uniId,
      type: 'university' as const,
      name: u.name,
      code: u.code,
      status: u.status as AcademicTreeNode['status'],
      children,
    };
  });
}

export { requireTenantId };
