import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  TranscriptStatus,
  CertificateType,
  CertificateStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

const SnapshotLineSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, default: null },
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    credits: { type: Number, default: 0 },
    grade: { type: String, default: null },
    gradePoints: { type: Number, default: null },
    marks: { type: Number, default: null },
    termLabel: { type: String, default: null },
    resultStatus: { type: String, default: null },
  },
  { _id: false }
);

const SignatureSchema = new Schema(
  {
    algo: { type: String, enum: ['hmac-sha256', 'none'], default: 'hmac-sha256' },
    signature: { type: String, required: true },
    signedAt: { type: Date, required: true },
  },
  { _id: false }
);

export interface ITranscript extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  programId?: Types.ObjectId | null;
  batchId?: Types.ObjectId | null;
  status: TranscriptStatus;
  issuedAt?: Date | null;
  issuedBy?: Types.ObjectId | null;
  snapshot: Array<{
    courseId?: Types.ObjectId | null;
    courseCode: string;
    courseTitle: string;
    credits: number;
    grade?: string | null;
    gradePoints?: number | null;
    marks?: number | null;
    termLabel?: string | null;
    resultStatus?: string | null;
  }>;
  gpa?: number | null;
  cgpa?: number | null;
  totalCredits?: number | null;
  serialNumber?: string | null;
  verificationCode?: string | null;
  pdfFileKey?: string | null;
  digitalSignature?: {
    algo: 'hmac-sha256' | 'none';
    signature: string;
    signedAt: Date;
  } | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    programId: { type: Schema.Types.ObjectId, default: null },
    batchId: { type: Schema.Types.ObjectId, default: null },
    status: {
      type: String,
      enum: ['draft', 'issued', 'revoked'],
      default: 'draft',
      index: true,
    },
    issuedAt: { type: Date, default: null },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    snapshot: { type: [SnapshotLineSchema], default: [] },
    gpa: { type: Number, default: null },
    cgpa: { type: Number, default: null },
    totalCredits: { type: Number, default: null },
    serialNumber: { type: String, default: null, maxlength: 64 },
    verificationCode: { type: String, default: null, maxlength: 128, index: true },
    pdfFileKey: { type: String, default: null },
    digitalSignature: { type: SignatureSchema, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

TranscriptSchema.index(
  { tenantId: 1, serialNumber: 1 },
  { unique: true, partialFilterExpression: { serialNumber: { $type: 'string' }, isDeleted: false } }
);
TranscriptSchema.index({ tenantId: 1, studentId: 1, status: 1 });
TranscriptSchema.index(
  { verificationCode: 1 },
  { unique: true, partialFilterExpression: { verificationCode: { $type: 'string' } } }
);

export const Transcript = mongoose.model<ITranscript>('Transcript', TranscriptSchema);

export interface ICertificate extends Document {
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  type: CertificateType;
  title: string;
  body?: string | null;
  programName?: string | null;
  yearLabel?: string | null;
  classDivision?: string | null;
  status: CertificateStatus;
  issuedAt?: Date | null;
  issuedBy?: Types.ObjectId | null;
  serialNumber?: string | null;
  verificationCode?: string | null;
  pdfFileKey?: string | null;
  digitalSignature?: {
    algo: 'hmac-sha256' | 'none';
    signature: string;
    signedAt: Date;
  } | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    type: {
      type: String,
      enum: ['provisional', 'degree', 'transcript', 'bonafide'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 300 },
    body: { type: String, default: null, maxlength: 5000 },
    programName: { type: String, default: null },
    yearLabel: { type: String, default: null },
    classDivision: { type: String, default: null },
    status: {
      type: String,
      enum: ['draft', 'issued', 'revoked'],
      default: 'draft',
      index: true,
    },
    issuedAt: { type: Date, default: null },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    serialNumber: { type: String, default: null, maxlength: 64 },
    verificationCode: { type: String, default: null, maxlength: 128, index: true },
    pdfFileKey: { type: String, default: null },
    digitalSignature: { type: SignatureSchema, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

CertificateSchema.index(
  { tenantId: 1, serialNumber: 1 },
  { unique: true, partialFilterExpression: { serialNumber: { $type: 'string' }, isDeleted: false } }
);
CertificateSchema.index(
  { verificationCode: 1 },
  { unique: true, partialFilterExpression: { verificationCode: { $type: 'string' } } }
);

export const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);
