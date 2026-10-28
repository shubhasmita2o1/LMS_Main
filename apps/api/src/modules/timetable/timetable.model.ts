import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DayOfWeek, TimeTableSlotStatus, RoomType } from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface IRoom extends Document {
  tenantId: Types.ObjectId;
  campusId?: Types.ObjectId | null;
  building?: string | null;
  name: string;
  code: string;
  capacity: number;
  roomType: RoomType;
  facilities?: string[] | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    campusId: { type: Schema.Types.ObjectId, default: null },
    building: { type: String, default: null, maxlength: 120 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    capacity: { type: Number, default: 30, min: 1, max: 5000 },
    roomType: {
      type: String,
      enum: ['classroom', 'lab', 'seminar', 'other'],
      default: 'classroom',
    },
    facilities: { type: [String], default: null },
    isActive: { type: Boolean, default: true },
    ...auditFields,
  },
  { timestamps: true }
);

RoomSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

export interface ITimetableEntry extends Document {
  tenantId: Types.ObjectId;
  academicYearId?: Types.ObjectId | null;
  termId?: Types.ObjectId | null;
  courseId: Types.ObjectId;
  sectionId?: Types.ObjectId | null;
  batchId?: Types.ObjectId | null;
  facultyId: Types.ObjectId;
  roomId?: Types.ObjectId | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  validFrom?: Date | null;
  validTo?: Date | null;
  status: TimeTableSlotStatus;
  substitutionOfEntryId?: Types.ObjectId | null;
  notes?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, default: null },
    termId: { type: Schema.Types.ObjectId, default: null },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'Course', index: true },
    sectionId: { type: Schema.Types.ObjectId, default: null, index: true },
    batchId: { type: Schema.Types.ObjectId, default: null },
    facultyId: { type: Schema.Types.ObjectId, required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'substituted'],
      default: 'scheduled',
      index: true,
    },
    substitutionOfEntryId: { type: Schema.Types.ObjectId, ref: 'TimetableEntry', default: null },
    notes: { type: String, default: null, maxlength: 1000 },
    ...auditFields,
  },
  { timestamps: true }
);

TimetableEntrySchema.index({ tenantId: 1, facultyId: 1, dayOfWeek: 1 });
TimetableEntrySchema.index({ tenantId: 1, roomId: 1, dayOfWeek: 1 });
TimetableEntrySchema.index({ tenantId: 1, sectionId: 1, dayOfWeek: 1 });
TimetableEntrySchema.index({ tenantId: 1, courseId: 1, dayOfWeek: 1 });

export const TimetableEntry = mongoose.model<ITimetableEntry>('TimetableEntry', TimetableEntrySchema);

export interface ITimetableSubstitution extends Document {
  tenantId: Types.ObjectId;
  originalEntryId: Types.ObjectId;
  newFacultyId?: Types.ObjectId | null;
  newRoomId?: Types.ObjectId | null;
  newStartTime?: string | null;
  newEndTime?: string | null;
  date: Date;
  reason?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSubstitutionSchema = new Schema<ITimetableSubstitution>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    originalEntryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'TimetableEntry',
      index: true,
    },
    newFacultyId: { type: Schema.Types.ObjectId, default: null },
    newRoomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
    newStartTime: { type: String, default: null },
    newEndTime: { type: String, default: null },
    date: { type: Date, required: true },
    reason: { type: String, default: null, maxlength: 500 },
    ...auditFields,
  },
  { timestamps: true }
);

TimetableSubstitutionSchema.index({ tenantId: 1, originalEntryId: 1, date: 1 });

export const TimetableSubstitution = mongoose.model<ITimetableSubstitution>(
  'TimetableSubstitution',
  TimetableSubstitutionSchema
);
