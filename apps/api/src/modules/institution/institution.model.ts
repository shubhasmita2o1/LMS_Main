/**
 * Institution model — single document per independent installation.
 *
 * Migration strategy (Stage 2 locked decision):
 * - Keep the field name `tenantId` on all other collections.
 * - The single Institution document's `_id` becomes the fixed tenantId
 *   used by institutionContext middleware and all queries.
 * - Existing Tenant module remains until full verification.
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export type InstitutionType =
  | 'affiliated'
  | 'autonomous'
  | 'private_university'
  | 'public_university'
  | 'deemed'
  | 'multi_campus'
  | 'standalone'
  | 'technical'
  | 'other';

export interface InstitutionBranding {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
}

export interface HierarchyConfig {
  campus: boolean;
  school: boolean;
  department: boolean;
  program: boolean;
  academicYear: boolean;
  semester: boolean;
  batch: boolean;
  section: boolean;
}

export interface InstitutionFeatureToggles {
  labs: boolean;
  placement: boolean;
  library: boolean;
  examinations: boolean;
  admissions: boolean;
  finance: boolean;
  research: boolean;
  hostel: boolean;
  transport: boolean;
}

export interface IInstitution extends Document {
  name: string;
  code?: string | null;
  type: InstitutionType;
  branding: InstitutionBranding;
  hierarchyConfig: HierarchyConfig;
  featureToggles: InstitutionFeatureToggles;
  settings: Record<string, unknown>;
  /**
   * The fixed tenantId value used across the entire installation.
   * Equals this document's _id after install. Explicitly stored for clarity
   * and for optional env INSTITUTION_ID pinning.
   */
  tenantId: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BrandingSchema = new Schema(
  {
    name: { type: String },
    logoUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    faviconUrl: { type: String },
  },
  { _id: false }
);

const HierarchyConfigSchema = new Schema(
  {
    campus: { type: Boolean, default: false },
    school: { type: Boolean, default: false },
    department: { type: Boolean, default: true },
    program: { type: Boolean, default: true },
    academicYear: { type: Boolean, default: true },
    semester: { type: Boolean, default: true },
    batch: { type: Boolean, default: true },
    section: { type: Boolean, default: true },
  },
  { _id: false }
);

const FeatureTogglesSchema = new Schema(
  {
    labs: { type: Boolean, default: true },
    placement: { type: Boolean, default: true },
    library: { type: Boolean, default: true },
    examinations: { type: Boolean, default: true },
    admissions: { type: Boolean, default: true },
    finance: { type: Boolean, default: false },
    research: { type: Boolean, default: false },
    hostel: { type: Boolean, default: false },
    transport: { type: Boolean, default: false },
  },
  { _id: false }
);

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    code: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: [
        'affiliated',
        'autonomous',
        'private_university',
        'public_university',
        'deemed',
        'multi_campus',
        'standalone',
        'technical',
        'other',
      ],
      default: 'affiliated',
      index: true,
    },
    branding: {
      type: BrandingSchema,
      default: () => ({}),
    },
    hierarchyConfig: {
      type: HierarchyConfigSchema,
      default: () => ({
        campus: false,
        school: false,
        department: true,
        program: true,
        academicYear: true,
        semester: true,
        batch: true,
        section: true,
      }),
    },
    featureToggles: {
      type: FeatureTogglesSchema,
      default: () => ({
        labs: true,
        placement: true,
        library: true,
        examinations: true,
        admissions: true,
        finance: false,
        research: false,
        hostel: false,
        transport: false,
      }),
    },
    settings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
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

// Enforce at most one non-deleted Institution per database
InstitutionSchema.index(
  { isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export const Institution = mongoose.model<IInstitution>('Institution', InstitutionSchema);
