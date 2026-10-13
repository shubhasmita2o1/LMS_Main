import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { checkLimit } from '../../services/featureFlags';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseOffering,
  CurriculumEntry,
  CourseEnrollment,
} from './course.model';

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

function mapCredits(c: any) {
  return {
    theory: c?.theory ?? 0,
    practical: c?.practical ?? 0,
    total: c?.total ?? (c?.theory ?? 0) + (c?.practical ?? 0),
  };
}

function mapCourseList(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    programId: String(d.programId),
    departmentId: idStr(d.departmentId),
    code: d.code,
    name: d.name,
    shortName: d.shortName,
    courseType: d.courseType,
    credits: mapCredits(d.credits),
    status: d.status,
    isElective: Boolean(d.isElective),
    isLab: Boolean(d.isLab),
    maxSeats: d.maxSeats ?? null,
    createdAt: d.createdAt,
  };
}

function mapCourse(d: any, extra: Record<string, unknown> = {}) {
  return {
    ...mapCourseList(d),
    description: d.description,
    lectureHours: d.lectureHours,
    labHours: d.labHours,
    tutorialHours: d.tutorialHours,
    prerequisites: (d.prerequisites || []).map((p: any) => ({
      courseId: String(p.courseId),
      type: p.type || 'required',
    })),
    corequisites: (d.corequisites || []).map((id: any) => String(id)),
    learningOutcomes: d.learningOutcomes || [],
    syllabusOutline: d.syllabusOutline,
    updatedAt: d.updatedAt,
    ...extra,
  };
}

function mapModule(d: any, lessonsCount?: number) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    title: d.title,
    order: d.order,
    description: d.description,
    status: d.status,
    lessonsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapLesson(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    moduleId: String(d.moduleId),
    chapterId: idStr(d.chapterId),
    title: d.title,
    order: d.order,
    contentType: d.contentType,
    durationMinutes: d.durationMinutes ?? null,
    isFreePreview: Boolean(d.isFreePreview),
    contentSummary: d.contentSummary,
    contentUrl: d.contentUrl ?? null,
    fileKey: d.fileKey ?? null,
    fileName: d.fileName ?? null,
    mimeType: d.mimeType ?? null,
    fileSize: d.fileSize ?? null,
    textBody: d.textBody ?? null,
    videoProvider: d.videoProvider ?? null,
    videoUrl: d.videoUrl ?? null,
    durationSeconds: d.durationSeconds ?? null,
    captionsUrl: d.captionsUrl ?? null,
    transcript: d.transcript ?? null,
    allowDownload: Boolean(d.allowDownload),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapOffering(d: any, enrolledCount?: number) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    sectionId: idStr(d.sectionId),
    batchId: idStr(d.batchId),
    academicYearId: idStr(d.academicYearId),
    semesterId: idStr(d.semesterId),
    facultyIds: (d.facultyIds || []).map((id: any) => String(id)),
    maxStudents: d.maxStudents ?? null,
    status: d.status,
    enrolledCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapCurriculum(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    programId: String(d.programId),
    courseId: String(d.courseId),
    semesterNumber: d.semesterNumber ?? null,
    yearNumber: d.yearNumber ?? null,
    isMandatory: Boolean(d.isMandatory),
    creditsOverride: d.creditsOverride ?? null,
    order: d.order ?? 0,
    createdAt: d.createdAt,
  };
}

function mapEnrollment(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    sectionId: idStr(d.sectionId),
    status: d.status,
    enrolledAt: d.enrolledAt,
    grade: d.grade ?? null,
    createdAt: d.createdAt,
  };
}

/** Count non-deleted courses for plan limits */
export async function countCourses(tenantId: string): Promise<number> {
  return Course.countDocuments(baseFilter(tenantId));
}

// ─── Course CRUD ────────────────────────────────────────────────────────────

export async function listCourses(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    programId?: string;
    departmentId?: string;
    courseType?: string;
    status?: string;
    sort?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.programId) filter.programId = tid(q.programId);
  if (q.departmentId) filter.departmentId = tid(q.departmentId);
  if (q.courseType) filter.courseType = q.courseType;
  if (q.status) filter.status = q.status;
  if (q.search) {
    filter.$or = [
      { code: new RegExp(q.search, 'i') },
      { name: new RegExp(q.search, 'i') },
      { shortName: new RegExp(q.search, 'i') },
    ];
  }

  const sort: Record<string, 1 | -1> = { code: 1 };
  if (q.sort === '-createdAt') sort.createdAt = -1;
  else if (q.sort === 'name') {
    delete (sort as any).code;
    sort.name = 1;
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Course.find(filter).sort(sort).skip(skip).limit(q.limit).lean(),
    Course.countDocuments(filter),
  ]);

  return {
    items: items.map(mapCourseList),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createCourse(
  tenantId: string,
  body: Record<string, any>,
  userId?: string
) {
  const limit = await checkLimit(tenantId, 'courses', 1);
  if (!limit.allowed) {
    throw new AppError(
      403,
      `Plan limit reached for courses (${limit.current}/${limit.limit})`,
      'PLAN_LIMIT_EXCEEDED',
      limit
    );
  }

  const existing = await Course.findOne(
    baseFilter(tenantId, { code: String(body.code).toUpperCase().trim() })
  );
  if (existing) {
    throw new AppError(409, 'Course code already exists', 'DUPLICATE_CODE');
  }

  const credits = body.credits || { theory: 0, practical: 0, total: 0 };
  if (credits.total === 0 && (credits.theory || credits.practical)) {
    credits.total = (credits.theory || 0) + (credits.practical || 0);
  }

  const doc = await Course.create({
    tenantId: tid(tenantId),
    programId: tid(body.programId),
    departmentId: oidOrNull(body.departmentId),
    code: String(body.code).toUpperCase().trim(),
    name: body.name.trim(),
    shortName: body.shortName?.trim(),
    description: body.description,
    courseType: body.courseType || 'core',
    credits,
    lectureHours: body.lectureHours,
    labHours: body.labHours,
    tutorialHours: body.tutorialHours,
    prerequisites: (body.prerequisites || []).map((p: any) => ({
      courseId: tid(p.courseId),
      type: p.type || 'required',
    })),
    corequisites: (body.corequisites || []).map((id: string) => tid(id)),
    learningOutcomes: body.learningOutcomes || [],
    syllabusOutline: body.syllabusOutline,
    status: body.status || 'draft',
    isElective: body.isElective ?? body.courseType === 'elective',
    isLab: body.isLab ?? body.courseType === 'lab',
    maxSeats: body.maxSeats ?? null,
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapCourse(doc.toObject());
}

export async function getCourse(tenantId: string, id: string) {
  const doc = await Course.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const [modulesCount, lessonsCount] = await Promise.all([
    CourseModule.countDocuments(baseFilter(tenantId, { courseId: tid(id) })),
    CourseLesson.countDocuments(baseFilter(tenantId, { courseId: tid(id) })),
  ]);

  return mapCourse(doc, { modulesCount, lessonsCount });
}

export async function updateCourse(
  tenantId: string,
  id: string,
  body: Record<string, any>,
  userId?: string
) {
  const doc = await Course.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  if (body.code && body.code.toUpperCase().trim() !== doc.code) {
    const dup = await Course.findOne(
      baseFilter(tenantId, {
        code: body.code.toUpperCase().trim(),
        _id: { $ne: doc._id },
      })
    );
    if (dup) throw new AppError(409, 'Course code already exists', 'DUPLICATE_CODE');
    doc.code = body.code.toUpperCase().trim();
  }

  if (body.programId !== undefined) doc.programId = tid(body.programId);
  if (body.departmentId !== undefined) doc.departmentId = oidOrNull(body.departmentId);
  if (body.name !== undefined) doc.name = body.name.trim();
  if (body.shortName !== undefined) doc.shortName = body.shortName?.trim();
  if (body.description !== undefined) doc.description = body.description;
  if (body.courseType !== undefined) doc.courseType = body.courseType;
  if (body.credits !== undefined) {
    const c = body.credits;
    doc.credits = {
      theory: c.theory ?? 0,
      practical: c.practical ?? 0,
      total: c.total ?? (c.theory ?? 0) + (c.practical ?? 0),
    };
  }
  if (body.lectureHours !== undefined) doc.lectureHours = body.lectureHours;
  if (body.labHours !== undefined) doc.labHours = body.labHours;
  if (body.tutorialHours !== undefined) doc.tutorialHours = body.tutorialHours;
  if (body.prerequisites !== undefined) {
    doc.prerequisites = body.prerequisites.map((p: any) => ({
      courseId: tid(p.courseId),
      type: p.type || 'required',
    }));
  }
  if (body.corequisites !== undefined) {
    doc.corequisites = body.corequisites.map((id: string) => tid(id));
  }
  if (body.learningOutcomes !== undefined) doc.learningOutcomes = body.learningOutcomes;
  if (body.syllabusOutline !== undefined) doc.syllabusOutline = body.syllabusOutline;
  if (body.status !== undefined) doc.status = body.status;
  if (body.isElective !== undefined) doc.isElective = body.isElective;
  if (body.isLab !== undefined) doc.isLab = body.isLab;
  if (body.maxSeats !== undefined) doc.maxSeats = body.maxSeats;
  if (userId) doc.updatedBy = tid(userId);

  await doc.save();
  return mapCourse(doc.toObject());
}

export async function softDeleteCourse(tenantId: string, id: string, userId?: string) {
  const doc = await Course.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id: String(doc._id), deleted: true };
}

export async function setPrerequisites(
  tenantId: string,
  id: string,
  prerequisites: Array<{ courseId: string; type?: string }>,
  userId?: string
) {
  const doc = await Course.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  // Prevent self-reference
  const filtered = prerequisites.filter((p) => p.courseId !== id);
  doc.prerequisites = filtered.map((p) => ({
    courseId: tid(p.courseId),
    type: (p.type as any) || 'required',
  }));
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapCourse(doc.toObject());
}

// ─── Modules & Lessons ──────────────────────────────────────────────────────

export async function listModules(tenantId: string, courseId: string) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) })).lean();
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const modules = await CourseModule.find(baseFilter(tenantId, { courseId: tid(courseId) }))
    .sort({ order: 1 })
    .lean();

  const lessonCounts = await CourseLesson.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        courseId: tid(courseId),
        isDeleted: false,
      },
    },
    { $group: { _id: '$moduleId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(lessonCounts.map((r) => [String(r._id), r.count]));

  return modules.map((m) => mapModule(m, countMap.get(String(m._id)) || 0));
}

export async function createModule(
  tenantId: string,
  courseId: string,
  body: Record<string, any>,
  userId?: string
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  let order = body.order;
  if (order === undefined) {
    const last = await CourseModule.findOne(baseFilter(tenantId, { courseId: tid(courseId) }))
      .sort({ order: -1 })
      .lean();
    order = last ? last.order + 1 : 0;
  }

  const doc = await CourseModule.create({
    tenantId: tid(tenantId),
    courseId: tid(courseId),
    title: body.title.trim(),
    order,
    description: body.description,
    status: body.status || 'draft',
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapModule(doc.toObject(), 0);
}

export async function updateModule(
  tenantId: string,
  moduleId: string,
  body: Record<string, any>,
  userId?: string
) {
  const doc = await CourseModule.findOne(baseFilter(tenantId, { _id: tid(moduleId) }));
  if (!doc) throw new AppError(404, 'Module not found', 'NOT_FOUND');

  if (body.title !== undefined) doc.title = body.title.trim();
  if (body.order !== undefined) doc.order = body.order;
  if (body.description !== undefined) doc.description = body.description;
  if (body.status !== undefined) doc.status = body.status;
  if (userId) doc.updatedBy = tid(userId);

  await doc.save();
  return mapModule(doc.toObject());
}

export async function softDeleteModule(tenantId: string, moduleId: string, userId?: string) {
  const doc = await CourseModule.findOne(baseFilter(tenantId, { _id: tid(moduleId) }));
  if (!doc) throw new AppError(404, 'Module not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();

  // Soft-delete lessons under this module
  await CourseLesson.updateMany(
    baseFilter(tenantId, { moduleId: tid(moduleId) }),
    { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId ? tid(userId) : null } }
  );

  return { id: String(doc._id), deleted: true };
}

export async function createLesson(
  tenantId: string,
  moduleId: string,
  body: Record<string, any>,
  userId?: string
) {
  const mod = await CourseModule.findOne(baseFilter(tenantId, { _id: tid(moduleId) }));
  if (!mod) throw new AppError(404, 'Module not found', 'NOT_FOUND');

  let order = body.order;
  if (order === undefined) {
    const last = await CourseLesson.findOne(baseFilter(tenantId, { moduleId: tid(moduleId) }))
      .sort({ order: -1 })
      .lean();
    order = last ? last.order + 1 : 0;
  }

  const doc = await CourseLesson.create({
    tenantId: tid(tenantId),
    courseId: mod.courseId,
    moduleId: tid(moduleId),
    title: body.title.trim(),
    order,
    contentType: body.contentType || 'text',
    durationMinutes: body.durationMinutes ?? null,
    isFreePreview: body.isFreePreview ?? false,
    contentSummary: body.contentSummary,
    contentUrl: body.contentUrl ?? null,
    fileKey: body.fileKey ?? null,
    fileName: body.fileName ?? null,
    mimeType: body.mimeType ?? null,
    fileSize: body.fileSize ?? null,
    textBody: body.textBody ?? null,
    videoProvider: body.videoProvider ?? null,
    videoUrl: body.videoUrl ?? null,
    durationSeconds: body.durationSeconds ?? null,
    captionsUrl: body.captionsUrl ?? null,
    transcript: body.transcript ?? null,
    allowDownload: body.allowDownload ?? false,
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapLesson(doc.toObject());
}

export async function updateLesson(
  tenantId: string,
  lessonId: string,
  body: Record<string, any>,
  userId?: string
) {
  const doc = await CourseLesson.findOne(baseFilter(tenantId, { _id: tid(lessonId) }));
  if (!doc) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');

  if (body.title !== undefined) doc.title = body.title.trim();
  if (body.order !== undefined) doc.order = body.order;
  if (body.contentType !== undefined) doc.contentType = body.contentType;
  if (body.durationMinutes !== undefined) doc.durationMinutes = body.durationMinutes;
  if (body.isFreePreview !== undefined) doc.isFreePreview = body.isFreePreview;
  if (body.contentSummary !== undefined) doc.contentSummary = body.contentSummary;
  if (body.contentUrl !== undefined) doc.contentUrl = body.contentUrl;
  if (body.fileKey !== undefined) doc.fileKey = body.fileKey;
  if (body.fileName !== undefined) doc.fileName = body.fileName;
  if (body.mimeType !== undefined) doc.mimeType = body.mimeType;
  if (body.fileSize !== undefined) doc.fileSize = body.fileSize;
  if (body.textBody !== undefined) doc.textBody = body.textBody;
  if (body.videoProvider !== undefined) doc.videoProvider = body.videoProvider;
  if (body.videoUrl !== undefined) doc.videoUrl = body.videoUrl;
  if (body.durationSeconds !== undefined) doc.durationSeconds = body.durationSeconds;
  if (body.captionsUrl !== undefined) doc.captionsUrl = body.captionsUrl;
  if (body.transcript !== undefined) doc.transcript = body.transcript;
  if (body.allowDownload !== undefined) doc.allowDownload = body.allowDownload;
  if (userId) doc.updatedBy = tid(userId);

  await doc.save();
  return mapLesson(doc.toObject());
}

export async function softDeleteLesson(tenantId: string, lessonId: string, userId?: string) {
  const doc = await CourseLesson.findOne(baseFilter(tenantId, { _id: tid(lessonId) }));
  if (!doc) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id: String(doc._id), deleted: true };
}

export async function listLessons(tenantId: string, moduleId: string) {
  const mod = await CourseModule.findOne(baseFilter(tenantId, { _id: tid(moduleId) })).lean();
  if (!mod) throw new AppError(404, 'Module not found', 'NOT_FOUND');

  const lessons = await CourseLesson.find(baseFilter(tenantId, { moduleId: tid(moduleId) }))
    .sort({ order: 1 })
    .lean();
  return lessons.map(mapLesson);
}

// ─── Offerings ──────────────────────────────────────────────────────────────

export async function listOfferings(tenantId: string, courseId: string) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) })).lean();
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const offerings = await CourseOffering.find(baseFilter(tenantId, { courseId: tid(courseId) }))
    .sort({ createdAt: -1 })
    .lean();

  const counts = await CourseEnrollment.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        courseId: tid(courseId),
        isDeleted: false,
        status: 'enrolled',
      },
    },
    { $group: { _id: '$offeringId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((r) => [String(r._id), r.count]));

  return offerings.map((o) => mapOffering(o, countMap.get(String(o._id)) || 0));
}

export async function createOffering(
  tenantId: string,
  courseId: string,
  body: Record<string, any>,
  userId?: string
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const doc = await CourseOffering.create({
    tenantId: tid(tenantId),
    courseId: tid(courseId),
    sectionId: oidOrNull(body.sectionId),
    batchId: oidOrNull(body.batchId),
    academicYearId: oidOrNull(body.academicYearId),
    semesterId: oidOrNull(body.semesterId),
    facultyIds: (body.facultyIds || []).map((id: string) => tid(id)),
    maxStudents: body.maxStudents ?? course.maxSeats ?? null,
    status: body.status || 'planned',
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapOffering(doc.toObject(), 0);
}

export async function assignFacultyToOffering(
  tenantId: string,
  offeringId: string,
  facultyIds: string[],
  userId?: string
) {
  const doc = await CourseOffering.findOne(baseFilter(tenantId, { _id: tid(offeringId) }));
  if (!doc) throw new AppError(404, 'Offering not found', 'NOT_FOUND');

  doc.facultyIds = facultyIds.map((id) => tid(id));
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapOffering(doc.toObject());
}

// ─── Curriculum ─────────────────────────────────────────────────────────────

export async function getCurriculum(tenantId: string, programId: string) {
  const entries = await CurriculumEntry.find(baseFilter(tenantId, { programId: tid(programId) }))
    .sort({ yearNumber: 1, semesterNumber: 1, order: 1 })
    .lean();
  return entries.map(mapCurriculum);
}

export async function addCurriculumEntry(
  tenantId: string,
  body: Record<string, any>,
  userId?: string
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) })).lean();
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const existing = await CurriculumEntry.findOne(
    baseFilter(tenantId, {
      programId: tid(body.programId),
      courseId: tid(body.courseId),
    })
  );
  if (existing) {
    throw new AppError(409, 'Course already in curriculum for this program', 'DUPLICATE');
  }

  const doc = await CurriculumEntry.create({
    tenantId: tid(tenantId),
    programId: tid(body.programId),
    courseId: tid(body.courseId),
    semesterNumber: body.semesterNumber ?? null,
    yearNumber: body.yearNumber ?? null,
    isMandatory: body.isMandatory ?? true,
    creditsOverride: body.creditsOverride ?? null,
    order: body.order ?? 0,
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapCurriculum(doc.toObject());
}

export async function removeCurriculumEntry(tenantId: string, entryId: string, userId?: string) {
  const doc = await CurriculumEntry.findOne(baseFilter(tenantId, { _id: tid(entryId) }));
  if (!doc) throw new AppError(404, 'Curriculum entry not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id: String(doc._id), deleted: true };
}

// ─── Enrollments ────────────────────────────────────────────────────────────

export async function listEnrollments(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    courseId?: string;
    studentId?: string;
    offeringId?: string;
    status?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.studentId) filter.studentId = tid(q.studentId);
  if (q.offeringId) filter.offeringId = tid(q.offeringId);
  if (q.status) filter.status = q.status;

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    CourseEnrollment.find(filter).sort({ enrolledAt: -1 }).skip(skip).limit(q.limit).lean(),
    CourseEnrollment.countDocuments(filter),
  ]);

  return {
    items: items.map(mapEnrollment),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function enrollStudent(
  tenantId: string,
  body: Record<string, any>,
  userId?: string
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) })).lean();
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  // Capacity: course.maxSeats (when set)
  if (course.maxSeats != null) {
    const enrolledOnCourse = await CourseEnrollment.countDocuments(
      baseFilter(tenantId, {
        courseId: tid(body.courseId),
        status: 'enrolled',
      })
    );
    if (enrolledOnCourse >= course.maxSeats) {
      throw new AppError(403, 'Course is at capacity (maxSeats)', 'CAPACITY_EXCEEDED');
    }
  }

  // Capacity check if offering has maxStudents
  if (body.offeringId) {
    const offering = await CourseOffering.findOne(
      baseFilter(tenantId, { _id: tid(body.offeringId) })
    ).lean();
    if (!offering) throw new AppError(404, 'Offering not found', 'NOT_FOUND');
    if (offering.maxStudents != null) {
      const enrolled = await CourseEnrollment.countDocuments(
        baseFilter(tenantId, {
          offeringId: tid(body.offeringId),
          status: 'enrolled',
        })
      );
      if (enrolled >= offering.maxStudents) {
        throw new AppError(403, 'Offering is at capacity', 'CAPACITY_EXCEEDED');
      }
    }
  }

  const existing = await CourseEnrollment.findOne(
    baseFilter(tenantId, {
      studentId: tid(body.studentId),
      courseId: tid(body.courseId),
      status: 'enrolled',
    })
  );
  if (existing) {
    throw new AppError(409, 'Student already enrolled in this course', 'ALREADY_ENROLLED');
  }

  const doc = await CourseEnrollment.create({
    tenantId: tid(tenantId),
    studentId: tid(body.studentId),
    courseId: tid(body.courseId),
    offeringId: oidOrNull(body.offeringId),
    sectionId: oidOrNull(body.sectionId),
    status: body.status || 'enrolled',
    enrolledAt: new Date(),
    createdBy: userId ? tid(userId) : null,
    updatedBy: userId ? tid(userId) : null,
  });

  return mapEnrollment(doc.toObject());
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export async function courseStats(tenantId: string) {
  const tidObj = tid(tenantId);
  const [total, byStatus, byType, byProgram] = await Promise.all([
    Course.countDocuments(baseFilter(tenantId)),
    Course.aggregate([
      { $match: { tenantId: tidObj, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Course.aggregate([
      { $match: { tenantId: tidObj, isDeleted: false } },
      { $group: { _id: '$courseType', count: { $sum: 1 } } },
    ]),
    Course.aggregate([
      { $match: { tenantId: tidObj, isDeleted: false } },
      { $group: { _id: '$programId', count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((r) => {
    statusMap[r._id] = r.count;
  });
  const typeMap: Record<string, number> = {};
  byType.forEach((r) => {
    typeMap[r._id] = r.count;
  });

  return {
    total,
    byStatus: statusMap,
    byType: typeMap,
    byProgram: byProgram.map((r) => ({
      programId: String(r._id),
      count: r.count,
    })),
  };
}
