import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { checkLimit } from '../../services/featureFlags';
import { Faculty, FacultyAssignment } from './faculty.model';
import {
  Course,
  CourseModule,
  CourseOffering,
  CourseEnrollment,
} from '../courses/course.model';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function oidOrNull(v: unknown) {
  if (v === undefined || v === null || v === '') return null;
  return tid(String(v));
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function mapFaculty(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    userId: idStr(d.userId),
    employeeId: d.employeeId,
    firstName: d.firstName,
    middleName: d.middleName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    alternatePhone: d.alternatePhone,
    dateOfBirth: d.dateOfBirth,
    gender: d.gender,
    photoUrl: d.photoUrl,
    designation: d.designation,
    employmentType: d.employmentType,
    departmentId: idStr(d.departmentId),
    additionalDepartmentIds: (d.additionalDepartmentIds || []).map(String),
    dateOfJoining: d.dateOfJoining,
    dateOfLeaving: d.dateOfLeaving,
    status: d.status,
    qualifications: d.qualifications || [],
    specializations: d.specializations || [],
    experienceYears: d.experienceYears,
    bio: d.bio,
    officeLocation: d.officeLocation,
    officeHours: d.officeHours,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapAssignment(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    facultyId: String(d.facultyId),
    courseId: idStr(d.courseId),
    sectionId: idStr(d.sectionId),
    academicYearId: idStr(d.academicYearId),
    semesterId: idStr(d.semesterId),
    role: d.role,
    workloadHours: d.workloadHours,
    createdAt: d.createdAt,
  };
}

export async function listFaculty(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    departmentId?: string;
    employmentType?: string;
    designation?: string;
    sort?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.departmentId) filter.departmentId = tid(q.departmentId);
  if (q.employmentType) filter.employmentType = q.employmentType;
  if (q.designation) filter.designation = { $regex: q.designation, $options: 'i' };
  if (q.search?.trim()) {
    const s = q.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { employeeId: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { designation: { $regex: s, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (q.sort === 'name') {
    sort.firstName = 1;
    sort.lastName = 1;
    delete sort.createdAt;
  } else if (q.sort === 'employeeId') {
    sort.employeeId = 1;
    delete sort.createdAt;
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Faculty.find(filter).sort(sort).skip(skip).limit(q.limit).lean(),
    Faculty.countDocuments(filter),
  ]);

  return {
    items: items.map(mapFaculty),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createFaculty(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const limit = await checkLimit(tenantId, 'activeFaculty', 1);
  if (!limit.allowed) {
    throw new AppError(
      403,
      `Plan limit reached for active faculty (${limit.current}/${limit.limit})`,
      'PLAN_LIMIT_EXCEEDED',
      limit
    );
  }

  const payload: Record<string, unknown> = {
    ...body,
    tenantId: tid(tenantId),
    employeeId: String(body.employeeId).toUpperCase(),
    departmentId: oidOrNull(body.departmentId),
    userId: oidOrNull(body.userId),
    additionalDepartmentIds: Array.isArray(body.additionalDepartmentIds)
      ? (body.additionalDepartmentIds as string[]).map((id) => tid(id))
      : [],
    status: body.status || 'active',
    employmentType: body.employmentType || 'full_time',
    qualifications: body.qualifications || [],
    specializations: body.specializations || [],
    createdBy: userId ? tid(userId) : null,
  };

  try {
    const doc = await Faculty.create(payload);
    return mapFaculty(doc.toObject());
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new AppError(409, 'Employee ID already exists', 'DUPLICATE');
    }
    throw err;
  }
}

export async function getFaculty(tenantId: string, id: string) {
  const doc = await Faculty.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Faculty not found', 'NOT_FOUND');
  return mapFaculty(doc);
}

export async function getFacultyByUserId(tenantId: string, userId: string) {
  const doc = await Faculty.findOne(baseFilter(tenantId, { userId: tid(userId) })).lean();
  if (!doc) throw new AppError(404, 'Faculty profile not linked', 'NOT_FOUND');
  return mapFaculty(doc);
}

export async function updateFaculty(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.employeeId) set.employeeId = String(body.employeeId).toUpperCase();
  if (body.departmentId !== undefined) set.departmentId = oidOrNull(body.departmentId);
  if (body.userId !== undefined) set.userId = oidOrNull(body.userId);
  if (body.additionalDepartmentIds !== undefined) {
    set.additionalDepartmentIds = Array.isArray(body.additionalDepartmentIds)
      ? (body.additionalDepartmentIds as string[]).map((x) => tid(x))
      : [];
  }

  try {
    const doc = await Faculty.findOneAndUpdate(
      baseFilter(tenantId, { _id: id }),
      { $set: set },
      { new: true }
    ).lean();
    if (!doc) throw new AppError(404, 'Faculty not found', 'NOT_FOUND');
    return mapFaculty(doc);
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new AppError(409, 'Employee ID already exists', 'DUPLICATE');
    }
    throw err;
  }
}

export async function softDeleteFaculty(tenantId: string, id: string, userId?: string) {
  const doc = await Faculty.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'terminated',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Faculty not found', 'NOT_FOUND');
  return mapFaculty(doc);
}

export async function changeStatus(
  tenantId: string,
  id: string,
  status: string,
  userId?: string
) {
  return updateFaculty(tenantId, id, { status }, userId);
}

export async function assignDepartments(
  tenantId: string,
  id: string,
  body: { departmentId?: string | null; additionalDepartmentIds?: string[] },
  userId?: string
) {
  return updateFaculty(
    tenantId,
    id,
    {
      departmentId: body.departmentId,
      additionalDepartmentIds: body.additionalDepartmentIds,
    },
    userId
  );
}

export async function listAssignments(tenantId: string, facultyId: string) {
  await getFaculty(tenantId, facultyId);
  const items = await FacultyAssignment.find({
    tenantId: tid(tenantId),
    facultyId: tid(facultyId),
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();
  return items.map(mapAssignment);
}

export async function addAssignment(
  tenantId: string,
  facultyId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  await getFaculty(tenantId, facultyId);
  const doc = await FacultyAssignment.create({
    tenantId: tid(tenantId),
    facultyId: tid(facultyId),
    courseId: oidOrNull(body.courseId),
    sectionId: oidOrNull(body.sectionId),
    academicYearId: oidOrNull(body.academicYearId),
    semesterId: oidOrNull(body.semesterId),
    role: body.role || 'instructor',
    workloadHours: body.workloadHours,
    createdBy: userId ? tid(userId) : null,
  });
  return mapAssignment(doc.toObject());
}

export async function removeAssignment(
  tenantId: string,
  facultyId: string,
  assignmentId: string
) {
  const doc = await FacultyAssignment.findOneAndUpdate(
    {
      _id: assignmentId,
      tenantId: tid(tenantId),
      facultyId: tid(facultyId),
      isDeleted: false,
    },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  return mapAssignment(doc);
}

export async function getFacultyStats(tenantId: string) {
  const match = { tenantId: tid(tenantId), isDeleted: false };
  const [total, byStatus, byDept, byEmp] = await Promise.all([
    Faculty.countDocuments(match),
    Faculty.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Faculty.aggregate([
      { $match: { ...match, departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $limit: 50 },
    ]),
    Faculty.aggregate([
      { $match: match },
      { $group: { _id: '$employmentType', count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) statusMap[row._id] = row.count;
  const empMap: Record<string, number> = {};
  for (const row of byEmp) empMap[row._id || 'unknown'] = row.count;

  return {
    total,
    byStatus: statusMap,
    byDepartment: byDept.map((r) => ({ departmentId: String(r._id), count: r.count })),
    byEmploymentType: empMap,
  };
}

export async function countActiveFaculty(tenantId: string): Promise<number> {
  return Faculty.countDocuments({
    tenantId: tid(tenantId),
    isDeleted: false,
    status: { $in: ['active', 'on_leave'] },
  });
}

export async function getFacultyCourses(
  tenantId: string,
  userId: string,
  roles: string[] = []
) {
  const faculty = await Faculty.findOne(baseFilter(tenantId, { userId: tid(userId) })).lean();
  const isAdmin = roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'department_head'].includes(r)
  );

  let courseIds: mongoose.Types.ObjectId[] = [];
  if (faculty) {
    const assignments = await FacultyAssignment.find({
      tenantId: tid(tenantId),
      facultyId: faculty._id,
      isDeleted: false,
    }).lean();
    for (const a of assignments) {
      if (a.courseId) courseIds.push(a.courseId as mongoose.Types.ObjectId);
    }

    const offerings = await CourseOffering.find({
      tenantId: tid(tenantId),
      facultyIds: faculty._id,
      isDeleted: false,
    }).lean();
    for (const o of offerings) {
      if (o.courseId) courseIds.push(o.courseId as mongoose.Types.ObjectId);
    }
  }

  let filter: Record<string, unknown> = baseFilter(tenantId);
  if (courseIds.length > 0) {
    filter._id = { $in: courseIds };
  } else if (isAdmin || !faculty) {
    // If admin or unlinked faculty test user, show all tenant courses
    filter.status = { $ne: 'archived' };
  } else {
    // Linked faculty has no assigned courses yet
    return [];
  }

  const courses = await Course.find(filter).sort({ code: 1 }).lean();

  const results = await Promise.all(
    courses.map(async (c) => {
      const [modulesCount, enrollmentsCount] = await Promise.all([
        CourseModule.countDocuments({
          tenantId: tid(tenantId),
          courseId: c._id,
          isDeleted: false,
        }),
        CourseEnrollment.countDocuments({
          tenantId: tid(tenantId),
          courseId: c._id,
          status: { $in: ['enrolled', 'completed'] },
          isDeleted: false,
        }),
      ]);
      return {
        id: String(c._id),
        code: c.code,
        name: c.name,
        shortName: c.shortName,
        courseType: c.courseType,
        credits: c.credits,
        status: c.status,
        departmentId: idStr(c.departmentId),
        modulesCount,
        enrollmentsCount,
      };
    })
  );

  return results;
}

