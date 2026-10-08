import mongoose, { Schema, Document } from 'mongoose';
import type { BillingProvider } from '@university-lms/shared';

export interface IWebhookEvent extends Document {
  provider: BillingProvider;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
  processedAt?: Date | null;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: {
      type: String,
      enum: ['stripe', 'razorpay', 'none'],
      required: true,
    },
    eventId: { type: String, required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['received', 'processed', 'failed', 'ignored'],
      default: 'received',
    },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
WebhookEventSchema.index({ status: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
