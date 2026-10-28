import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  AnnouncementAudience,
  AnnouncementStatus,
  NotificationChannel,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface IAnnouncement extends Document {
  tenantId: Types.ObjectId;
  title: string;
  body: string;
  audienceType: AnnouncementAudience;
  audienceFilter?: {
    courseId?: Types.ObjectId | null;
    programId?: Types.ObjectId | null;
    sectionId?: Types.ObjectId | null;
    roles?: string[] | null;
  } | null;
  channels: NotificationChannel[];
  status: AnnouncementStatus;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, required: true, maxlength: 20000 },
    audienceType: {
      type: String,
      enum: ['tenant', 'course', 'program', 'section', 'role'],
      required: true,
      default: 'tenant',
    },
    audienceFilter: {
      courseId: { type: Schema.Types.ObjectId, default: null },
      programId: { type: Schema.Types.ObjectId, default: null },
      sectionId: { type: Schema.Types.ObjectId, default: null },
      roles: { type: [String], default: null },
    },
    channels: {
      type: [String],
      enum: ['in_app', 'email', 'push', 'sms'],
      default: ['in_app'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

AnnouncementSchema.index({ tenantId: 1, status: 1, publishedAt: -1 });
AnnouncementSchema.index({ tenantId: 1, 'audienceFilter.courseId': 1, status: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
