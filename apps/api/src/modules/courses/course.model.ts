import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  CourseType,
  CourseStatus,
  PrerequisiteType,
  LessonContentType,
  CourseEnrollmentStatus,
  OfferingStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const CreditsSchema = new Schema(
  {
    theory: { type: Number, default: 0, min: 0 },
    practical: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PrerequisiteSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    type: { type: String, enum: ['required', 'recommended'], default: 'required' },
  },
  { _id: false }
);

const LearningOutcomeSchema = new Schema(
  {
    code: { type: String, trim: true, maxlength: 20 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Course (catalog) ───────────────────────────────────────────────────────

export interface ICourse extends Document {
  tenantId: Types.ObjectId;
  programId: Types.ObjectId;
  departmentId?: Types.ObjectId | null;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  courseType: CourseType;
  credits: { theory: number; practical: number; total: number };
  lectureHours?: number;
  labHours?: number;
  tutorialHours?: number;
  prerequisites: Array<{ courseId: Types.ObjectId; type: PrerequisiteType }>;
  corequisites: Types.ObjectId[];
  learningOutcomes: Array<{ code?: string; description: string; order?: number }>;
  syllabusOutline?: string;
  status: CourseStatus;
  isElective: boolean;
  isLab: boolean;
  maxSeats?: number | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    shortName: { type: String, trim: true, maxlength: 50 },
    description: { type: String, maxlength: 5000 },
    courseType: {
      type: String,
      enum: ['core', 'elective', 'lab', 'project', 'seminar', 'audit', 'other'],
      default: 'core',
      index: true,
    },
    credits: { type: CreditsSchema, default: () => ({ theory: 0, practical: 0, total: 0 }) },
    lectureHours: { type: Number, min: 0 },
    labHours: { type: Number, min: 0 },
    tutorialHours: { type: Number, min: 0 },
    prerequisites: { type: [PrerequisiteSchema], default: [] },
    corequisites: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    learningOutcomes: { type: [LearningOutcomeSchema], default: [] },
    syllabusOutline: { type: String, maxlength: 10000 },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived', 'inactive'],
      default: 'draft',
      index: true,
    },
    isElective: { type: Boolean, default: false },
    isLab: { type: Boolean, default: false },
    maxSeats: { type: Number, min: 0, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

CourseSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
CourseSchema.index({ tenantId: 1, programId: 1, status: 1 });
CourseSchema.index({ tenantId: 1, departmentId: 1 });
CourseSchema.index({
  tenantId: 1,
  code: 'text',
  name: 'text',
  shortName: 'text',
});

export const Course = mongoose.model<ICourse>('Course', CourseSchema);

// ─── Course Module ──────────────────────────────────────────────────────────

export interface ICourseModule extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseModuleSchema = new Schema<ICourseModule>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, default: 0 },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    ...auditFields,
  },
  { timestamps: true }
);

CourseModuleSchema.index({ tenantId: 1, courseId: 1, order: 1 });

export const CourseModule = mongoose.model<ICourseModule>('CourseModule', CourseModuleSchema);

// ─── Course Lesson ──────────────────────────────────────────────────────────

export interface ICourseLesson extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  chapterId?: Types.ObjectId | null;
  title: string;
  order: number;
  contentType: LessonContentType;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  contentSummary?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseLessonSchema = new Schema<ICourseLesson>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, default: 0 },
    contentType: {
      type: String,
      enum: ['text', 'video', 'pdf', 'link', 'other'],
      default: 'text',
    },
    durationMinutes: { type: Number, min: 0, default: null },
    isFreePreview: { type: Boolean, default: false },
    contentSummary: { type: String, maxlength: 2000 },
    ...auditFields,
  },
  { timestamps: true }
);

CourseLessonSchema.index({ tenantId: 1, moduleId: 1, order: 1 });
CourseLessonSchema.index({ tenantId: 1, courseId: 1 });

export const CourseLesson = mongoose.model<ICourseLesson>('CourseLesson', CourseLessonSchema);

// ─── Course Offering (running instance) ─────────────────────────────────────

export interface ICourseOffering extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  sectionId?: Types.ObjectId | null;
  batchId?: Types.ObjectId | null;
  academicYearId?: Types.ObjectId | null;
  semesterId?: Types.ObjectId | null;
  facultyIds: Types.ObjectId[];
  maxStudents?: number | null;
  status: OfferingStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseOfferingSchema = new Schema<ICourseOffering>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    facultyIds: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }],
    maxStudents: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

CourseOfferingSchema.index({ tenantId: 1, courseId: 1, academicYearId: 1, semesterId: 1 });
CourseOfferingSchema.index({ tenantId: 1, sectionId: 1 });

export const CourseOffering = mongoose.model<ICourseOffering>('CourseOffering', CourseOfferingSchema);

// ─── Curriculum mapping (Program → Course) ──────────────────────────────────

export interface ICurriculumEntry extends Document {
  tenantId: Types.ObjectId;
  programId: Types.ObjectId;
  courseId: Types.ObjectId;
  semesterNumber?: number | null;
  yearNumber?: number | null;
  isMandatory: boolean;
  creditsOverride?: number | null;
  order?: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CurriculumEntrySchema = new Schema<ICurriculumEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    semesterNumber: { type: Number, min: 1, max: 20, default: null },
    yearNumber: { type: Number, min: 1, max: 10, default: null },
    isMandatory: { type: Boolean, default: true },
    creditsOverride: { type: Number, min: 0, default: null },
    order: { type: Number, default: 0 },
    ...auditFields,
  },
  { timestamps: true }
);

CurriculumEntrySchema.index(
  { tenantId: 1, programId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
CurriculumEntrySchema.index({ tenantId: 1, programId: 1, semesterNumber: 1 });

export const CurriculumEntry = mongoose.model<ICurriculumEntry>(
  'CurriculumEntry',
  CurriculumEntrySchema
);

// ─── Student Course Enrollment ──────────────────────────────────────────────

export interface ICourseEnrollment extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  sectionId?: Types.ObjectId | null;
  status: CourseEnrollmentStatus;
  enrolledAt: Date;
  grade?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
    status: {
      type: String,
      enum: ['enrolled', 'dropped', 'completed', 'failed', 'withdrawn'],
      default: 'enrolled',
      index: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    grade: { type: String, default: null, maxlength: 10 },
    ...auditFields,
  },
  { timestamps: true }
);

CourseEnrollmentSchema.index({ tenantId: 1, studentId: 1, courseId: 1 });
CourseEnrollmentSchema.index({ tenantId: 1, offeringId: 1 });
CourseEnrollmentSchema.index({ tenantId: 1, courseId: 1, status: 1 });

export const CourseEnrollment = mongoose.model<ICourseEnrollment>(
  'CourseEnrollment',
  CourseEnrollmentSchema
);
