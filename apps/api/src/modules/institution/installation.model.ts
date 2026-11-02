/**
 * Installation / setup state — tracks first-run completion and permanent lock.
 * Exactly one document is expected after a successful install.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInstallation extends Document {
  locked: boolean;
  lockedAt?: Date | null;
  institutionId?: Types.ObjectId | null;
  /** Version of the setup schema / wizard that completed the install */
  setupVersion: string;
  completedSteps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InstallationSchema = new Schema<IInstallation>(
  {
    locked: {
      type: Boolean,
      default: false,
      index: true,
    },
    lockedAt: { type: Date, default: null },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    setupVersion: {
      type: String,
      default: '1.0.0',
    },
    completedSteps: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Installation = mongoose.model<IInstallation>('Installation', InstallationSchema);
