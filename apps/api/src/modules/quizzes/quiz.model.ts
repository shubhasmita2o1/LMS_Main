import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AssignmentStatus, QuizAttemptStatus, QuizShowResults } from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const QuizQuestionSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    marks: { type: Number, default: null, min: 0 },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

export interface IQuiz extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  questions: Array<{ questionId: Types.ObjectId; marks?: number | null; order: number }>;
  totalMarks: number;
  durationMinutes?: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: QuizShowResults;
  availableFrom?: Date | null;
  dueAt?: Date | null;
  status: AssignmentStatus;
  passPercent?: number | null;
  negativeMarking?: number | null;
  autoSubmitOnTimeout: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: null, maxlength: 10000 },
    instructions: { type: String, default: null, maxlength: 10000 },
    questions: { type: [QuizQuestionSchema], default: [] },
    totalMarks: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: null, min: 1, max: 600 },
    maxAttempts: { type: Number, default: 1, min: 1, max: 20 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResults: {
      type: String,
      enum: ['never', 'after_submit', 'after_close'],
      default: 'after_submit',
    },
    availableFrom: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },
    passPercent: { type: Number, default: null, min: 0, max: 100 },
    negativeMarking: { type: Number, default: null, min: 0, max: 100 },
    autoSubmitOnTimeout: { type: Boolean, default: true },
    ...auditFields,
  },
  { timestamps: true }
);

QuizSchema.index({ tenantId: 1, courseId: 1, status: 1 });

const AnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    response: { type: Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: null },
  },
  { _id: false }
);

export interface IQuizAttempt extends Document {
  tenantId: Types.ObjectId;
  quizId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: Date;
  submittedAt?: Date | null;
  expiresAt?: Date | null;
  answers: Array<{
    questionId: Types.ObjectId;
    response?: unknown;
    isCorrect?: boolean | null;
    marksAwarded?: number | null;
  }>;
  totalMarksAwarded?: number | null;
  percent?: number | null;
  questionOrder: Types.ObjectId[];
  /** Snapshot of option order per question when shuffleOptions */
  optionOrder?: Record<string, string[]>;
  ip?: string | null;
  userAgent?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'graded'],
      default: 'in_progress',
      index: true,
    },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    answers: { type: [AnswerSchema], default: [] },
    totalMarksAwarded: { type: Number, default: null },
    percent: { type: Number, default: null },
    questionOrder: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    optionOrder: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

QuizAttemptSchema.index(
  { tenantId: 1, quizId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuizAttempt =
  mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
