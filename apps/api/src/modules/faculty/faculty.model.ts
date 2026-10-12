import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  FacultyStatus,
  EmploymentType,
  FacultyQualification,
  FacultyAssignmentRole,
  Gender,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const QualificationSchema = new Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: String,
    year: Number,
    specialization: String,
  },
  { _id: false }
);

export interface IFaculty extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date | null;
  gender?: Gender;
  photoUrl?: string;
  designation?: string;
  employmentType: EmploymentType;
  departmentId?: Types.ObjectId | null;
  additionalDepartmentIds: Types.ObjectId[];
  dateOfJoining?: Date | null;
  dateOfLeaving?: Date | null;
  status: FacultyStatus;
  qualifications: FacultyQualification[];
  specializations: string[];
  experienceYears?: number;
  bio?: string;
  officeLocation?: string;
  officeHours?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FacultySchema = new Schema<IFaculty>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    employeeId: { type: String, required: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    middleName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    photoUrl: String,
    designation: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'visiting', 'contract', 'adjunct'],
      default: 'full_time',
    },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    additionalDepartmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    dateOfJoining: { type: Date, default: null },
    dateOfLeaving: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'retired', 'terminated'],
      default: 'active',
      index: true,
    },
    qualifications: { type: [QualificationSchema], default: [] },
    specializations: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0 },
    bio: { type: String, maxlength: 4000 },
    officeLocation: { type: String, maxlength: 200 },
    officeHours: { type: String, maxlength: 500 },
    ...auditFields,
  },
  { timestamps: true }
);

FacultySchema.index(
  { tenantId: 1, employeeId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
FacultySchema.index({ tenantId: 1, email: 1 }, { sparse: true });
FacultySchema.index({ tenantId: 1, departmentId: 1, status: 1 });
FacultySchema.index({
  tenantId: 1,
  firstName: 'text',
  lastName: 'text',
  employeeId: 'text',
  email: 'text',
});

export const Faculty = mongoose.model<IFaculty>('Faculty', FacultySchema);

// ─── Faculty Assignment (ready for Phase 7 courses) ─────────────────────────

export interface IFacultyAssignment extends Document {
  tenantId: Types.ObjectId;
  facultyId: Types.ObjectId;
  courseId?: Types.ObjectId | null;
  sectionId?: Types.ObjectId | null;
  academicYearId?: Types.ObjectId | null;
  semesterId?: Types.ObjectId | null;
  role: FacultyAssignmentRole;
  workloadHours?: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FacultyAssignmentSchema = new Schema<IFacultyAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    role: {
      type: String,
      enum: ['instructor', 'coordinator', 'lab_instructor', 'guest_lecturer', 'other'],
      default: 'instructor',
    },
    workloadHours: { type: Number, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FacultyAssignmentSchema.index({ tenantId: 1, facultyId: 1, isDeleted: 1 });

export const FacultyAssignment = mongoose.model<IFacultyAssignment>(
  'FacultyAssignment',
  FacultyAssignmentSchema
);
