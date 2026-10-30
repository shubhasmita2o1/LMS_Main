import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TicketStatus, TicketPriority, TicketCategory } from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface ISupportTicket extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: Types.ObjectId | null;
  attachments: Array<{ fileKey: string; fileName: string; mimeType?: string }>;
  escalationLevel: number;
  lastMessageAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema(
  {
    fileKey: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: null },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    category: {
      type: String,
      enum: [
        'academic',
        'technical',
        'hostel',
        'finance_query',
        'grievance',
        'counseling',
        'other',
      ],
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 10000 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_student', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    attachments: { type: [AttachmentSchema], default: [] },
    escalationLevel: { type: Number, default: 0, min: 0, max: 5 },
    lastMessageAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

SupportTicketSchema.index({ tenantId: 1, studentId: 1, status: 1 });
SupportTicketSchema.index({ tenantId: 1, assigneeId: 1, status: 1 });

export interface ISupportMessage extends Document {
  tenantId: Types.ObjectId;
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  isInternalNote: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, required: true, ref: 'SupportTicket', index: true },
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    body: { type: String, required: true, maxlength: 10000 },
    isInternalNote: { type: Boolean, default: false },
    ...auditFields,
  },
  { timestamps: true }
);

SupportMessageSchema.index({ tenantId: 1, ticketId: 1, createdAt: 1 });

export const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export const SupportMessage =
  mongoose.models.SupportMessage ||
  mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);
