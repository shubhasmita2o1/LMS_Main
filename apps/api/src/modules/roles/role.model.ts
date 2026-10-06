import mongoose, { Schema, Document, Types } from 'mongoose';
import type { Permission, SystemRole } from '@university-lms/shared';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: Permission[];
  /** null = system-wide role (super_admin roles); otherwise tenant-scoped */
  tenantId: Types.ObjectId | null;
  isSystemRole: boolean;
  /** Maps to SystemRole key when isSystemRole */
  systemKey?: SystemRole;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema(
  {
    resource: { type: String, required: true },
    action: { type: String, required: true },
    scope: { type: String },
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    permissions: { type: [PermissionSchema], default: [] },
    tenantId: { type: Schema.Types.ObjectId, default: null, index: true },
    isSystemRole: { type: Boolean, default: false },
    systemKey: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RoleSchema.index(
  { name: 1, tenantId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
