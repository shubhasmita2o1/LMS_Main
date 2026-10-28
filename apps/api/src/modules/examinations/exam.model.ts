import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  ExamStatus,
  ExamMode,
  ExamAttemptStatus,
  AllocationStatus,
  SuspicionEventType,
  ExamShowResultAfter,
  QuestionType,
  Difficulty,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

// ─── ExamCenter ──────────────────────────────────────────────────────────────

export interface IExamCenter extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code: string;
  building?: string | null;
  room?: string | null;
  capacity: number;
  address?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamCenterSchema = new Schema<IExamCenter>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    building: { type: String, default: null, maxlength: 120 },
    room: { type: String, default: null, maxlength: 80 },
    capacity: { type: Number, default: 30, min: 1, max: 5000 },
    address: { type: String, default: null, maxlength: 500 },
    ...auditFields,
  },
  { timestamps: true }
);

ExamCenterSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const ExamCenter = mongoose.model<IExamCenter>('ExamCenter', ExamCenterSchema);

// ─── Exam question snapshot ──────────────────────────────────────────────────

const ExamQuestionSnapshotSchema = new Schema(
  {
    questionBankId: { type: Schema.Types.ObjectId, ref: 'Question', default: null },
    questionId: { type: String, required: true },
    type: { type: String, required: true },
    stem: { type: String, required: true },
    richText: { type: String, default: null },
    options: [
      {
        key: String,
        text: String,
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctAnswer: { type: String, default: null },
    matchingPairs: [{ left: String, right: String }],
    marks: { type: Number, required: true, min: 0 },
    order: { type: Number, default: 0 },
    difficulty: { type: String, default: null },
    explanation: { type: String, default: null },
  },
  { _id: false }
);

const ExamSettingsSchema = new Schema(
  {
    maxAttempts: { type: Number, default: 1, min: 1, max: 10 },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    negativeMarkingEnabled: { type: Boolean, default: false },
    negativeMarkPerQuestion: { type: Number, default: null, min: 0 },
    allowNavigation: { type: Boolean, default: true },
    allowFlagging: { type: Boolean, default: true },
    autosaveIntervalSec: { type: Number, default: 30, min: 5, max: 300 },
    autoSubmitOnTimeout: { type: Boolean, default: true },
    showResultAfter: {
      type: String,
      enum: ['submit', 'close', 'manual', 'never'],
      default: 'close',
    },
  },
  { _id: false }
);

export interface IExamQuestionSnapshot {
  questionBankId?: Types.ObjectId | null;
  questionId: string;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options?: Array<{ key: string; text: string; isCorrect?: boolean }>;
  correctAnswer?: string | null;
  matchingPairs?: Array<{ left: string; right: string }>;
  marks: number;
  order: number;
  difficulty?: Difficulty | null;
  explanation?: string | null;
}

export interface IExamSettings {
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarkPerQuestion?: number | null;
  allowNavigation: boolean;
  allowFlagging: boolean;
  autosaveIntervalSec: number;
  autoSubmitOnTimeout: boolean;
  showResultAfter: ExamShowResultAfter;
}

export interface IExam extends Document {
  tenantId: Types.ObjectId;
  courseId?: Types.ObjectId | null;
  programId?: Types.ObjectId | null;
  departmentId?: Types.ObjectId | null;
  title: string;
  code: string;
  description?: string | null;
  mode: ExamMode;
  status: ExamStatus;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  settings: IExamSettings;
  questions: IExamQuestionSnapshot[];
  totalMarks: number;
  centerIds: Types.ObjectId[];
  publishedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    description: { type: String, default: null, maxlength: 10000 },
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'online',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'closed', 'graded', 'cancelled'],
      default: 'draft',
      index: true,
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    settings: { type: ExamSettingsSchema, default: () => ({}) },
    questions: { type: [ExamQuestionSnapshotSchema], default: [] },
    totalMarks: { type: Number, default: 0, min: 0 },
    centerIds: [{ type: Schema.Types.ObjectId, ref: 'ExamCenter' }],
    publishedAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

ExamSchema.index({ tenantId: 1, code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
ExamSchema.index({ tenantId: 1, status: 1, startAt: 1 });
ExamSchema.index({ tenantId: 1, courseId: 1, status: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);

// ─── Allocation ──────────────────────────────────────────────────────────────

export interface IExamAllocation extends Document {
  tenantId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  centerId?: Types.ObjectId | null;
  seatNumber?: string | null;
  invigilatorId?: Types.ObjectId | null;
  status: AllocationStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamAllocationSchema = new Schema<IExamAllocation>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    centerId: { type: Schema.Types.ObjectId, ref: 'ExamCenter', default: null },
    seatNumber: { type: String, default: null, maxlength: 40 },
    invigilatorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['allocated', 'present', 'absent', 'malpractice'],
      default: 'allocated',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

ExamAllocationSchema.index(
  { tenantId: 1, examId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
ExamAllocationSchema.index({ tenantId: 1, studentId: 1, examId: 1 });

export const ExamAllocation = mongoose.model<IExamAllocation>('ExamAllocation', ExamAllocationSchema);

// ─── Invigilator ─────────────────────────────────────────────────────────────

export interface IExamInvigilator extends Document {
  tenantId: Types.ObjectId;
  examId: Types.ObjectId;
  userId: Types.ObjectId;
  centerId?: Types.ObjectId | null;
  roleNote?: 'chief' | 'assistant' | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamInvigilatorSchema = new Schema<IExamInvigilator>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    centerId: { type: Schema.Types.ObjectId, ref: 'ExamCenter', default: null },
    roleNote: { type: String, enum: ['chief', 'assistant', null], default: null },
    ...auditFields,
  },
  { timestamps: true }
);

ExamInvigilatorSchema.index(
  { tenantId: 1, examId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const ExamInvigilator = mongoose.model<IExamInvigilator>('ExamInvigilator', ExamInvigilatorSchema);

// ─── Attempt ─────────────────────────────────────────────────────────────────

const ExamAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    response: { type: Schema.Types.Mixed, default: null },
    flagged: { type: Boolean, default: false },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

export interface IExamAttempt extends Document {
  tenantId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  allocationId?: Types.ObjectId | null;
  status: ExamAttemptStatus;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date | null;
  endsAt: Date;
  answers: Array<{
    questionId: string;
    response?: string | string[] | null;
    flagged?: boolean;
    answeredAt?: Date | null;
  }>;
  /** Per-attempt shuffle: ordered questionIds */
  questionOrder: string[];
  /** questionId -> ordered option keys */
  optionOrder: Record<string, string[]>;
  marksObtained?: number | null;
  autoScore?: number | null;
  manualScore?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  lastAutosaveAt?: Date | null;
  suspicionScore: number;
  idVerificationStatus?: string | null;
  proctorSessionId?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    allocationId: { type: Schema.Types.ObjectId, ref: 'ExamAllocation', default: null },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'auto_submitted', 'void'],
      default: 'in_progress',
      index: true,
    },
    attemptNumber: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    endsAt: { type: Date, required: true, index: true },
    answers: { type: [ExamAnswerSchema], default: [] },
    questionOrder: { type: [String], default: [] },
    optionOrder: { type: Schema.Types.Mixed, default: {} },
    marksObtained: { type: Number, default: null },
    autoScore: { type: Number, default: null },
    manualScore: { type: Number, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    lastAutosaveAt: { type: Date, default: null },
    suspicionScore: { type: Number, default: 0, min: 0 },
    idVerificationStatus: { type: String, default: null },
    proctorSessionId: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

ExamAttemptSchema.index(
  { tenantId: 1, examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);
ExamAttemptSchema.index({ tenantId: 1, examId: 1, status: 1 });
ExamAttemptSchema.index({ tenantId: 1, studentId: 1, examId: 1 });
ExamAttemptSchema.index({ tenantId: 1, endsAt: 1, status: 1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);

// ─── Suspicion events ────────────────────────────────────────────────────────

export interface IExamSuspicionEvent extends Document {
  tenantId: Types.ObjectId;
  examId: Types.ObjectId;
  attemptId: Types.ObjectId;
  studentId: Types.ObjectId;
  type: SuspicionEventType;
  detail?: string | null;
  clientTimestamp?: Date | null;
  serverTimestamp: Date;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSuspicionEventSchema = new Schema<IExamSuspicionEvent>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'ExamAttempt', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: {
      type: String,
      enum: ['tab_blur', 'fullscreen_exit', 'copy_paste', 'multiple_login', 'heartbeat_miss', 'other'],
      required: true,
    },
    detail: { type: String, default: null, maxlength: 2000 },
    clientTimestamp: { type: Date, default: null },
    serverTimestamp: { type: Date, default: () => new Date() },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

ExamSuspicionEventSchema.index({ tenantId: 1, attemptId: 1, serverTimestamp: -1 });
ExamSuspicionEventSchema.index({ tenantId: 1, examId: 1, type: 1 });

export const ExamSuspicionEvent = mongoose.model<IExamSuspicionEvent>(
  'ExamSuspicionEvent',
  ExamSuspicionEventSchema
);
