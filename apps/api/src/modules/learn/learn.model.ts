import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  ProgressStatus,
  LiveClassStatus,
  MeetingProvider,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

// ─── Learning Progress (per student per lesson) ─────────────────────────────

export interface ILearningProgress extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  lessonId: Types.ObjectId;
  status: ProgressStatus;
  progressPercent: number;
  lastPositionSeconds: number;
  completedAt?: Date | null;
  timeSpentSeconds: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LearningProgressSchema = new Schema<ILearningProgress>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    lastPositionSeconds: { type: Number, min: 0, default: 0 },
    completedAt: { type: Date, default: null },
    timeSpentSeconds: { type: Number, min: 0, default: 0 },
    ...auditFields,
  },
  { timestamps: true }
);

LearningProgressSchema.index(
  { tenantId: 1, studentId: 1, lessonId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
LearningProgressSchema.index({ tenantId: 1, studentId: 1, courseId: 1 });

export const LearningProgress = mongoose.model<ILearningProgress>(
  'LearningProgress',
  LearningProgressSchema
);

// ─── Notes ──────────────────────────────────────────────────────────────────

export interface ILearningNote extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  body: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LearningNoteSchema = new Schema<ILearningNote>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    body: { type: String, required: true, maxlength: 20000 },
    ...auditFields,
  },
  { timestamps: true }
);

LearningNoteSchema.index({ tenantId: 1, studentId: 1, lessonId: 1 });

export const LearningNote = mongoose.model<ILearningNote>('LearningNote', LearningNoteSchema);

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export interface IBookmark extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  label?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    label: { type: String, default: null, maxlength: 200 },
    ...auditFields,
  },
  { timestamps: true }
);

BookmarkSchema.index(
  { tenantId: 1, studentId: 1, lessonId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

// ─── Live Class ─────────────────────────────────────────────────────────────

export interface ILiveClass extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  sectionId?: Types.ObjectId | null;
  title: string;
  description?: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: LiveClassStatus;
  meetingProvider: MeetingProvider;
  meetingUrl?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  hostFacultyId?: Types.ObjectId | null;
  recordingUrl?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassSchema = new Schema<ILiveClass>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null, maxlength: 5000 },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    meetingProvider: {
      type: String,
      enum: ['zoom', 'meet', 'teams', 'custom'],
      default: 'custom',
    },
    meetingUrl: { type: String, default: null, maxlength: 2000 },
    meetingId: { type: String, default: null, maxlength: 200 },
    passcode: { type: String, default: null, maxlength: 100 },
    hostFacultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
    recordingUrl: { type: String, default: null, maxlength: 2000 },
    ...auditFields,
  },
  { timestamps: true }
);

LiveClassSchema.index({ tenantId: 1, courseId: 1, scheduledStart: 1 });
LiveClassSchema.index({ tenantId: 1, status: 1, scheduledStart: 1 });

export const LiveClass = mongoose.model<ILiveClass>('LiveClass', LiveClassSchema);
