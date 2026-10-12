import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  StudentStatus,
  EnrollmentStatus,
  Gender,
  BloodGroup,
  AdmissionType,
  GuardianInfo,
  EmergencyContactInfo,
  PreviousEducationInfo,
  AddressInfo,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const AddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const GuardianSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    phone: String,
    email: String,
    occupation: String,
    address: String,
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const EmergencySchema = new Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const PreviousEducationSchema = new Schema(
  {
    institution: { type: String, required: true },
    boardOrUniversity: String,
    year: Number,
    percentageOrCgpa: String,
    qualification: String,
  },
  { _id: false }
);

export interface IStudent extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  enrollmentNumber: string;
  rollNumber?: string;
  registrationNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date | null;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  nationality?: string;
  category?: string;
  permanentAddress?: AddressInfo;
  currentAddress?: AddressInfo;
  photoUrl?: string;
  status: StudentStatus;
  enrollmentStatus: EnrollmentStatus;
  programId?: Types.ObjectId | null;
  batchId?: Types.ObjectId | null;
  sectionId?: Types.ObjectId | null;
  departmentId?: Types.ObjectId | null;
  admissionDate?: Date | null;
  admissionType?: AdmissionType;
  currentSemesterId?: Types.ObjectId | null;
  academicYearId?: Types.ObjectId | null;
  academicNotes?: string;
  guardians: GuardianInfo[];
  emergencyContacts: EmergencyContactInfo[];
  previousEducation: PreviousEducationInfo[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    enrollmentNumber: { type: String, required: true, trim: true, uppercase: true },
    rollNumber: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
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
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    },
    nationality: { type: String, trim: true },
    category: { type: String, trim: true },
    permanentAddress: { type: AddressSchema },
    currentAddress: { type: AddressSchema },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'suspended', 'withdrawn', 'on_leave', 'alumni'],
      default: 'active',
      index: true,
    },
    enrollmentStatus: {
      type: String,
      enum: ['enrolled', 'provisional', 'deferred', 'completed', 'cancelled'],
      default: 'enrolled',
    },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    admissionDate: { type: Date, default: null },
    admissionType: {
      type: String,
      enum: ['regular', 'lateral', 'transfer', 'nri', 'management', 'other'],
      default: 'regular',
    },
    currentSemesterId: { type: Schema.Types.ObjectId, ref: 'Semester', default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    academicNotes: { type: String, maxlength: 2000 },
    guardians: { type: [GuardianSchema], default: [] },
    emergencyContacts: { type: [EmergencySchema], default: [] },
    previousEducation: { type: [PreviousEducationSchema], default: [] },
    ...auditFields,
  },
  { timestamps: true }
);

StudentSchema.index(
  { tenantId: 1, enrollmentNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
StudentSchema.index({ tenantId: 1, email: 1 }, { sparse: true });
StudentSchema.index({ tenantId: 1, status: 1, isDeleted: 1 });
StudentSchema.index({ tenantId: 1, programId: 1, batchId: 1, sectionId: 1 });
StudentSchema.index({
  tenantId: 1,
  firstName: 'text',
  lastName: 'text',
  enrollmentNumber: 'text',
  email: 'text',
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);

// ─── Student Document (metadata) ────────────────────────────────────────────

export interface IStudentDocument extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  size?: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const StudentDocumentSchema = new Schema<IStudentDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: {
      type: String,
      enum: ['id_proof', 'marksheet', 'photo', 'certificate', 'address_proof', 'other'],
      default: 'other',
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: String,
    size: Number,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

StudentDocumentSchema.index({ tenantId: 1, studentId: 1, isDeleted: 1 });

export const StudentDocument = mongoose.model<IStudentDocument>(
  'StudentDocument',
  StudentDocumentSchema
);
