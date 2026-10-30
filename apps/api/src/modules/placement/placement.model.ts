import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  CompanyStatus,
  DriveStatus,
  JobType,
  ApplicationStatus,
  OfferStatus,
  InterviewMode,
  InterviewResult,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface ICompany extends Document {
  tenantId: Types.ObjectId;
  name: string;
  industry?: string | null;
  website?: string | null;
  description?: string | null;
  status: CompanyStatus;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 300 },
    industry: { type: String, default: null },
    website: { type: String, default: null },
    description: { type: String, default: null, maxlength: 5000 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active',
      index: true,
    },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },
    logoUrl: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

CompanySchema.index({ tenantId: 1, name: 1 });

const EligibilitySchema = new Schema(
  {
    minCgpa: { type: Number, default: null },
    programs: { type: [String], default: null },
    maxBacklogs: { type: Number, default: null },
    batchYears: { type: [Number], default: null },
  },
  { _id: false }
);

export interface IPlacementDrive extends Document {
  tenantId: Types.ObjectId;
  companyId: Types.ObjectId;
  title: string;
  jobType: JobType;
  description?: string | null;
  packageMin?: number | null;
  packageMax?: number | null;
  location?: string | null;
  eligibility?: {
    minCgpa?: number | null;
    programs?: string[] | null;
    maxBacklogs?: number | null;
    batchYears?: number[] | null;
  } | null;
  applicationOpenAt?: Date | null;
  applicationCloseAt?: Date | null;
  status: DriveStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlacementDriveSchema = new Schema<IPlacementDrive>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, required: true, ref: 'Company', index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    jobType: { type: String, enum: ['placement', 'internship'], required: true, index: true },
    description: { type: String, default: null, maxlength: 10000 },
    packageMin: { type: Number, default: null },
    packageMax: { type: Number, default: null },
    location: { type: String, default: null },
    eligibility: { type: EligibilitySchema, default: null },
    applicationOpenAt: { type: Date, default: null },
    applicationCloseAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'completed'],
      default: 'draft',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

PlacementDriveSchema.index({ tenantId: 1, status: 1, jobType: 1 });

export interface IPlacementApplication extends Document {
  tenantId: Types.ObjectId;
  driveId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: ApplicationStatus;
  resumeFileKey?: string | null;
  coverNote?: string | null;
  timeline: Array<{ at: Date; status: string; note?: string }>;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineSchema = new Schema(
  {
    at: { type: Date, required: true },
    status: { type: String, required: true },
    note: { type: String, default: null },
  },
  { _id: false }
);

const PlacementApplicationSchema = new Schema<IPlacementApplication>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    driveId: { type: Schema.Types.ObjectId, required: true, ref: 'PlacementDrive', index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    status: {
      type: String,
      enum: [
        'draft',
        'applied',
        'shortlisted',
        'interview',
        'offered',
        'accepted',
        'rejected',
        'withdrawn',
      ],
      default: 'applied',
      index: true,
    },
    resumeFileKey: { type: String, default: null },
    coverNote: { type: String, default: null, maxlength: 5000 },
    timeline: { type: [TimelineSchema], default: [] },
    ...auditFields,
  },
  { timestamps: true }
);

PlacementApplicationSchema.index(
  { tenantId: 1, driveId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export interface IInterview extends Document {
  tenantId: Types.ObjectId;
  applicationId: Types.ObjectId;
  scheduledAt: Date;
  mode: InterviewMode;
  locationOrLink?: string | null;
  result?: InterviewResult | null;
  notes?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'PlacementApplication',
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    locationOrLink: { type: String, default: null },
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'no_show', 'rescheduled'],
      default: 'pending',
    },
    notes: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

export interface IOffer extends Document {
  tenantId: Types.ObjectId;
  applicationId: Types.ObjectId;
  studentId: Types.ObjectId;
  companyId: Types.ObjectId;
  packageAmount?: number | null;
  currency: string;
  roleTitle: string;
  status: OfferStatus;
  offeredAt: Date;
  acceptedAt?: Date | null;
  expiresAt?: Date | null;
  notes?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'PlacementApplication',
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    companyId: { type: Schema.Types.ObjectId, required: true, ref: 'Company', index: true },
    packageAmount: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    roleTitle: { type: String, required: true, maxlength: 300 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    offeredAt: { type: Date, required: true, default: Date.now },
    acceptedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    notes: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

OfferSchema.index({ tenantId: 1, studentId: 1, status: 1 });

export const Company =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export const PlacementDrive =
  mongoose.models.PlacementDrive ||
  mongoose.model<IPlacementDrive>('PlacementDrive', PlacementDriveSchema);
export const PlacementApplication =
  mongoose.models.PlacementApplication ||
  mongoose.model<IPlacementApplication>('PlacementApplication', PlacementApplicationSchema);
export const Interview =
  mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
export const Offer = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);
