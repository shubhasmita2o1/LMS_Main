import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { Assignment, AssignmentSubmission } from './assignment.model';
import { Course } from '../courses/course.model';
import { Student } from '../students/student.model';
import {
  resolveStudentId,
  assertEnrolled,
  assertCanAccessCourse,
} from '../learn/learn.service';
import type {
  AssignmentPublic,
  AssignmentSubmissionPublic,
} from '@university-lms/shared';

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

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapAssignment(d: any, extra: Partial<AssignmentPublic> = {}): AssignmentPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    moduleId: idStr(d.moduleId),
    lessonId: idStr(d.lessonId),
    title: d.title,
    description: d.description ?? null,
    instructions: d.instructions ?? null,
    attachments: (d.attachments || []).map((a: any) => ({
      fileKey: a.fileKey,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
    })),
    maxMarks: d.maxMarks,
    passingMarks: d.passingMarks ?? null,
    availableFrom: d.availableFrom ?? null,
    dueAt: d.dueAt ?? null,
    lateDueAt: d.lateDueAt ?? null,
    allowLate: !!d.allowLate,
    latePenaltyPercent: d.latePenaltyPercent ?? null,
    allowResubmission: !!d.allowResubmission,
    maxSubmissions: d.maxSubmissions ?? 1,
    rubric: (d.rubric || []).map((r: any) => ({
      criterion: r.criterion,
      maxMarks: r.maxMarks,
      description: r.description,
    })),
    status: d.status,
    createdBy: idStr(d.createdBy),
    submissionsCount: extra.submissionsCount,
    mySubmissionStatus: extra.mySubmissionStatus,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapSubmission(d: any, extra: Partial<AssignmentSubmissionPublic> = {}): AssignmentSubmissionPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    assignmentId: String(d.assignmentId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    attemptNumber: d.attemptNumber,
    body: d.body ?? null,
    attachments: (d.attachments || []).map((a: any) => ({
      fileKey: a.fileKey,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
    })),
    submittedAt: d.submittedAt ?? null,
    isLate: !!d.isLate,
    status: d.status,
    marksAwarded: d.marksAwarded ?? null,
    feedback: d.feedback ?? null,
    gradedBy: idStr(d.gradedBy),
    gradedAt: d.gradedAt ?? null,
    rubricScores: (d.rubricScores || []).map((r: any) => ({
      criterionIndex: r.criterionIndex,
      marks: r.marks,
      comment: r.comment,
    })),
    plagiarismScore: d.plagiarismScore ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    studentName: extra.studentName,
  };
}

function isAdminOrFaculty(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );
}

/** Faculty of course OR tenant admin */
async function assertCanManageAssignment(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string
) {
  if (user.roles.some((r) => ['super_admin', 'tenant_admin', 'university_admin'].includes(r))) {
    return;
  }
  // Faculty: must be able to access course (offering faculty or admin path)
  await assertCanAccessCourse(tenantId, user, courseId);
}

// ─── List / CRUD ────────────────────────────────────────────────────────────

export async function listAssignments(
  tenantId: string,
  q: { page: number; limit: number; courseId?: string; status?: string; search?: string },
  user?: { id: string; roles: string[] }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = { $regex: q.search, $options: 'i' };

  // Students only see published+ for enrolled courses
  const isStudentOnly =
    user &&
    user.roles.includes('student') &&
    !isAdminOrFaculty(user.roles);
  if (isStudentOnly) {
    filter.status = { $in: ['published', 'closed'] };
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Assignment.find(filter).sort({ dueAt: 1, createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Assignment.countDocuments(filter),
  ]);

  let studentId: string | null = null;
  if (isStudentOnly && user) {
    try {
      studentId = await resolveStudentId(tenantId, user.id);
    } catch {
      studentId = null;
    }
  }

  const mapped: AssignmentPublic[] = [];
  for (const d of items) {
    const count = await AssignmentSubmission.countDocuments(
      baseFilter(tenantId, { assignmentId: d._id })
    );
    let myStatus: AssignmentPublic['mySubmissionStatus'] = null;
    if (studentId) {
      const mine = (await AssignmentSubmission.findOne(
        baseFilter(tenantId, {
          assignmentId: d._id,
          studentId: tid(studentId),
        })
      )
        .sort({ attemptNumber: -1 })
        .lean()) as any;
      myStatus = (mine?.status as any) ?? null;
    }
    mapped.push(mapAssignment(d, { submissionsCount: count, mySubmissionStatus: myStatus }));
  }

  return {
    items: mapped,
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getAssignment(
  tenantId: string,
  id: string,
  user?: { id: string; roles: string[] }
) {
  const doc = (await Assignment.findOne(
    baseFilter(tenantId, { _id: tid(id) })
  ).lean()) as any;
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');

  const count = await AssignmentSubmission.countDocuments(
    baseFilter(tenantId, { assignmentId: doc._id })
  );

  let myStatus: AssignmentPublic['mySubmissionStatus'] = null;
  if (user?.roles.includes('student') && !isAdminOrFaculty(user.roles)) {
    const studentId = await resolveStudentId(tenantId, user.id);
    await assertEnrolled(tenantId, studentId, String(doc.courseId));
    if (doc.status === 'draft') {
      throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
    }
    const mine = (await AssignmentSubmission.findOne(
      baseFilter(tenantId, { assignmentId: doc._id, studentId: tid(studentId) })
    )
      .sort({ attemptNumber: -1 })
      .lean()) as any;
    myStatus = (mine?.status as any) ?? null;
  }

  return mapAssignment(doc, { submissionsCount: count, mySubmissionStatus: myStatus });
}

export async function createAssignment(
  tenantId: string,
  body: Record<string, any>,
  user: { id: string; roles: string[] }
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, body.courseId);

  const doc = await Assignment.create({
    tenantId: tid(tenantId),
    courseId: tid(body.courseId),
    offeringId: body.offeringId ? tid(body.offeringId) : null,
    moduleId: body.moduleId ? tid(body.moduleId) : null,
    lessonId: body.lessonId ? tid(body.lessonId) : null,
    title: body.title,
    description: body.description ?? null,
    instructions: body.instructions ?? null,
    attachments: body.attachments ?? [],
    maxMarks: body.maxMarks ?? 100,
    passingMarks: body.passingMarks ?? null,
    availableFrom: parseDate(body.availableFrom),
    dueAt: parseDate(body.dueAt),
    lateDueAt: parseDate(body.lateDueAt),
    allowLate: body.allowLate ?? false,
    latePenaltyPercent: body.latePenaltyPercent ?? null,
    allowResubmission: body.allowResubmission ?? false,
    maxSubmissions: body.maxSubmissions ?? 1,
    rubric: body.rubric ?? [],
    status: body.status ?? 'draft',
    createdBy: tid(user.id),
  });
  return mapAssignment(doc.toObject());
}

export async function updateAssignment(
  tenantId: string,
  id: string,
  body: Record<string, any>,
  user: { id: string; roles: string[] }
) {
  const doc = await Assignment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(doc.courseId));

  const scalar = [
    'title',
    'description',
    'instructions',
    'attachments',
    'maxMarks',
    'passingMarks',
    'allowLate',
    'latePenaltyPercent',
    'allowResubmission',
    'maxSubmissions',
    'rubric',
    'status',
  ] as const;
  for (const f of scalar) {
    if (body[f] !== undefined) (doc as any)[f] = body[f];
  }
  if (body.availableFrom !== undefined) doc.availableFrom = parseDate(body.availableFrom);
  if (body.dueAt !== undefined) doc.dueAt = parseDate(body.dueAt);
  if (body.lateDueAt !== undefined) doc.lateDueAt = parseDate(body.lateDueAt);
  if (body.offeringId !== undefined)
    doc.offeringId = body.offeringId ? tid(body.offeringId) : null;
  if (body.moduleId !== undefined) doc.moduleId = body.moduleId ? tid(body.moduleId) : null;
  if (body.lessonId !== undefined) doc.lessonId = body.lessonId ? tid(body.lessonId) : null;
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapAssignment(doc.toObject());
}

export async function softDeleteAssignment(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Assignment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(doc.courseId));
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return { id };
}

export async function publishAssignment(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Assignment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(doc.courseId));
  doc.status = 'published';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapAssignment(doc.toObject());
}

export async function closeAssignment(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Assignment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(doc.courseId));
  doc.status = 'closed';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapAssignment(doc.toObject());
}

// ─── Submissions ────────────────────────────────────────────────────────────

export async function listSubmissions(
  tenantId: string,
  assignmentId: string,
  q: { page: number; limit: number; status?: string; studentId?: string },
  user: { id: string; roles: string[] }
) {
  const assignment = await Assignment.findOne(baseFilter(tenantId, { _id: tid(assignmentId) }));
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(assignment.courseId));

  const filter: Record<string, unknown> = baseFilter(tenantId, {
    assignmentId: tid(assignmentId),
  });
  if (q.status) filter.status = q.status;
  if (q.studentId) filter.studentId = tid(q.studentId);

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    AssignmentSubmission.find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    AssignmentSubmission.countDocuments(filter),
  ]);

  const studentIds = [...new Set(items.map((i) => String(i.studentId)))];
  const students = await Student.find({
    _id: { $in: studentIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('firstName lastName rollNumber')
    .lean();
  const nameMap = new Map(
    students.map((s) => [
      String(s._id),
      [s.firstName, s.lastName].filter(Boolean).join(' ') || (s as any).rollNumber || 'Student',
    ])
  );

  return {
    items: items.map((d) =>
      mapSubmission(d, { studentName: nameMap.get(String(d.studentId)) })
    ),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getMySubmissions(
  tenantId: string,
  assignmentId: string,
  user: { id: string; roles: string[] }
) {
  const assignment = await Assignment.findOne(baseFilter(tenantId, { _id: tid(assignmentId) }));
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (assignment.status === 'draft') {
    throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(assignment.courseId));

  const items = await AssignmentSubmission.find(
    baseFilter(tenantId, {
      assignmentId: tid(assignmentId),
      studentId: tid(studentId),
    })
  )
    .sort({ attemptNumber: -1 })
    .lean();

  return items.map((d) => mapSubmission(d));
}

export async function submitAssignment(
  tenantId: string,
  assignmentId: string,
  body: { body?: string | null; attachments?: any[]; asDraft?: boolean },
  user: { id: string; roles: string[] }
) {
  const assignment = await Assignment.findOne(baseFilter(tenantId, { _id: tid(assignmentId) }));
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (assignment.status !== 'published') {
    throw new AppError(400, 'Assignment is not open for submission', 'NOT_OPEN');
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(assignment.courseId));

  const now = new Date();
  if (assignment.availableFrom && now < assignment.availableFrom) {
    throw new AppError(400, 'Assignment is not yet available', 'NOT_AVAILABLE');
  }

  // Hard cutoff
  if (assignment.lateDueAt && now > assignment.lateDueAt) {
    throw new AppError(400, 'Submission deadline has passed', 'DEADLINE_PASSED');
  }
  if (!assignment.allowLate && assignment.dueAt && now > assignment.dueAt) {
    throw new AppError(400, 'Due date has passed and late submissions are not allowed', 'DEADLINE_PASSED');
  }

  const existingCount = await AssignmentSubmission.countDocuments(
    baseFilter(tenantId, {
      assignmentId: tid(assignmentId),
      studentId: tid(studentId),
      status: { $ne: 'draft' },
    })
  );

  const draft = await AssignmentSubmission.findOne(
    baseFilter(tenantId, {
      assignmentId: tid(assignmentId),
      studentId: tid(studentId),
      status: 'draft',
    })
  );

  const isLate = !!(assignment.dueAt && now > assignment.dueAt);
  const asDraft = !!body.asDraft;

  if (!asDraft && existingCount >= assignment.maxSubmissions) {
    if (!assignment.allowResubmission || existingCount >= assignment.maxSubmissions) {
      throw new AppError(400, 'Maximum submissions reached', 'MAX_SUBMISSIONS');
    }
  }

  if (draft) {
    draft.body = body.body ?? draft.body;
    if (body.attachments) draft.attachments = body.attachments;
    if (asDraft) {
      draft.status = 'draft';
    } else {
      draft.status = isLate ? 'late' : 'submitted';
      draft.submittedAt = now;
      draft.isLate = isLate;
      draft.attemptNumber = existingCount + 1;
    }
    draft.updatedBy = tid(user.id);
    await draft.save();
    return mapSubmission(draft.toObject());
  }

  const attemptNumber = asDraft ? existingCount + 1 : existingCount + 1;
  const doc = await AssignmentSubmission.create({
    tenantId: tid(tenantId),
    assignmentId: tid(assignmentId),
    studentId: tid(studentId),
    courseId: assignment.courseId,
    attemptNumber,
    body: body.body ?? null,
    attachments: body.attachments ?? [],
    submittedAt: asDraft ? null : now,
    isLate: asDraft ? false : isLate,
    status: asDraft ? 'draft' : isLate ? 'late' : 'submitted',
    createdBy: tid(user.id),
  });
  return mapSubmission(doc.toObject());
}

export async function updateSubmission(
  tenantId: string,
  submissionId: string,
  body: { body?: string | null; attachments?: any[]; asDraft?: boolean },
  user: { id: string; roles: string[] }
) {
  const doc = await AssignmentSubmission.findOne(
    baseFilter(tenantId, { _id: tid(submissionId) })
  );
  if (!doc) throw new AppError(404, 'Submission not found', 'NOT_FOUND');

  const studentId = await resolveStudentId(tenantId, user.id);
  if (String(doc.studentId) !== studentId) {
    throw new AppError(403, 'Not your submission', 'FORBIDDEN');
  }

  const assignment = await Assignment.findOne(
    baseFilter(tenantId, { _id: doc.assignmentId })
  );
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (assignment.status !== 'published') {
    throw new AppError(400, 'Assignment is not open', 'NOT_OPEN');
  }

  const now = new Date();
  if (assignment.lateDueAt && now > assignment.lateDueAt) {
    throw new AppError(400, 'Submission deadline has passed', 'DEADLINE_PASSED');
  }

  // Only draft or resubmittable
  if (doc.status !== 'draft' && !assignment.allowResubmission) {
    throw new AppError(400, 'Resubmission not allowed', 'RESUBMIT_DENIED');
  }
  if (doc.status === 'graded' || doc.status === 'returned') {
    if (!assignment.allowResubmission) {
      throw new AppError(400, 'Cannot modify graded submission', 'RESUBMIT_DENIED');
    }
  }

  if (body.body !== undefined) doc.body = body.body;
  if (body.attachments) doc.attachments = body.attachments;

  if (body.asDraft) {
    doc.status = 'draft';
    doc.submittedAt = null;
  } else {
    const isLate = !!(assignment.dueAt && now > assignment.dueAt);
    doc.status = doc.status === 'submitted' || doc.status === 'late' ? 'resubmitted' : isLate ? 'late' : 'submitted';
    doc.submittedAt = now;
    doc.isLate = isLate;
  }
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapSubmission(doc.toObject());
}

export async function gradeSubmission(
  tenantId: string,
  submissionId: string,
  body: {
    marksAwarded: number;
    feedback?: string | null;
    rubricScores?: any[];
    status?: 'graded' | 'returned';
    plagiarismScore?: number | null;
  },
  user: { id: string; roles: string[] }
) {
  const doc = await AssignmentSubmission.findOne(
    baseFilter(tenantId, { _id: tid(submissionId) })
  );
  if (!doc) throw new AppError(404, 'Submission not found', 'NOT_FOUND');

  const assignment = await Assignment.findOne(
    baseFilter(tenantId, { _id: doc.assignmentId })
  );
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await assertCanManageAssignment(tenantId, user, String(assignment.courseId));

  if (body.marksAwarded > assignment.maxMarks) {
    throw new AppError(400, 'Marks exceed max marks', 'INVALID_MARKS');
  }

  // Server-side marks only — never trust client total beyond validation
  doc.marksAwarded = body.marksAwarded;
  doc.feedback = body.feedback ?? null;
  if (body.rubricScores) doc.rubricScores = body.rubricScores;
  if (body.plagiarismScore !== undefined) doc.plagiarismScore = body.plagiarismScore;
  doc.status = body.status ?? 'graded';
  doc.gradedBy = tid(user.id);
  doc.gradedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapSubmission(doc.toObject());
}
