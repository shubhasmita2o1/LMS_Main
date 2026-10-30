import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  LibraryItemType,
  LibraryItemStatus,
  LoanStatus,
  ReservationStatus,
  FineStatus,
} from '@university-lms/shared';

const auditFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
};

export interface ILibraryItem extends Document {
  tenantId: Types.ObjectId;
  isbn?: string | null;
  title: string;
  authors: string[];
  type: LibraryItemType;
  categoryTags: string[];
  totalCopies: number;
  availableCopies: number;
  digitalUrl?: string | null;
  location?: string | null;
  shelf?: string | null;
  status: LibraryItemStatus;
  description?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryItemSchema = new Schema<ILibraryItem>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    isbn: { type: String, default: null, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    authors: { type: [String], default: [] },
    type: {
      type: String,
      enum: ['book', 'journal', 'ebook', 'media', 'other'],
      default: 'book',
      index: true,
    },
    categoryTags: { type: [String], default: [] },
    totalCopies: { type: Number, required: true, min: 0, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    digitalUrl: { type: String, default: null },
    location: { type: String, default: null },
    shelf: { type: String, default: null },
    status: { type: String, enum: ['active', 'retired'], default: 'active', index: true },
    description: { type: String, default: null, maxlength: 5000 },
    publisher: { type: String, default: null },
    publishedYear: { type: Number, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

LibraryItemSchema.index({ tenantId: 1, title: 'text', authors: 'text', isbn: 'text' });
LibraryItemSchema.index({ tenantId: 1, status: 1, type: 1 });

export interface ILibraryLoan extends Document {
  tenantId: Types.ObjectId;
  itemId: Types.ObjectId;
  studentId: Types.ObjectId;
  copyBarcode?: string | null;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt?: Date | null;
  status: LoanStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryLoanSchema = new Schema<ILibraryLoan>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'LibraryItem', index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    copyBarcode: { type: String, default: null },
    borrowedAt: { type: Date, required: true, default: Date.now },
    dueAt: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'lost'],
      default: 'active',
      index: true,
    },
    ...auditFields,
  },
  { timestamps: true }
);

LibraryLoanSchema.index({ tenantId: 1, studentId: 1, status: 1 });
LibraryLoanSchema.index({ tenantId: 1, itemId: 1, status: 1 });

export interface ILibraryReservation extends Document {
  tenantId: Types.ObjectId;
  itemId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: ReservationStatus;
  queuedAt: Date;
  expiresAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryReservationSchema = new Schema<ILibraryReservation>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'LibraryItem', index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    queuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

LibraryReservationSchema.index({ tenantId: 1, studentId: 1, status: 1 });
LibraryReservationSchema.index({ tenantId: 1, itemId: 1, status: 1 });

export interface ILibraryFine extends Document {
  tenantId: Types.ObjectId;
  loanId: Types.ObjectId;
  studentId: Types.ObjectId;
  amountMinor: number;
  currency: string;
  reason: string;
  status: FineStatus;
  waivedAt?: Date | null;
  waivedBy?: Types.ObjectId | null;
  waivedReason?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryFineSchema = new Schema<ILibraryFine>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, required: true, ref: 'LibraryLoan', index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', index: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    reason: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'waived', 'settled_external'],
      default: 'pending',
      index: true,
    },
    waivedAt: { type: Date, default: null },
    waivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    waivedReason: { type: String, default: null },
    ...auditFields,
  },
  { timestamps: true }
);

LibraryFineSchema.index({ tenantId: 1, studentId: 1, status: 1 });

export const LibraryItem: mongoose.Model<ILibraryItem> =
  (mongoose.models.LibraryItem as mongoose.Model<ILibraryItem>) ||
  mongoose.model<ILibraryItem>('LibraryItem', LibraryItemSchema);
export const LibraryLoan: mongoose.Model<ILibraryLoan> =
  (mongoose.models.LibraryLoan as mongoose.Model<ILibraryLoan>) ||
  mongoose.model<ILibraryLoan>('LibraryLoan', LibraryLoanSchema);
export const LibraryReservation: mongoose.Model<ILibraryReservation> =
  (mongoose.models.LibraryReservation as mongoose.Model<ILibraryReservation>) ||
  mongoose.model<ILibraryReservation>('LibraryReservation', LibraryReservationSchema);
export const LibraryFine: mongoose.Model<ILibraryFine> =
  (mongoose.models.LibraryFine as mongoose.Model<ILibraryFine>) ||
  mongoose.model<ILibraryFine>('LibraryFine', LibraryFineSchema);
