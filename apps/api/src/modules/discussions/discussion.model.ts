import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  DiscussionThreadStatus,
  DiscussionReplyStatus,
  DiscussionReportStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface IDiscussionThread extends Document {
  tenantId: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  body: string;
  status: DiscussionThreadStatus;
  isAnnouncementPin: boolean;
  lastActivityAt: Date;
  replyCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionThreadSchema = new Schema<IDiscussionThread>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, required: true, maxlength: 20000 },
    status: {
      type: String,
      enum: ['open', 'locked', 'hidden'],
      default: 'open',
      index: true,
    },
    isAnnouncementPin: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    replyCount: { type: Number, default: 0, min: 0 },
    ...auditFields,
  },
  { timestamps: true }
);

DiscussionThreadSchema.index({ tenantId: 1, courseId: 1, lastActivityAt: -1 });
DiscussionThreadSchema.index({ tenantId: 1, courseId: 1, isAnnouncementPin: -1, lastActivityAt: -1 });

export const DiscussionThread = mongoose.model<IDiscussionThread>(
  'DiscussionThread',
  DiscussionThreadSchema
);

export interface IDiscussionReply extends Document {
  tenantId: Types.ObjectId;
  threadId: Types.ObjectId;
  courseId: Types.ObjectId;
  body: string;
  parentReplyId?: Types.ObjectId | null;
  status: DiscussionReplyStatus;
  isAnswer: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionReplySchema = new Schema<IDiscussionReply>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    threadId: { type: Schema.Types.ObjectId, required: true, ref: 'DiscussionThread', index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    body: { type: String, required: true, maxlength: 10000 },
    parentReplyId: { type: Schema.Types.ObjectId, ref: 'DiscussionReply', default: null },
    status: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
    isAnswer: { type: Boolean, default: false },
    ...auditFields,
  },
  { timestamps: true }
);

DiscussionReplySchema.index({ tenantId: 1, threadId: 1, createdAt: 1 });

export const DiscussionReply = mongoose.model<IDiscussionReply>(
  'DiscussionReply',
  DiscussionReplySchema
);

export interface IDiscussionReport extends Document {
  tenantId: Types.ObjectId;
  threadId?: Types.ObjectId | null;
  replyId?: Types.ObjectId | null;
  reportedBy: Types.ObjectId;
  reason: string;
  status: DiscussionReportStatus;
  resolvedBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionReportSchema = new Schema<IDiscussionReport>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    threadId: { type: Schema.Types.ObjectId, ref: 'DiscussionThread', default: null },
    replyId: { type: Schema.Types.ObjectId, ref: 'DiscussionReply', default: null },
    reportedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    reason: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

DiscussionReportSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const DiscussionReport = mongoose.model<IDiscussionReport>(
  'DiscussionReport',
  DiscussionReportSchema
);
