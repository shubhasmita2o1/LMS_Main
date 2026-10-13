import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
} from '../courses/course.model';
import { Student } from '../students/student.model';
import { Faculty } from '../faculty/faculty.model';
import {
  LearningProgress,
  LearningNote,
  Bookmark,
  LiveClass,
} from './learn.model';
import { saveUploadedFile } from '../../services/storage';

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

// ─── Resolve student / faculty for current user ─────────────────────────────

export async function resolveStudentId(
  tenantId: string,
  userId: string
): Promise<string> {
  const student = await Student.findOne(
    baseFilter(tenantId, { userId: tid(userId) })
  ).lean();
  if (!student) {
    throw new AppError(403, 'Student profile not found for this user', 'FORBIDDEN');
  }
  return String(student._id);
}

export async function resolveFacultyId(
  tenantId: string,
  userId: string
): Promise<string | null> {
  const faculty = await Faculty.findOne(
    baseFilter(tenantId, { userId: tid(userId) })
  ).lean();
  return faculty ? String(faculty._id) : null;
}

/** Ensure student is enrolled (status enrolled|completed) or throw */
export async function assertEnrolled(
  tenantId: string,
  studentId: string,
  courseId: string
) {
  const enrollment = await CourseEnrollment.findOne(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      courseId: tid(courseId),
      status: { $in: ['enrolled', 'completed'] },
    })
  ).lean();
  if (!enrollment) {
    throw new AppError(403, 'Not enrolled in this course', 'NOT_ENROLLED');
  }
  return enrollment;
}

/** Faculty/admin can access; students need enrollment */
export async function assertCanAccessCourse(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string
): Promise<{ studentId?: string; isStaff: boolean }> {
  const isStaff =
    user.roles.includes('super_admin') ||
    user.roles.includes('tenant_admin') ||
    user.roles.includes('university_admin') ||
    user.roles.includes('faculty') ||
    user.roles.includes('staff');

  if (isStaff) {
    const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) })).lean();
    if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
    return { isStaff: true };
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, courseId);
  return { studentId, isStaff: false };
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapProgress(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    moduleId: String(d.moduleId),
    lessonId: String(d.lessonId),
    status: d.status,
    progressPercent: d.progressPercent ?? 0,
    lastPositionSeconds: d.lastPositionSeconds ?? 0,
    completedAt: d.completedAt ?? null,
    timeSpentSeconds: d.timeSpentSeconds ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapNote(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    lessonId: String(d.lessonId),
    courseId: String(d.courseId),
    body: d.body,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapBookmark(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    lessonId: String(d.lessonId),
    courseId: String(d.courseId),
    label: d.label ?? null,
    createdAt: d.createdAt,
  };
}

function mapLiveClass(d: any) {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    sectionId: idStr(d.sectionId),
    title: d.title,
    description: d.description ?? null,
    scheduledStart: d.scheduledStart,
    scheduledEnd: d.scheduledEnd,
    status: d.status,
    meetingProvider: d.meetingProvider,
    meetingUrl: d.meetingUrl ?? null,
    meetingId: d.meetingId ?? null,
    passcode: d.passcode ?? null,
    hostFacultyId: idStr(d.hostFacultyId),
    recordingUrl: d.recordingUrl ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapLessonDetail(d: any) {
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

// ─── Progress helpers ───────────────────────────────────────────────────────

export async function computeCourseProgress(
  tenantId: string,
  studentId: string,
  courseId: string
) {
  const lessons = await CourseLesson.find(
    baseFilter(tenantId, { courseId: tid(courseId) })
  )
    .select('_id')
    .lean();
  const totalLessons = lessons.length;
  if (totalLessons === 0) {
    return {
      courseId,
      totalLessons: 0,
      completedLessons: 0,
      inProgressLessons: 0,
      progressPercent: 0,
      lastLessonId: null as string | null,
      lastAccessedAt: null as Date | null,
    };
  }

  const progressDocs = await LearningProgress.find(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      courseId: tid(courseId),
    })
  )
    .sort({ updatedAt: -1 })
    .lean();

  const completedLessons = progressDocs.filter((p) => p.status === 'completed').length;
  const inProgressLessons = progressDocs.filter((p) => p.status === 'in_progress').length;
  const last = progressDocs[0];

  return {
    courseId,
    totalLessons,
    completedLessons,
    inProgressLessons,
    progressPercent: Math.round((completedLessons / totalLessons) * 100),
    lastLessonId: last ? String(last.lessonId) : null,
    lastAccessedAt: last?.updatedAt ?? null,
  };
}

// ─── My enrolled courses ────────────────────────────────────────────────────

export async function listMyCourses(tenantId: string, userId: string) {
  const studentId = await resolveStudentId(tenantId, userId);
  const enrollments = await CourseEnrollment.find(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      status: { $in: ['enrolled', 'completed'] },
    })
  )
    .sort({ enrolledAt: -1 })
    .lean();

  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await Course.find(
    baseFilter(tenantId, { _id: { $in: courseIds } })
  ).lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  const results = [];
  for (const e of enrollments) {
    const c = courseMap.get(String(e.courseId));
    if (!c) continue;
    const progress = await computeCourseProgress(tenantId, studentId, String(e.courseId));
    results.push({
      enrollment: {
        id: String(e._id),
        tenantId: String(e.tenantId),
        studentId: String(e.studentId),
        courseId: String(e.courseId),
        offeringId: idStr(e.offeringId),
        sectionId: idStr(e.sectionId),
        status: e.status,
        enrolledAt: e.enrolledAt,
        grade: e.grade ?? null,
        createdAt: e.createdAt,
      },
      course: {
        id: String(c._id),
        tenantId: String(c.tenantId),
        programId: String(c.programId),
        departmentId: idStr(c.departmentId),
        code: c.code,
        name: c.name,
        shortName: c.shortName,
        courseType: c.courseType,
        credits: c.credits,
        status: c.status,
        isElective: Boolean(c.isElective),
        isLab: Boolean(c.isLab),
        maxSeats: c.maxSeats ?? null,
        createdAt: c.createdAt,
      },
      progress,
    });
  }
  return results;
}

// ─── Learn outline ──────────────────────────────────────────────────────────

export async function getCourseLearnOutline(
  tenantId: string,
  courseId: string,
  user: { id: string; roles: string[] }
) {
  const access = await assertCanAccessCourse(tenantId, user, courseId);
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(courseId) })).lean();
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const modules = await CourseModule.find(
    baseFilter(tenantId, { courseId: tid(courseId), status: { $ne: 'archived' } })
  )
    .sort({ order: 1 })
    .lean();

  const lessons = await CourseLesson.find(
    baseFilter(tenantId, { courseId: tid(courseId) })
  )
    .sort({ order: 1 })
    .lean();

  let progressByLesson = new Map<string, any>();
  let courseProgress = {
    courseId,
    totalLessons: lessons.length,
    completedLessons: 0,
    inProgressLessons: 0,
    progressPercent: 0,
    lastLessonId: null as string | null,
    lastAccessedAt: null as Date | null,
  };
  let enrollmentStatus: string | null = null;

  if (access.studentId) {
    const progressDocs = await LearningProgress.find(
      baseFilter(tenantId, {
        studentId: tid(access.studentId),
        courseId: tid(courseId),
      })
    ).lean();
    progressByLesson = new Map(progressDocs.map((p) => [String(p.lessonId), p]));
    courseProgress = await computeCourseProgress(tenantId, access.studentId, courseId);
    const enr = await CourseEnrollment.findOne(
      baseFilter(tenantId, {
        studentId: tid(access.studentId),
        courseId: tid(courseId),
      })
    ).lean();
    enrollmentStatus = enr?.status ?? null;
  }

  const lessonsByModule = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const mid = String(l.moduleId);
    if (!lessonsByModule.has(mid)) lessonsByModule.set(mid, []);
    lessonsByModule.get(mid)!.push(l);
  }

  const outlineModules = modules.map((m) => {
    const modLessons = lessonsByModule.get(String(m._id)) || [];
    const mapped = modLessons.map((l) => {
      const p = progressByLesson.get(String(l._id));
      return {
        id: String(l._id),
        moduleId: String(l.moduleId),
        title: l.title,
        order: l.order,
        contentType: l.contentType,
        durationMinutes: l.durationMinutes ?? null,
        isFreePreview: Boolean(l.isFreePreview),
        progress: p
          ? {
              status: p.status,
              progressPercent: p.progressPercent ?? 0,
              lastPositionSeconds: p.lastPositionSeconds ?? 0,
            }
          : null,
      };
    });
    const completed = mapped.filter((x) => x.progress?.status === 'completed').length;
    return {
      id: String(m._id),
      title: m.title,
      order: m.order,
      description: m.description,
      status: m.status,
      lessons: mapped,
      progressPercent:
        mapped.length === 0 ? 0 : Math.round((completed / mapped.length) * 100),
    };
  });

  return {
    course: {
      id: String(course._id),
      tenantId: String(course.tenantId),
      programId: String(course.programId),
      departmentId: idStr(course.departmentId),
      code: course.code,
      name: course.name,
      shortName: course.shortName,
      courseType: course.courseType,
      credits: course.credits,
      status: course.status,
      isElective: Boolean(course.isElective),
      isLab: Boolean(course.isLab),
      maxSeats: course.maxSeats ?? null,
      description: course.description,
      createdAt: course.createdAt,
    },
    modules: outlineModules,
    progress: courseProgress,
    enrollmentStatus,
  };
}

// ─── Lesson detail ──────────────────────────────────────────────────────────

export async function getLessonDetail(
  tenantId: string,
  lessonId: string,
  user: { id: string; roles: string[] }
) {
  const lesson = await CourseLesson.findOne(
    baseFilter(tenantId, { _id: tid(lessonId) })
  ).lean();
  if (!lesson) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');

  const access = await assertCanAccessCourse(tenantId, user, String(lesson.courseId));

  let progress = null;
  if (access.studentId) {
    const p = await LearningProgress.findOne(
      baseFilter(tenantId, {
        studentId: tid(access.studentId),
        lessonId: tid(lessonId),
      })
    ).lean();
    if (p) progress = mapProgress(p);
  }

  return {
    lesson: mapLessonDetail(lesson),
    progress,
  };
}

// ─── Update progress ────────────────────────────────────────────────────────

export async function updateLessonProgress(
  tenantId: string,
  lessonId: string,
  userId: string,
  body: {
    progressPercent?: number;
    lastPositionSeconds?: number;
    status?: 'not_started' | 'in_progress' | 'completed';
    timeSpentSecondsDelta?: number;
    markComplete?: boolean;
  }
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const lesson = await CourseLesson.findOne(
    baseFilter(tenantId, { _id: tid(lessonId) })
  ).lean();
  if (!lesson) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');

  await assertEnrolled(tenantId, studentId, String(lesson.courseId));

  let doc = await LearningProgress.findOne(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      lessonId: tid(lessonId),
    })
  );

  if (!doc) {
    doc = new LearningProgress({
      tenantId: tid(tenantId),
      studentId: tid(studentId),
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      lessonId: tid(lessonId),
      status: 'in_progress',
      progressPercent: 0,
      lastPositionSeconds: 0,
      timeSpentSeconds: 0,
      createdBy: tid(userId),
    });
  }

  if (body.lastPositionSeconds !== undefined) {
    doc.lastPositionSeconds = Math.max(0, body.lastPositionSeconds);
  }
  if (body.timeSpentSecondsDelta !== undefined && body.timeSpentSecondsDelta > 0) {
    doc.timeSpentSeconds = (doc.timeSpentSeconds || 0) + body.timeSpentSecondsDelta;
  }
  if (body.progressPercent !== undefined) {
    doc.progressPercent = Math.min(100, Math.max(0, body.progressPercent));
  }

  if (body.markComplete || body.status === 'completed' || (doc.progressPercent ?? 0) >= 100) {
    doc.status = 'completed';
    doc.progressPercent = 100;
    doc.completedAt = doc.completedAt || new Date();
  } else if (body.status) {
    doc.status = body.status;
  } else if (doc.status === 'not_started') {
    doc.status = 'in_progress';
  }

  doc.updatedBy = tid(userId);
  await doc.save();
  return mapProgress(doc.toObject());
}

export async function getMyCourseProgress(
  tenantId: string,
  courseId: string,
  userId: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  await assertEnrolled(tenantId, studentId, courseId);
  return computeCourseProgress(tenantId, studentId, courseId);
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function createNote(
  tenantId: string,
  lessonId: string,
  userId: string,
  body: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const lesson = await CourseLesson.findOne(
    baseFilter(tenantId, { _id: tid(lessonId) })
  ).lean();
  if (!lesson) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');
  await assertEnrolled(tenantId, studentId, String(lesson.courseId));

  const doc = await LearningNote.create({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    lessonId: tid(lessonId),
    courseId: lesson.courseId,
    body: body.trim(),
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  return mapNote(doc.toObject());
}

export async function listNotesForLesson(
  tenantId: string,
  lessonId: string,
  userId: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const notes = await LearningNote.find(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      lessonId: tid(lessonId),
    })
  )
    .sort({ createdAt: -1 })
    .lean();
  return notes.map(mapNote);
}

export async function updateNote(
  tenantId: string,
  noteId: string,
  userId: string,
  body: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const doc = await LearningNote.findOne(
    baseFilter(tenantId, {
      _id: tid(noteId),
      studentId: tid(studentId),
    })
  );
  if (!doc) throw new AppError(404, 'Note not found', 'NOT_FOUND');
  doc.body = body.trim();
  doc.updatedBy = tid(userId);
  await doc.save();
  return mapNote(doc.toObject());
}

export async function deleteNote(tenantId: string, noteId: string, userId: string) {
  const studentId = await resolveStudentId(tenantId, userId);
  const doc = await LearningNote.findOne(
    baseFilter(tenantId, {
      _id: tid(noteId),
      studentId: tid(studentId),
    })
  );
  if (!doc) throw new AppError(404, 'Note not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(userId);
  await doc.save();
  return { id: String(doc._id), deleted: true };
}

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export async function addBookmark(
  tenantId: string,
  lessonId: string,
  userId: string,
  label?: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const lesson = await CourseLesson.findOne(
    baseFilter(tenantId, { _id: tid(lessonId) })
  ).lean();
  if (!lesson) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');
  await assertEnrolled(tenantId, studentId, String(lesson.courseId));

  const existing = await Bookmark.findOne(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      lessonId: tid(lessonId),
    })
  );
  if (existing) return mapBookmark(existing.toObject());

  const doc = await Bookmark.create({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    lessonId: tid(lessonId),
    courseId: lesson.courseId,
    label: label || null,
    createdBy: tid(userId),
  });
  return mapBookmark(doc.toObject());
}

export async function listBookmarksForCourse(
  tenantId: string,
  courseId: string,
  userId: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const docs = await Bookmark.find(
    baseFilter(tenantId, {
      studentId: tid(studentId),
      courseId: tid(courseId),
    })
  )
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(mapBookmark);
}

export async function removeBookmark(
  tenantId: string,
  bookmarkId: string,
  userId: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const doc = await Bookmark.findOne(
    baseFilter(tenantId, {
      _id: tid(bookmarkId),
      studentId: tid(studentId),
    })
  );
  if (!doc) throw new AppError(404, 'Bookmark not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();
  return { id: String(doc._id), deleted: true };
}

// ─── Live classes ───────────────────────────────────────────────────────────

export async function createLiveClass(
  tenantId: string,
  body: Record<string, any>,
  userId: string
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const hostFacultyId =
    body.hostFacultyId || (await resolveFacultyId(tenantId, userId));

  const doc = await LiveClass.create({
    tenantId: tid(tenantId),
    courseId: tid(body.courseId),
    offeringId: body.offeringId ? tid(body.offeringId) : null,
    sectionId: body.sectionId ? tid(body.sectionId) : null,
    title: body.title.trim(),
    description: body.description ?? null,
    scheduledStart: new Date(body.scheduledStart),
    scheduledEnd: new Date(body.scheduledEnd),
    status: 'scheduled',
    meetingProvider: body.meetingProvider || 'custom',
    meetingUrl: body.meetingUrl ?? null,
    meetingId: body.meetingId ?? null,
    passcode: body.passcode ?? null,
    hostFacultyId: hostFacultyId ? tid(hostFacultyId) : null,
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  return mapLiveClass(doc.toObject());
}

export async function listLiveClasses(
  tenantId: string,
  filters: { courseId?: string; status?: string },
  user: { id: string; roles: string[] }
) {
  const q: Record<string, unknown> = { ...baseFilter(tenantId) };
  if (filters.courseId) {
    await assertCanAccessCourse(tenantId, user, filters.courseId);
    q.courseId = tid(filters.courseId);
  }
  if (filters.status) q.status = filters.status;

  const docs = await LiveClass.find(q).sort({ scheduledStart: -1 }).limit(100).lean();
  return docs.map(mapLiveClass);
}

export async function getLiveClass(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await LiveClass.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Live class not found', 'NOT_FOUND');
  await assertCanAccessCourse(tenantId, user, String(doc.courseId));
  return mapLiveClass(doc);
}

export async function updateLiveClass(
  tenantId: string,
  id: string,
  body: Record<string, any>,
  userId: string
) {
  const doc = await LiveClass.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Live class not found', 'NOT_FOUND');

  if (body.title !== undefined) doc.title = body.title.trim();
  if (body.description !== undefined) doc.description = body.description;
  if (body.scheduledStart !== undefined) doc.scheduledStart = new Date(body.scheduledStart);
  if (body.scheduledEnd !== undefined) doc.scheduledEnd = new Date(body.scheduledEnd);
  if (body.meetingProvider !== undefined) doc.meetingProvider = body.meetingProvider;
  if (body.meetingUrl !== undefined) doc.meetingUrl = body.meetingUrl;
  if (body.meetingId !== undefined) doc.meetingId = body.meetingId;
  if (body.passcode !== undefined) doc.passcode = body.passcode;
  if (body.recordingUrl !== undefined) doc.recordingUrl = body.recordingUrl;
  if (body.status !== undefined) doc.status = body.status;
  if (body.hostFacultyId !== undefined) {
    doc.hostFacultyId = body.hostFacultyId ? tid(body.hostFacultyId) : null;
  }
  doc.updatedBy = tid(userId);
  await doc.save();
  return mapLiveClass(doc.toObject());
}

export async function startLiveClass(tenantId: string, id: string, userId: string) {
  const doc = await LiveClass.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Live class not found', 'NOT_FOUND');
  if (doc.status === 'cancelled') {
    throw new AppError(400, 'Cannot start a cancelled class', 'INVALID_STATUS');
  }
  doc.status = 'live';
  doc.updatedBy = tid(userId);
  await doc.save();
  return mapLiveClass(doc.toObject());
}

export async function completeLiveClass(
  tenantId: string,
  id: string,
  userId: string,
  recordingUrl?: string
) {
  const doc = await LiveClass.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Live class not found', 'NOT_FOUND');
  doc.status = 'completed';
  if (recordingUrl) doc.recordingUrl = recordingUrl;
  doc.updatedBy = tid(userId);
  await doc.save();
  return mapLiveClass(doc.toObject());
}

// ─── Content upload ─────────────────────────────────────────────────────────

export async function uploadContent(
  tenantId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  userId: string
) {
  const stored = await saveUploadedFile({
    tenantId,
    buffer: file.buffer,
    fileName: file.originalname,
    mimeType: file.mimetype,
    folder: 'lessons',
  });
  return {
    fileKey: stored.key,
    contentUrl: stored.url,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    fileSize: stored.fileSize,
    uploadedBy: userId,
  };
}

export async function attachLessonContent(
  tenantId: string,
  lessonId: string,
  body: Record<string, any>,
  userId: string
) {
  const doc = await CourseLesson.findOne(baseFilter(tenantId, { _id: tid(lessonId) }));
  if (!doc) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');

  if (body.contentType !== undefined) doc.contentType = body.contentType;
  if (body.fileKey !== undefined) doc.fileKey = body.fileKey;
  if (body.contentUrl !== undefined) doc.contentUrl = body.contentUrl;
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
  doc.updatedBy = tid(userId);
  await doc.save();
  return mapLessonDetail(doc.toObject());
}
