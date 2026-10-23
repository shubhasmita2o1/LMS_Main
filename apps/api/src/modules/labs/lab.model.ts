import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  PracticalStatus,
  LabStatus,
  ExperimentStatus,
  LabLanguage,
  TestCaseVisibility,
  EvaluationMode,
  SubmissionKind,
  LabSubmissionStatus,
  ExecutionStatus,
  EvaluationStatus,
} from '@university-lms/shared';

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

const TestCaseSchema = new Schema(
  {
    id: { type: String, required: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    visibility: { type: String, enum: ['public', 'hidden'], default: 'public' },
    weight: { type: Number, default: 1, min: 0 },
    name: { type: String, maxlength: 200 },
  },
  { _id: false }
);

// ─── Practical ──────────────────────────────────────────────────────────────

export interface IPractical extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  title: string;
  description?: string | null;
  status: PracticalStatus;
  facultyOwnerIds: Types.ObjectId[];
  availableFrom?: Date | null;
  availableTo?: Date | null;
  maxScore: number;
  weightPercent?: number | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PracticalSchema = new Schema<IPractical>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: null, maxlength: 10000 },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },
    facultyOwnerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    availableFrom: { type: Date, default: null },
    availableTo: { type: Date, default: null },
    maxScore: { type: Number, default: 100, min: 0, max: 10000 },
    weightPercent: { type: Number, default: null, min: 0, max: 100 },
    ...auditFields,
  },
  { timestamps: true }
);

PracticalSchema.index({ tenantId: 1, courseId: 1, status: 1 });
PracticalSchema.index({ tenantId: 1, isDeleted: 1 });

// ─── Lab ────────────────────────────────────────────────────────────────────

export interface ILab extends Document {
  tenantId: Types.ObjectId;
  practicalId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
  instructions?: string | null;
  defaultLanguage: LabLanguage;
  timeoutSec: number;
  memoryMb: number;
  status: LabStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LabSchema = new Schema<ILab>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    practicalId: { type: Schema.Types.ObjectId, ref: 'Practical', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    order: { type: Number, default: 0 },
    instructions: { type: String, default: null, maxlength: 20000 },
    defaultLanguage: {
      type: String,
      enum: ['python', 'javascript', 'java', 'c', 'cpp', 'sql'],
      default: 'python',
    },
    timeoutSec: { type: Number, default: 10, min: 1, max: 60 },
    memoryMb: { type: Number, default: 128, min: 32, max: 512 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

LabSchema.index({ tenantId: 1, practicalId: 1, order: 1 });

// ─── Experiment ─────────────────────────────────────────────────────────────

export interface IExperiment extends Document {
  tenantId: Types.ObjectId;
  labId: Types.ObjectId;
  practicalId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  statement: string;
  allowedLanguages: LabLanguage[];
  starterCode: Map<string, string> | Record<string, string>;
  timeLimitSec: number;
  memoryLimitMb: number;
  maxScore: number;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    visibility: TestCaseVisibility;
    weight: number;
    name?: string;
  }>;
  evaluationMode: EvaluationMode;
  attachments: Array<{ fileKey: string; fileName: string; mimeType?: string; size?: number }>;
  status: ExperimentStatus;
  order: number;
  maxAttempts: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExperimentSchema = new Schema<IExperiment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true, index: true },
    practicalId: { type: Schema.Types.ObjectId, ref: 'Practical', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    statement: { type: String, required: true, maxlength: 50000 },
    allowedLanguages: {
      type: [String],
      enum: ['python', 'javascript', 'java', 'c', 'cpp', 'sql'],
      default: ['python'],
    },
    starterCode: { type: Map, of: String, default: {} },
    timeLimitSec: { type: Number, default: 10, min: 1, max: 60 },
    memoryLimitMb: { type: Number, default: 128, min: 32, max: 512 },
    maxScore: { type: Number, default: 100, min: 0, max: 10000 },
    testCases: { type: [TestCaseSchema], default: [] },
    evaluationMode: {
      type: String,
      enum: ['auto', 'manual', 'hybrid'],
      default: 'auto',
    },
    attachments: { type: [AttachmentSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },
    order: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 10, min: 1, max: 50 },
    ...auditFields,
  },
  { timestamps: true }
);

ExperimentSchema.index({ tenantId: 1, labId: 1, order: 1 });

// ─── LabSubmission ──────────────────────────────────────────────────────────

export interface ILabSubmission extends Document {
  tenantId: Types.ObjectId;
  experimentId: Types.ObjectId;
  labId: Types.ObjectId;
  practicalId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  kind: SubmissionKind;
  language?: LabLanguage | null;
  code?: string | null;
  reportFileKey?: string | null;
  screenshotFileKey?: string | null;
  outputText?: string | null;
  githubUrl?: string | null;
  executionJobId?: Types.ObjectId | null;
  autoScore?: number | null;
  manualScore?: number | null;
  totalScore?: number | null;
  status: LabSubmissionStatus;
  attemptNumber: number;
  submittedAt?: Date | null;
  testResults: Array<{
    testCaseId: string;
    passed: boolean;
    actualOutput?: string | null;
    durationMs?: number | null;
    score?: number | null;
  }>;
  evaluationStatus: EvaluationStatus;
  feedback?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TestResultSchema = new Schema(
  {
    testCaseId: { type: String, required: true },
    passed: { type: Boolean, required: true },
    actualOutput: { type: String, default: null },
    durationMs: { type: Number, default: null },
    score: { type: Number, default: null },
  },
  { _id: false }
);

const LabSubmissionSchema = new Schema<ILabSubmission>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment', required: true, index: true },
    labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true, index: true },
    practicalId: { type: Schema.Types.ObjectId, ref: 'Practical', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    kind: {
      type: String,
      enum: ['code', 'report', 'screenshot', 'output', 'github', 'mixed'],
      default: 'code',
    },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'c', 'cpp', 'sql'],
      default: null,
    },
    code: { type: String, default: null, maxlength: 100000 },
    reportFileKey: { type: String, default: null },
    screenshotFileKey: { type: String, default: null },
    outputText: { type: String, default: null, maxlength: 50000 },
    githubUrl: { type: String, default: null, maxlength: 500 },
    executionJobId: { type: Schema.Types.ObjectId, ref: 'ExecutionJob', default: null },
    autoScore: { type: Number, default: null, min: 0 },
    manualScore: { type: Number, default: null, min: 0 },
    totalScore: { type: Number, default: null, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'running', 'scored', 'evaluated', 'returned'],
      default: 'draft',
      index: true,
    },
    attemptNumber: { type: Number, required: true, min: 1 },
    submittedAt: { type: Date, default: null },
    testResults: { type: [TestResultSchema], default: [] },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'auto_scored', 'manual', 'completed'],
      default: 'pending',
    },
    feedback: { type: String, default: null, maxlength: 10000 },
    ...auditFields,
  },
  { timestamps: true }
);

LabSubmissionSchema.index(
  { tenantId: 1, experimentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);
LabSubmissionSchema.index({ tenantId: 1, studentId: 1, status: 1 });
LabSubmissionSchema.index({ tenantId: 1, experimentId: 1, status: 1 });

// ─── ExecutionJob ───────────────────────────────────────────────────────────

export interface IExecutionJob extends Document {
  tenantId: Types.ObjectId;
  submissionId: Types.ObjectId;
  studentId: Types.ObjectId;
  experimentId: Types.ObjectId;
  language: LabLanguage;
  code: string;
  status: ExecutionStatus;
  queuedAt: Date;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  stdout?: string | null;
  stderr?: string | null;
  exitCode?: number | null;
  testResults: Array<{
    testCaseId: string;
    passed: boolean;
    actualOutput?: string | null;
    durationMs?: number | null;
    score?: number | null;
  }>;
  errorMessage?: string | null;
  workerId?: string | null;
  durationMs?: number | null;
  timeLimitSec: number;
  memoryLimitMb: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionJobSchema = new Schema<IExecutionJob>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'LabSubmission', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment', required: true, index: true },
    language: {
      type: String,
      enum: ['python', 'javascript', 'java', 'c', 'cpp', 'sql'],
      required: true,
    },
    code: { type: String, required: true, maxlength: 100000 },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed', 'timeout', 'cancelled'],
      default: 'queued',
      index: true,
    },
    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    stdout: { type: String, default: null, maxlength: 100000 },
    stderr: { type: String, default: null, maxlength: 100000 },
    exitCode: { type: Number, default: null },
    testResults: { type: [TestResultSchema], default: [] },
    errorMessage: { type: String, default: null, maxlength: 5000 },
    workerId: { type: String, default: null },
    durationMs: { type: Number, default: null },
    timeLimitSec: { type: Number, default: 10 },
    memoryLimitMb: { type: Number, default: 128 },
  },
  { timestamps: true }
);

ExecutionJobSchema.index({ tenantId: 1, status: 1, queuedAt: 1 });
ExecutionJobSchema.index({ submissionId: 1 });

// ─── Evaluation ─────────────────────────────────────────────────────────────

export interface ILabEvaluation extends Document {
  tenantId: Types.ObjectId;
  submissionId: Types.ObjectId;
  autoScore?: number | null;
  manualScore?: number | null;
  totalScore?: number | null;
  vivaScore?: number | null;
  rubricNotes?: string | null;
  feedback?: string | null;
  status: EvaluationStatus;
  evaluatedBy?: Types.ObjectId | null;
  evaluatedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LabEvaluationSchema = new Schema<ILabEvaluation>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'LabSubmission',
      required: true,
      unique: true,
      index: true,
    },
    autoScore: { type: Number, default: null, min: 0 },
    manualScore: { type: Number, default: null, min: 0 },
    totalScore: { type: Number, default: null, min: 0 },
    vivaScore: { type: Number, default: null, min: 0 },
    rubricNotes: { type: String, default: null, maxlength: 10000 },
    feedback: { type: String, default: null, maxlength: 10000 },
    status: {
      type: String,
      enum: ['pending', 'auto_scored', 'manual', 'completed'],
      default: 'pending',
    },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    evaluatedAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

// ─── Digital Lab Record ─────────────────────────────────────────────────────

export interface IDigitalLabRecord extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  practicalId: Types.ObjectId;
  labId?: Types.ObjectId | null;
  entries: Array<{
    experimentId: Types.ObjectId;
    experimentTitle?: string;
    bestScore?: number | null;
    attempts: number;
    lastSubmittedAt?: Date | null;
  }>;
  cumulativeScore: number;
  maxPossibleScore: number;
  vivaMarks?: number | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalLabRecordSchema = new Schema<IDigitalLabRecord>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    practicalId: { type: Schema.Types.ObjectId, ref: 'Practical', required: true, index: true },
    labId: { type: Schema.Types.ObjectId, ref: 'Lab', default: null },
    entries: [
      {
        experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment' },
        experimentTitle: String,
        bestScore: { type: Number, default: null },
        attempts: { type: Number, default: 0 },
        lastSubmittedAt: { type: Date, default: null },
      },
    ],
    cumulativeScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    vivaMarks: { type: Number, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

DigitalLabRecordSchema.index({ tenantId: 1, studentId: 1, practicalId: 1 }, { unique: true });

export const Practical = mongoose.model<IPractical>('Practical', PracticalSchema);
export const Lab = mongoose.model<ILab>('Lab', LabSchema);
export const Experiment = mongoose.model<IExperiment>('Experiment', ExperimentSchema);
export const LabSubmission = mongoose.model<ILabSubmission>('LabSubmission', LabSubmissionSchema);
export const ExecutionJob = mongoose.model<IExecutionJob>('ExecutionJob', ExecutionJobSchema);
export const LabEvaluation = mongoose.model<ILabEvaluation>('LabEvaluation', LabEvaluationSchema);
export const DigitalLabRecord = mongoose.model<IDigitalLabRecord>(
  'DigitalLabRecord',
  DigitalLabRecordSchema
);
