import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AssignmentStatus, SubmissionStatus } from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const AttachmentSchema = new Schema(
  {
    fileKey: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const RubricSchema = new Schema(
  {
    criterion: { type: String, required: true, trim: true, maxlength: 200 },
    maxMarks: { type: Number, required: true, min: 0 },
    description: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const RubricScoreSchema = new Schema(
  {
    criterionIndex: { type: Number, required: true, min: 0 },
    marks: { type: Number, required: true, min: 0 },
    comment: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

export interface IAssignment extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  moduleId?: Types.ObjectId | null;
  lessonId?: Types.ObjectId | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  attachments: Array<{ fileKey: string; fileName: string; mimeType?: string; size?: number }>;
  maxMarks: number;
  passingMarks?: number | null;
  availableFrom?: Date | null;
  dueAt?: Date | null;
  lateDueAt?: Date | null;
  allowLate: boolean;
  latePenaltyPercent?: number | null;
  allowResubmission: boolean;
  maxSubmissions: number;
  rubric: Array<{ criterion: string; maxMarks: number; description?: string }>;
  status: AssignmentStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: null, maxlength: 10000 },
    instructions: { type: String, default: null, maxlength: 10000 },
    attachments: { type: [AttachmentSchema], default: [] },
    maxMarks: { type: Number, required: true, min: 0, max: 10000, default: 100 },
    passingMarks: { type: Number, default: null, min: 0 },
    availableFrom: { type: Date, default: null },
    dueAt: { type: Date, default: null, index: true },
    lateDueAt: { type: Date, default: null },
    allowLate: { type: Boolean, default: false },
    latePenaltyPercent: { type: Number, default: null, min: 0, max: 100 },
    allowResubmission: { type: Boolean, default: false },
    maxSubmissions: { type: Number, default: 1, min: 1, max: 20 },
    rubric: { type: [RubricSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

AssignmentSchema.index({ tenantId: 1, courseId: 1, status: 1 });

export interface IAssignmentSubmission extends Document {
  tenantId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  attemptNumber: number;
  body?: string | null;
  attachments: Array<{ fileKey: string; fileName: string; mimeType?: string; size?: number }>;
  submittedAt?: Date | null;
  isLate: boolean;
  status: SubmissionStatus;
  marksAwarded?: number | null;
  feedback?: string | null;
  gradedBy?: Types.ObjectId | null;
  gradedAt?: Date | null;
  rubricScores: Array<{ criterionIndex: number; marks: number; comment?: string }>;
  /** Architecture-ready plagiarism field (0–100 or null) */
  plagiarismScore?: number | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    body: { type: String, default: null, maxlength: 50000 },
    attachments: { type: [AttachmentSchema], default: [] },
    submittedAt: { type: Date, default: null },
    isLate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'late', 'graded', 'returned', 'resubmitted'],
      default: 'draft',
      index: true,
    },
    marksAwarded: { type: Number, default: null, min: 0 },
    feedback: { type: String, default: null, maxlength: 10000 },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    gradedAt: { type: Date, default: null },
    rubricScores: { type: [RubricScoreSchema], default: [] },
    plagiarismScore: { type: Number, default: null, min: 0, max: 100 },
    ...auditFields,
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index(
  { tenantId: 1, assignmentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

export const Assignment =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);
