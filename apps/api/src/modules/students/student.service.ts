import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { checkLimit } from '../../services/featureFlags';
import { Student, StudentDocument } from './student.model';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function mapStudent(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    userId: idStr(d.userId),
    enrollmentNumber: d.enrollmentNumber,
    rollNumber: d.rollNumber,
    registrationNumber: d.registrationNumber,
    firstName: d.firstName,
    middleName: d.middleName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    alternatePhone: d.alternatePhone,
    dateOfBirth: d.dateOfBirth,
    gender: d.gender,
    bloodGroup: d.bloodGroup,
    nationality: d.nationality,
    category: d.category,
    permanentAddress: d.permanentAddress,
    currentAddress: d.currentAddress,
    photoUrl: d.photoUrl,
    status: d.status,
    enrollmentStatus: d.enrollmentStatus,
    programId: idStr(d.programId),
    batchId: idStr(d.batchId),
    sectionId: idStr(d.sectionId),
    departmentId: idStr(d.departmentId),
    admissionDate: d.admissionDate,
    admissionType: d.admissionType,
    currentSemesterId: idStr(d.currentSemesterId),
    academicYearId: idStr(d.academicYearId),
    academicNotes: d.academicNotes,
    guardians: d.guardians || [],
    emergencyContacts: d.emergencyContacts || [],
    previousEducation: d.previousEducation || [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapDoc(d: any) {
  return {
    id: String(d._id),
    studentId: String(d.studentId),
    tenantId: String(d.tenantId),
    type: d.type,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    mimeType: d.mimeType,
    size: d.size,
    verificationStatus: d.verificationStatus,
    uploadedAt: d.uploadedAt,
    uploadedBy: idStr(d.uploadedBy),
  };
}

function oidOrNull(v: unknown) {
  if (v === undefined || v === null || v === '') return null;
  return tid(String(v));
}

export async function listStudents(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    programId?: string;
    batchId?: string;
    sectionId?: string;
    departmentId?: string;
    sort?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.programId) filter.programId = tid(q.programId);
  if (q.batchId) filter.batchId = tid(q.batchId);
  if (q.sectionId) filter.sectionId = tid(q.sectionId);
  if (q.departmentId) filter.departmentId = tid(q.departmentId);
  if (q.search?.trim()) {
    const s = q.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { enrollmentNumber: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { rollNumber: { $regex: s, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (q.sort === 'name') {
    sort.firstName = 1;
    sort.lastName = 1;
    delete sort.createdAt;
  } else if (q.sort === 'enrollment') {
    sort.enrollmentNumber = 1;
    delete sort.createdAt;
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Student.find(filter).sort(sort).skip(skip).limit(q.limit).lean(),
    Student.countDocuments(filter),
  ]);

  return {
    items: items.map(mapStudent),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createStudent(
  tenantId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const limit = await checkLimit(tenantId, 'activeStudents', 1);
  if (!limit.allowed) {
    throw new AppError(
      403,
      `Plan limit reached for active students (${limit.current}/${limit.limit})`,
      'PLAN_LIMIT_EXCEEDED',
      limit
    );
  }

  const payload: Record<string, unknown> = {
    ...body,
    tenantId: tid(tenantId),
    enrollmentNumber: String(body.enrollmentNumber).toUpperCase(),
    programId: oidOrNull(body.programId),
    batchId: oidOrNull(body.batchId),
    sectionId: oidOrNull(body.sectionId),
    departmentId: oidOrNull(body.departmentId),
    currentSemesterId: oidOrNull(body.currentSemesterId),
    academicYearId: oidOrNull(body.academicYearId),
    userId: oidOrNull(body.userId),
    status: body.status || 'active',
    enrollmentStatus: body.enrollmentStatus || 'enrolled',
    guardians: body.guardians || [],
    emergencyContacts: body.emergencyContacts || [],
    previousEducation: body.previousEducation || [],
    createdBy: userId ? tid(userId) : null,
  };

  try {
    const doc = await Student.create(payload);
    return mapStudent(doc.toObject());
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new AppError(409, 'Enrollment number already exists', 'DUPLICATE');
    }
    throw err;
  }
}

export async function getStudent(tenantId: string, id: string) {
  const doc = await Student.findOne(baseFilter(tenantId, { _id: id })).lean();
  if (!doc) throw new AppError(404, 'Student not found', 'NOT_FOUND');
  return mapStudent(doc);
}

export async function getStudentByUserId(tenantId: string, userId: string) {
  const doc = await Student.findOne(baseFilter(tenantId, { userId: tid(userId) })).lean();
  if (!doc) throw new AppError(404, 'Student profile not linked', 'NOT_FOUND');
  return mapStudent(doc);
}

export async function updateStudent(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const set: Record<string, unknown> = { ...body, updatedBy: userId ? tid(userId) : null };
  if (body.enrollmentNumber) set.enrollmentNumber = String(body.enrollmentNumber).toUpperCase();
  for (const key of [
    'programId',
    'batchId',
    'sectionId',
    'departmentId',
    'currentSemesterId',
    'academicYearId',
    'userId',
  ]) {
    if (body[key] !== undefined) set[key] = oidOrNull(body[key]);
  }

  try {
    const doc = await Student.findOneAndUpdate(
      baseFilter(tenantId, { _id: id }),
      { $set: set },
      { new: true }
    ).lean();
    if (!doc) throw new AppError(404, 'Student not found', 'NOT_FOUND');
    return mapStudent(doc);
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new AppError(409, 'Enrollment number already exists', 'DUPLICATE');
    }
    throw err;
  }
}

export async function softDeleteStudent(tenantId: string, id: string, userId?: string) {
  const doc = await Student.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'withdrawn',
        updatedBy: userId ? tid(userId) : null,
      },
    },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Student not found', 'NOT_FOUND');
  return mapStudent(doc);
}

export async function changeStatus(
  tenantId: string,
  id: string,
  status: string,
  academicNotes?: string,
  userId?: string
) {
  const set: Record<string, unknown> = {
    status,
    updatedBy: userId ? tid(userId) : null,
  };
  if (academicNotes !== undefined) set.academicNotes = academicNotes;
  const doc = await Student.findOneAndUpdate(
    baseFilter(tenantId, { _id: id }),
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Student not found', 'NOT_FOUND');
  return mapStudent(doc);
}

export async function enrollStudent(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  return updateStudent(tenantId, id, body, userId);
}

export async function listDocuments(tenantId: string, studentId: string) {
  await getStudent(tenantId, studentId);
  const items = await StudentDocument.find({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    isDeleted: false,
  })
    .sort({ uploadedAt: -1 })
    .lean();
  return items.map(mapDoc);
}

export async function addDocument(
  tenantId: string,
  studentId: string,
  body: Record<string, unknown>,
  userId?: string
) {
  await getStudent(tenantId, studentId);
  const doc = await StudentDocument.create({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    type: body.type,
    fileName: body.fileName,
    fileUrl: body.fileUrl,
    mimeType: body.mimeType,
    size: body.size,
    uploadedBy: userId ? tid(userId) : null,
  });
  return mapDoc(doc.toObject());
}

export async function removeDocument(
  tenantId: string,
  studentId: string,
  docId: string
) {
  const doc = await StudentDocument.findOneAndUpdate(
    {
      _id: docId,
      tenantId: tid(tenantId),
      studentId: tid(studentId),
      isDeleted: false,
    },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError(404, 'Document not found', 'NOT_FOUND');
  return mapDoc(doc);
}

export async function bulkCreate(
  tenantId: string,
  students: Record<string, unknown>[],
  userId?: string
) {
  const limit = await checkLimit(tenantId, 'activeStudents', students.length);
  if (!limit.allowed) {
    throw new AppError(
      403,
      `Plan limit reached for active students (${limit.current}/${limit.limit})`,
      'PLAN_LIMIT_EXCEEDED',
      limit
    );
  }

  const results: { success: boolean; data?: unknown; error?: string; index: number }[] = [];
  for (let i = 0; i < students.length; i++) {
    try {
      const data = await createStudent(tenantId, students[i], userId);
      results.push({ success: true, data, index: i });
    } catch (err: any) {
      results.push({
        success: false,
        error: err?.message || 'Failed',
        index: i,
      });
    }
  }
  return {
    total: students.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

export async function exportStudents(
  tenantId: string,
  q: {
    search?: string;
    status?: string;
    programId?: string;
    batchId?: string;
    sectionId?: string;
    departmentId?: string;
    format: 'json' | 'csv';
  }
) {
  const result = await listStudents(tenantId, {
    page: 1,
    limit: 5000,
    search: q.search,
    status: q.status,
    programId: q.programId,
    batchId: q.batchId,
    sectionId: q.sectionId,
    departmentId: q.departmentId,
  });

  if (q.format === 'csv') {
    const headers = [
      'enrollmentNumber',
      'firstName',
      'lastName',
      'email',
      'phone',
      'status',
      'programId',
      'batchId',
      'sectionId',
    ];
    const lines = [headers.join(',')];
    for (const s of result.items) {
      lines.push(
        headers
          .map((h) => {
            const v = (s as any)[h] ?? '';
            const str = String(v).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      );
    }
    return { format: 'csv' as const, content: lines.join('\n'), count: result.items.length };
  }

  return { format: 'json' as const, content: result.items, count: result.items.length };
}

export async function getStudentStats(tenantId: string) {
  const match = { tenantId: tid(tenantId), isDeleted: false };
  const [total, byStatus, byProgram, byBatch] = await Promise.all([
    Student.countDocuments(match),
    Student.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Student.aggregate([
      { $match: { ...match, programId: { $ne: null } } },
      { $group: { _id: '$programId', count: { $sum: 1 } } },
      { $limit: 50 },
    ]),
    Student.aggregate([
      { $match: { ...match, batchId: { $ne: null } } },
      { $group: { _id: '$batchId', count: { $sum: 1 } } },
      { $limit: 50 },
    ]),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) statusMap[row._id] = row.count;

  return {
    total,
    byStatus: statusMap,
    byProgram: byProgram.map((r) => ({ programId: String(r._id), count: r.count })),
    byBatch: byBatch.map((r) => ({ batchId: String(r._id), count: r.count })),
  };
}

/** Count active students for plan limits */
export async function countActiveStudents(tenantId: string): Promise<number> {
  return Student.countDocuments({
    tenantId: tid(tenantId),
    isDeleted: false,
    status: { $in: ['active', 'on_leave'] },
  });
}
