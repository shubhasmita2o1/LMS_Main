import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  AcademicEntityStatus,
  UniversityType,
  DegreeType,
  AcademicConfig,
  GradeBand,
} from '@university-lms/shared';
import {
  DEFAULT_GRADING_SCHEME,
  DEFAULT_CREDIT_STRUCTURE,
  DEFAULT_ATTENDANCE_RULES,
  DEFAULT_PROMOTION_RULES,
} from '@university-lms/shared';

/** Common soft-delete + audit fields */
const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

// ─── University ─────────────────────────────────────────────────────────────

export interface IUniversity extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code: string;
  type: UniversityType;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    type: {
      type: String,
      enum: ['public', 'private', 'deemed', 'autonomous', 'other'],
      default: 'private',
    },
    address: { type: String, maxlength: 500 },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    logoUrl: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

UniversitySchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
UniversitySchema.index({ tenantId: 1, isDeleted: 1, status: 1 });

export const University = mongoose.model<IUniversity>('University', UniversitySchema);

// ─── Campus ─────────────────────────────────────────────────────────────────

export interface ICampus extends Document {
  tenantId: Types.ObjectId;
  universityId: Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  isMainCampus: boolean;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CampusSchema = new Schema<ICampus>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    address: { type: String, maxlength: 500 },
    isMainCampus: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

CampusSchema.index(
  { tenantId: 1, universityId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Campus = mongoose.model<ICampus>('Campus', CampusSchema);

// ─── School ─────────────────────────────────────────────────────────────────

export interface ISchool extends Document {
  tenantId: Types.ObjectId;
  universityId: Types.ObjectId;
  campusId?: Types.ObjectId | null;
  name: string;
  code: string;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    campusId: { type: Schema.Types.ObjectId, ref: 'Campus', default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

SchoolSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const School = mongoose.model<ISchool>('School', SchoolSchema);

// ─── Department ─────────────────────────────────────────────────────────────

export interface IDepartment extends Document {
  tenantId: Types.ObjectId;
  universityId: Types.ObjectId;
  campusId?: Types.ObjectId | null;
  schoolId?: Types.ObjectId | null;
  name: string;
  code: string;
  hodUserId?: Types.ObjectId | null;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    campusId: { type: Schema.Types.ObjectId, ref: 'Campus', default: null },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    hodUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

DepartmentSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
DepartmentSchema.index({ tenantId: 1, universityId: 1, isDeleted: 1 });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);

// ─── Program ────────────────────────────────────────────────────────────────

export interface IProgram extends Document {
  tenantId: Types.ObjectId;
  departmentId: Types.ObjectId;
  name: string;
  code: string;
  degreeType: DegreeType;
  durationYears: number;
  totalCredits: number;
  coordinatorUserId?: Types.ObjectId | null;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    degreeType: {
      type: String,
      enum: ['certificate', 'diploma', 'ug', 'pg', 'doctoral', 'integrated', 'other'],
      default: 'ug',
    },
    durationYears: { type: Number, required: true, min: 0.5, max: 10 },
    totalCredits: { type: Number, required: true, min: 0 },
    coordinatorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

ProgramSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
ProgramSchema.index({ tenantId: 1, departmentId: 1, isDeleted: 1 });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);

// ─── Academic Year ──────────────────────────────────────────────────────────

export interface IAcademicYear extends Document {
  tenantId: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

AcademicYearSchema.index(
  { tenantId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', AcademicYearSchema);

// ─── Semester ───────────────────────────────────────────────────────────────

export interface ISemester extends Document {
  tenantId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  name: string;
  sequence: number;
  startDate?: Date | null;
  endDate?: Date | null;
  isCurrent: boolean;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    sequence: { type: Number, required: true, min: 1 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

SemesterSchema.index(
  { tenantId: 1, academicYearId: 1, sequence: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Semester = mongoose.model<ISemester>('Semester', SemesterSchema);

// ─── Batch ──────────────────────────────────────────────────────────────────

export interface IBatch extends Document {
  tenantId: Types.ObjectId;
  programId: Types.ObjectId;
  academicYearId?: Types.ObjectId | null;
  name: string;
  startYear: number;
  endYear: number;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

BatchSchema.index({ tenantId: 1, programId: 1, isDeleted: 1 });
BatchSchema.index(
  { tenantId: 1, programId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);

// ─── Section ────────────────────────────────────────────────────────────────

export interface ISection extends Document {
  tenantId: Types.ObjectId;
  batchId: Types.ObjectId;
  name: string;
  maxStudents: number;
  advisorUserId?: Types.ObjectId | null;
  status: AcademicEntityStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    maxStudents: { type: Number, default: 60, min: 1 },
    advisorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    ...auditFields,
  },
  { timestamps: true }
);

SectionSchema.index(
  { tenantId: 1, batchId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Section = mongoose.model<ISection>('Section', SectionSchema);

// ─── Academic Config (one per tenant) ───────────────────────────────────────

export interface IAcademicConfig extends Document {
  tenantId: Types.ObjectId;
  gradingScheme: {
    name: string;
    scaleMax: number;
    bands: GradeBand[];
  };
  creditStructure: {
    minCreditsPerSemester: number;
    maxCreditsPerSemester: number;
    creditHoursPerLecture: number;
    creditHoursPerLab: number;
  };
  attendanceRules: {
    minimumPercent: number;
    considerMedicalLeave: boolean;
  };
  promotionRules: {
    minCgpaToPass: number;
    maxBacklogsAllowed: number;
  };
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const GradeBandSchema = new Schema(
  {
    letter: { type: String, required: true },
    minPercent: { type: Number, required: true },
    maxPercent: { type: Number, required: true },
    gradePoint: { type: Number, required: true },
  },
  { _id: false }
);

const AcademicConfigSchema = new Schema<IAcademicConfig>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, unique: true },
    gradingScheme: {
      name: { type: String, default: DEFAULT_GRADING_SCHEME.name },
      scaleMax: { type: Number, default: DEFAULT_GRADING_SCHEME.scaleMax },
      bands: { type: [GradeBandSchema], default: () => [...DEFAULT_GRADING_SCHEME.bands] },
    },
    creditStructure: {
      minCreditsPerSemester: {
        type: Number,
        default: DEFAULT_CREDIT_STRUCTURE.minCreditsPerSemester,
      },
      maxCreditsPerSemester: {
        type: Number,
        default: DEFAULT_CREDIT_STRUCTURE.maxCreditsPerSemester,
      },
      creditHoursPerLecture: {
        type: Number,
        default: DEFAULT_CREDIT_STRUCTURE.creditHoursPerLecture,
      },
      creditHoursPerLab: { type: Number, default: DEFAULT_CREDIT_STRUCTURE.creditHoursPerLab },
    },
    attendanceRules: {
      minimumPercent: { type: Number, default: DEFAULT_ATTENDANCE_RULES.minimumPercent },
      considerMedicalLeave: {
        type: Boolean,
        default: DEFAULT_ATTENDANCE_RULES.considerMedicalLeave,
      },
    },
    promotionRules: {
      minCgpaToPass: { type: Number, default: DEFAULT_PROMOTION_RULES.minCgpaToPass },
      maxBacklogsAllowed: { type: Number, default: DEFAULT_PROMOTION_RULES.maxBacklogsAllowed },
    },
    ...auditFields,
  },
  { timestamps: true }
);

export const AcademicConfigModel = mongoose.model<IAcademicConfig>(
  'AcademicConfig',
  AcademicConfigSchema
);

export type { AcademicConfig };
