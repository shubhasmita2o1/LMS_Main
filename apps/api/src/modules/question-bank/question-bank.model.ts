import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  QuestionType,
  Difficulty,
  BloomLevel,
  QuestionBankStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

// ─── Subject ────────────────────────────────────────────────────────────────

export interface IQBankSubject extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code?: string | null;
  departmentId?: Types.ObjectId | null;
  status: QuestionBankStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QBankSubjectSchema = new Schema<IQBankSubject>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, trim: true, maxlength: 30, default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

QBankSubjectSchema.index({ tenantId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// ─── Unit ───────────────────────────────────────────────────────────────────

export interface IQBankUnit extends Document {
  tenantId: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  order: number;
  status: QuestionBankStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QBankUnitSchema = new Schema<IQBankUnit>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'QBankSubject', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    ...auditFields,
  },
  { timestamps: true }
);

QBankUnitSchema.index({ tenantId: 1, subjectId: 1, order: 1 });

// ─── Topic ──────────────────────────────────────────────────────────────────

export interface IQBankTopic extends Document {
  tenantId: Types.ObjectId;
  unitId: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  order: number;
  status: QuestionBankStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QBankTopicSchema = new Schema<IQBankTopic>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'QBankUnit', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'QBankSubject', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    ...auditFields,
  },
  { timestamps: true }
);

QBankTopicSchema.index({ tenantId: 1, unitId: 1, order: 1 });

// ─── Question ───────────────────────────────────────────────────────────────

const OptionSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 10 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const MatchingPairSchema = new Schema(
  {
    left: { type: String, required: true, trim: true, maxlength: 500 },
    right: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false }
);

export interface IQuestion extends Document {
  tenantId: Types.ObjectId;
  subjectId: Types.ObjectId;
  unitId?: Types.ObjectId | null;
  topicId?: Types.ObjectId | null;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options: Array<{ key: string; text: string; isCorrect?: boolean }>;
  correctAnswer?: string | null;
  matchingPairs: Array<{ left: string; right: string }>;
  marks: number;
  difficulty: Difficulty;
  bloomLevel?: BloomLevel | null;
  explanation?: string | null;
  tags: string[];
  status: QuestionBankStatus;
  usageCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'QBankSubject', required: true, index: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'QBankUnit', default: null, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'QBankTopic', default: null, index: true },
    type: {
      type: String,
      enum: [
        'mcq',
        'multi_select',
        'true_false',
        'fill_blank',
        'short',
        'long',
        'numerical',
        'matching',
      ],
      required: true,
      index: true,
    },
    stem: { type: String, required: true, trim: true, maxlength: 5000 },
    richText: { type: String, default: null, maxlength: 50000 },
    options: { type: [OptionSchema], default: [] },
    correctAnswer: { type: String, default: null, maxlength: 2000 },
    matchingPairs: { type: [MatchingPairSchema], default: [] },
    marks: { type: Number, required: true, min: 0, max: 1000, default: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    bloomLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      default: null,
    },
    explanation: { type: String, default: null, maxlength: 5000 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    usageCount: { type: Number, default: 0, min: 0 },
    ...auditFields,
  },
  { timestamps: true }
);

QuestionSchema.index({ tenantId: 1, subjectId: 1, type: 1, difficulty: 1 });
QuestionSchema.index({ tenantId: 1, tags: 1 });
QuestionSchema.index({ tenantId: 1, stem: 'text', tags: 'text' });

export const QBankSubject =
  mongoose.models.QBankSubject || mongoose.model<IQBankSubject>('QBankSubject', QBankSubjectSchema);
export const QBankUnit =
  mongoose.models.QBankUnit || mongoose.model<IQBankUnit>('QBankUnit', QBankUnitSchema);
export const QBankTopic =
  mongoose.models.QBankTopic || mongoose.model<IQBankTopic>('QBankTopic', QBankTopicSchema);
export const Question =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
