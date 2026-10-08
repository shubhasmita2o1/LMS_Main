import mongoose, { Schema, Document, Types } from 'mongoose';
import type { UsageMetricKey } from '@university-lms/shared';

export interface IUsageRecord extends Document {
  tenantId: Types.ObjectId;
  metric: UsageMetricKey;
  value: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    metric: {
      type: String,
      required: true,
      enum: [
        'activeStudents',
        'activeFaculty',
        'storageBytes',
        'apiCalls',
        'courses',
        'activeAdmins',
      ],
    },
    value: { type: Number, required: true, default: 0, min: 0 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

UsageRecordSchema.index(
  { tenantId: 1, metric: 1, periodStart: 1 },
  { unique: true }
);
UsageRecordSchema.index({ tenantId: 1, periodEnd: -1 });

export const UsageRecord = mongoose.model<IUsageRecord>('UsageRecord', UsageRecordSchema);
