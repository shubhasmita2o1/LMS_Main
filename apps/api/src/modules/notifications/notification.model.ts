import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  NotificationPreferenceMap,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

// ─── NotificationTemplate ────────────────────────────────────────────────────

export interface INotificationTemplate extends Document {
  tenantId?: Types.ObjectId | null;
  key: string;
  name: string;
  channel: NotificationChannel;
  subjectTemplate?: string | null;
  bodyTemplate: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, default: null, index: true },
    key: { type: String, required: true, trim: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'push', 'sms'],
      required: true,
    },
    subjectTemplate: { type: String, default: null, maxlength: 300 },
    bodyTemplate: { type: String, required: true, maxlength: 10000 },
    isActive: { type: Boolean, default: true },
    ...auditFields,
  },
  { timestamps: true }
);

NotificationTemplateSchema.index(
  { tenantId: 1, key: 1, channel: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const NotificationTemplate = mongoose.model<INotificationTemplate>(
  'NotificationTemplate',
  NotificationTemplateSchema
);

// ─── Notification ────────────────────────────────────────────────────────────

export interface INotification extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  status: NotificationStatus;
  readAt?: Date | null;
  priority: NotificationPriority;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  dedupeKey?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: {
      type: String,
      enum: [
        'announcement',
        'assignment_due',
        'quiz_available',
        'exam_reminder',
        'grade_published',
        'attendance_alert',
        'discussion_reply',
        'system',
        'custom',
      ],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'push', 'sms'],
      required: true,
      default: 'in_app',
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, required: true, maxlength: 5000 },
    data: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'delivered', 'failed', 'read'],
      default: 'pending',
      index: true,
    },
    readAt: { type: Date, default: null },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    scheduledFor: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    dedupeKey: { type: String, default: null, maxlength: 200 },
    ...auditFields,
  },
  { timestamps: true }
);

NotificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, userId: 1, readAt: 1 });
NotificationSchema.index(
  { tenantId: 1, userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' }, isDeleted: false } }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

// ─── NotificationDeliveryLog ─────────────────────────────────────────────────

export interface INotificationDeliveryLog extends Document {
  tenantId: Types.ObjectId;
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  channel: NotificationChannel;
  status: NotificationStatus;
  providerResponse?: string | null;
  error?: string | null;
  attempt: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliveryLogSchema = new Schema<INotificationDeliveryLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    notificationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Notification',
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'push', 'sms'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'delivered', 'failed', 'read'],
      required: true,
    },
    providerResponse: { type: String, default: null, maxlength: 1000 },
    error: { type: String, default: null, maxlength: 1000 },
    attempt: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

NotificationDeliveryLogSchema.index({ tenantId: 1, createdAt: -1 });
NotificationDeliveryLogSchema.index({ tenantId: 1, notificationId: 1 });

export const NotificationDeliveryLog = mongoose.model<INotificationDeliveryLog>(
  'NotificationDeliveryLog',
  NotificationDeliveryLogSchema
);

// ─── NotificationPreference ──────────────────────────────────────────────────

export interface INotificationPreference extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  preferences: NotificationPreferenceMap;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    preferences: { type: Schema.Types.Mixed, default: {} },
    ...auditFields,
  },
  { timestamps: true }
);

NotificationPreferenceSchema.index(
  { tenantId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
