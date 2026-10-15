import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  GradebookStatus,
  GradeComponentType,
  GradeComponentSource,
  ResultStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const GradeComponentSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 64 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: [
        'assignment',
        'quiz',
        'midterm',
        'final',
        'attendance',
        'project',
        'other',
        'manual',
      ],
    },
    weightPercent: { type: Number, required: true, min: 0, max: 100 },
    maxMarks: { type: Number, required: true, min: 0, max: 10000, default: 100 },
    source: {
      type: String,
      required: true,
      enum: ['assignment', 'quiz', 'attendance', 'manual'],
      default: 'manual',
    },
    sourceIds: [{ type: Schema.Types.ObjectId }],
    dropLowest: { type: Number, default: 0, min: 0, max: 50 },
  },
  { _id: false }
);

export interface IGradeComponent {
  key: string;
  name: string;
  type: GradeComponentType;
  weightPercent: number;
  maxMarks: number;
  source: GradeComponentSource;
  sourceIds?: Types.ObjectId[];
  dropLowest?: number;
}

export interface IGradebook extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  academicYearId?: Types.ObjectId | null;
  semesterId?: Types.ObjectId | null;
  title: string;
  status: GradebookStatus;
  components: IGradeComponent[];
  lockedAt?: Date | null;
  lockedBy?: Types.ObjectId | null;
  publishedAt?: Date | null;
  publishedBy?: Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const GradebookSchema = new Schema<IGradebook>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ['open', 'locked', 'published'],
      default: 'open',
      index: true,
    },
    components: { type: [GradeComponentSchema], default: [] },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ...auditFields,
  },
  { timestamps: true }
);

GradebookSchema.index({ tenantId: 1, courseId: 1, isDeleted: 1 });
GradebookSchema.index({ tenantId: 1, status: 1 });
GradebookSchema.index({ tenantId: 1, offeringId: 1 });

export const Gradebook =
  mongoose.models.Gradebook || mongoose.model<IGradebook>('Gradebook', GradebookSchema);

// ─── Grade Entry ─────────────────────────────────────────────────────────────

export interface IGradeEntry extends Document {
  tenantId: Types.ObjectId;
  gradebookId: Types.ObjectId;
  studentId: Types.ObjectId;
  componentKey: string;
  rawMarks: number;
  maxMarks: number;
  percent: number;
  overriddenMarks?: number | null;
  overrideReason?: string | null;
  overriddenBy?: Types.ObjectId | null;
  sourceRef?: { type: string; id: Types.ObjectId } | null;
  isExcluded: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const GradeEntrySchema = new Schema<IGradeEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    gradebookId: { type: Schema.Types.ObjectId, ref: 'Gradebook', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    componentKey: { type: String, required: true, trim: true, maxlength: 64 },
    rawMarks: { type: Number, required: true, min: 0, default: 0 },
    maxMarks: { type: Number, required: true, min: 0, default: 100 },
    percent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    overriddenMarks: { type: Number, default: null, min: 0 },
    overrideReason: { type: String, default: null, maxlength: 1000 },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sourceRef: {
      type: new Schema(
        {
          type: { type: String, maxlength: 50 },
          id: { type: Schema.Types.ObjectId },
        },
        { _id: false }
      ),
      default: null,
    },
    isExcluded: { type: Boolean, default: false },
    ...auditFields,
  },
  { timestamps: true }
);

GradeEntrySchema.index(
  { tenantId: 1, gradebookId: 1, studentId: 1, componentKey: 1 },
  { unique: true }
);
GradeEntrySchema.index({ tenantId: 1, studentId: 1 });

export const GradeEntry =
  mongoose.models.GradeEntry || mongoose.model<IGradeEntry>('GradeEntry', GradeEntrySchema);

// ─── Gradebook Total (cached) ────────────────────────────────────────────────

export interface IGradebookTotal extends Document {
  tenantId: Types.ObjectId;
  gradebookId: Types.ObjectId;
  studentId: Types.ObjectId;
  weightedPercent: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  rank?: number | null;
  isPass?: boolean | null;
  recomputedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GradebookTotalSchema = new Schema<IGradebookTotal>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    gradebookId: { type: Schema.Types.ObjectId, ref: 'Gradebook', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    weightedPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    letterGrade: { type: String, default: null, maxlength: 10 },
    gradePoint: { type: Number, default: null, min: 0 },
    rank: { type: Number, default: null, min: 1 },
    isPass: { type: Boolean, default: null },
    recomputedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

GradebookTotalSchema.index({ tenantId: 1, gradebookId: 1, studentId: 1 }, { unique: true });

export const GradebookTotal =
  mongoose.models.GradebookTotal ||
  mongoose.model<IGradebookTotal>('GradebookTotal', GradebookTotalSchema);

// ─── Result (publication snapshot) ───────────────────────────────────────────

export interface IResult extends Document {
  tenantId: Types.ObjectId;
  gradebookId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: ResultStatus;
  publishedAt?: Date | null;
  publishedBy?: Types.ObjectId | null;
  weightedPercent: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPass?: boolean | null;
  components: Array<{
    key: string;
    name: string;
    weightPercent: number;
    rawMarks: number;
    maxMarks: number;
    percent: number;
    contribution: number;
  }>;
  remarks?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResultComponentSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    weightPercent: { type: Number, required: true },
    rawMarks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    percent: { type: Number, required: true },
    contribution: { type: Number, required: true },
  },
  { _id: false }
);

const ResultSchema = new Schema<IResult>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    gradebookId: { type: Schema.Types.ObjectId, ref: 'Gradebook', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'moderation', 'published', 'held'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    weightedPercent: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, default: null, maxlength: 10 },
    gradePoint: { type: Number, default: null },
    isPass: { type: Boolean, default: null },
    components: { type: [ResultComponentSchema], default: [] },
    remarks: { type: String, default: null, maxlength: 2000 },
    ...auditFields,
  },
  { timestamps: true }
);

ResultSchema.index({ tenantId: 1, gradebookId: 1, studentId: 1 }, { unique: true });
ResultSchema.index({ tenantId: 1, studentId: 1, status: 1 });

export const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
