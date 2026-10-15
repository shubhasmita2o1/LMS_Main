import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  AttendanceStatus,
  AttendanceSessionType,
  AttendanceMethod,
  AttendanceSessionStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface IAttendanceSession extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  offeringId?: Types.ObjectId | null;
  sectionId?: Types.ObjectId | null;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
  sessionType: AttendanceSessionType;
  topic?: string | null;
  title?: string | null;
  markedBy?: Types.ObjectId | null;
  method: AttendanceMethod;
  status: AttendanceSessionStatus;
  /** Architecture-ready for QR flow */
  qrToken?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    offeringId: { type: Schema.Types.ObjectId, ref: 'CourseOffering', default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, default: null, maxlength: 10 },
    endTime: { type: String, default: null, maxlength: 10 },
    sessionType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'other'],
      default: 'lecture',
    },
    topic: { type: String, default: null, maxlength: 500 },
    title: { type: String, default: null, maxlength: 300 },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    method: {
      type: String,
      enum: ['manual', 'qr', 'biometric', 'import'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    qrToken: { type: String, default: null, maxlength: 128 },
    ...auditFields,
  },
  { timestamps: true }
);

AttendanceSessionSchema.index({ tenantId: 1, courseId: 1, date: -1 });
AttendanceSessionSchema.index({ tenantId: 1, offeringId: 1, date: -1 });

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);

export interface IAttendanceRecord extends Document {
  tenantId: Types.ObjectId;
  sessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: AttendanceStatus;
  markedAt?: Date | null;
  markedBy?: Types.ObjectId | null;
  note?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused', 'holiday'],
      required: true,
    },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: null, maxlength: 500 },
    ...auditFields,
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ tenantId: 1, sessionId: 1, studentId: 1 }, { unique: true });
AttendanceRecordSchema.index({ tenantId: 1, courseId: 1, studentId: 1 });

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
