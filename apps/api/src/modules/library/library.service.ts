import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  LibraryItem,
  LibraryLoan,
  LibraryReservation,
  LibraryFine,
  type ILibraryItem,
  type ILibraryLoan,
  type ILibraryReservation,
  type ILibraryFine,
} from './library.model';
import { Student } from '../students/student.model';
import type {
  LibraryItemPublic,
  LibraryLoanPublic,
  LibraryReservationPublic,
  LibraryFinePublic,
} from '@university-lms/shared';
import {
  LIBRARY_DEFAULT_LOAN_DAYS,
  LIBRARY_RESERVATION_HOLD_HOURS,
  LIBRARY_DEFAULT_FINE_PER_DAY_MINOR,
} from '@university-lms/shared';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}
function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}
function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function toItemPublic(doc: ILibraryItem | Record<string, unknown>): LibraryItemPublic {
  const d = doc as any;
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    isbn: d.isbn ?? null,
    title: d.title,
    authors: d.authors || [],
    type: d.type,
    categoryTags: d.categoryTags || [],
    totalCopies: d.totalCopies,
    availableCopies: d.availableCopies,
    digitalUrl: d.digitalUrl ?? null,
    location: d.location ?? null,
    shelf: d.shelf ?? null,
    status: d.status,
    description: d.description ?? null,
    publisher: d.publisher ?? null,
    publishedYear: d.publishedYear ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function toLoanPublic(
  doc: ILibraryLoan | Record<string, unknown>,
  item?: Partial<LibraryItemPublic> | null,
  studentName?: string | null
): LibraryLoanPublic {
  const d = doc as any;
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    itemId: String(d.itemId),
    studentId: String(d.studentId),
    copyBarcode: d.copyBarcode ?? null,
    borrowedAt: d.borrowedAt,
    dueAt: d.dueAt,
    returnedAt: d.returnedAt ?? null,
    status: d.status,
    item: item ?? null,
    studentName: studentName ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function toReservationPublic(
  doc: ILibraryReservation | Record<string, unknown>,
  item?: Partial<LibraryItemPublic> | null
): LibraryReservationPublic {
  const d = doc as any;
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    itemId: String(d.itemId),
    studentId: String(d.studentId),
    status: d.status,
    queuedAt: d.queuedAt,
    expiresAt: d.expiresAt ?? null,
    item: item ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function toFinePublic(doc: ILibraryFine | Record<string, unknown>): LibraryFinePublic {
  const d = doc as any;
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    loanId: String(d.loanId),
    studentId: String(d.studentId),
    amountMinor: d.amountMinor,
    currency: d.currency || 'INR',
    reason: d.reason,
    status: d.status,
    waivedAt: d.waivedAt ?? null,
    waivedBy: idStr(d.waivedBy),
    waivedReason: d.waivedReason ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

async function resolveStudentId(
  tenantId: string,
  user: { id: string; roles: string[] },
  explicitStudentId?: string
): Promise<string> {
  if (explicitStudentId && !user.roles.includes('student')) {
    return explicitStudentId;
  }
  if (user.roles.includes('student')) {
    const s = await Student.findOne(baseFilter(tenantId, { userId: tid(user.id) })).lean();
    if (!s) throw new AppError(404, 'Student profile not found for current user');
    return String(s._id);
  }
  if (!explicitStudentId) throw new AppError(400, 'studentId is required');
  return explicitStudentId;
}

/** Mark overdue loans and optionally create fine records (idempotent per loan). */
export async function refreshOverdue(tenantId: string) {
  const now = new Date();
  const overdue = await LibraryLoan.find(
    baseFilter(tenantId, { status: 'active', dueAt: { $lt: now } })
  );
  for (const loan of overdue) {
    loan.status = 'overdue';
    await loan.save();
    const existing = await LibraryFine.findOne(
      baseFilter(tenantId, { loanId: loan._id, status: { $in: ['pending', 'waived'] } })
    );
    if (!existing) {
      const days = Math.max(
        1,
        Math.ceil((now.getTime() - new Date(loan.dueAt).getTime()) / (24 * 60 * 60 * 1000))
      );
      await LibraryFine.create({
        tenantId: tid(tenantId),
        loanId: loan._id,
        studentId: loan.studentId,
        amountMinor: days * LIBRARY_DEFAULT_FINE_PER_DAY_MINOR,
        currency: 'INR',
        reason: `Overdue ${days} day(s)`,
        status: 'pending',
      });
    }
  }
  return { marked: overdue.length };
}

export async function listItems(
  tenantId: string,
  q: {
    q?: string;
    type?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.type) filter.type = q.type;
  if (q.status) filter.status = q.status;
  else filter.status = 'active';
  if (q.category) filter.categoryTags = q.category;
  if (q.q) {
    filter.$or = [
      { title: { $regex: q.q, $options: 'i' } },
      { authors: { $regex: q.q, $options: 'i' } },
      { isbn: { $regex: q.q, $options: 'i' } },
      { categoryTags: { $regex: q.q, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    LibraryItem.find(filter)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LibraryItem.countDocuments(filter),
  ]);
  return { items: items.map(toItemPublic), total, page, limit };
}

export async function getItem(tenantId: string, id: string) {
  const doc = await LibraryItem.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Library item not found');
  return toItemPublic(doc);
}

export async function createItem(
  tenantId: string,
  body: Record<string, unknown>,
  userId: string
) {
  const total = Number(body.totalCopies ?? 1);
  const doc = await LibraryItem.create({
    tenantId: tid(tenantId),
    isbn: body.isbn || null,
    title: body.title,
    authors: body.authors || [],
    type: body.type || 'book',
    categoryTags: body.categoryTags || [],
    totalCopies: total,
    availableCopies: total,
    digitalUrl: body.digitalUrl || null,
    location: body.location || null,
    shelf: body.shelf || null,
    status: body.status || 'active',
    description: body.description || null,
    publisher: body.publisher || null,
    publishedYear: body.publishedYear ?? null,
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  return toItemPublic(doc);
}

export async function updateItem(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId: string
) {
  const doc = await LibraryItem.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Library item not found');
  const prevTotal = doc.totalCopies;
  if (body.title !== undefined) doc.title = String(body.title);
  if (body.isbn !== undefined) doc.isbn = body.isbn as string | null;
  if (body.authors !== undefined) doc.authors = body.authors as string[];
  if (body.type !== undefined) doc.type = body.type as any;
  if (body.categoryTags !== undefined) doc.categoryTags = body.categoryTags as string[];
  if (body.digitalUrl !== undefined) doc.digitalUrl = (body.digitalUrl as string) || null;
  if (body.location !== undefined) doc.location = body.location as string | null;
  if (body.shelf !== undefined) doc.shelf = body.shelf as string | null;
  if (body.status !== undefined) doc.status = body.status as any;
  if (body.description !== undefined) doc.description = body.description as string | null;
  if (body.publisher !== undefined) doc.publisher = body.publisher as string | null;
  if (body.publishedYear !== undefined) doc.publishedYear = body.publishedYear as number | null;
  if (body.totalCopies !== undefined) {
    const nextTotal = Number(body.totalCopies);
    const delta = nextTotal - prevTotal;
    doc.totalCopies = nextTotal;
    doc.availableCopies = Math.max(0, doc.availableCopies + delta);
  }
  doc.updatedBy = tid(userId);
  await doc.save();
  return toItemPublic(doc);
}

export async function deleteItem(tenantId: string, id: string, userId: string) {
  const doc = await LibraryItem.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Library item not found');
  const activeLoans = await LibraryLoan.countDocuments(
    baseFilter(tenantId, { itemId: doc._id, status: { $in: ['active', 'overdue'] } })
  );
  if (activeLoans > 0) {
    throw new AppError(400, 'Cannot delete item with active loans');
  }
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

export async function createLoan(
  tenantId: string,
  body: { itemId: string; studentId: string; copyBarcode?: string | null; dueAt?: string | null; loanDays?: number },
  userId: string
) {
  const item = await LibraryItem.findOne(
    baseFilter(tenantId, { _id: tid(body.itemId), status: 'active' })
  );
  if (!item) throw new AppError(404, 'Library item not found');
  if (item.availableCopies <= 0) {
    throw new AppError(400, 'No copies available. Consider placing a reservation.');
  }
  const student = await Student.findOne(baseFilter(tenantId, { _id: tid(body.studentId) }));
  if (!student) throw new AppError(404, 'Student not found');

  const loanDays = body.loanDays || LIBRARY_DEFAULT_LOAN_DAYS;
  const borrowedAt = new Date();
  const dueAt = body.dueAt ? new Date(body.dueAt) : new Date(borrowedAt.getTime() + loanDays * 86400000);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    item.availableCopies -= 1;
    await item.save({ session });
    const [loan] = await LibraryLoan.create(
      [
        {
          tenantId: tid(tenantId),
          itemId: item._id,
          studentId: student._id,
          copyBarcode: body.copyBarcode || null,
          borrowedAt,
          dueAt,
          status: 'active',
          createdBy: tid(userId),
          updatedBy: tid(userId),
        },
      ],
      { session }
    );
    await session.commitTransaction();
    return toLoanPublic(loan, toItemPublic(item));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function returnLoan(
  tenantId: string,
  loanId: string,
  opts: { markLost?: boolean },
  userId: string
) {
  const loan = await LibraryLoan.findOne(
    baseFilter(tenantId, { _id: tid(loanId), status: { $in: ['active', 'overdue'] } })
  );
  if (!loan) throw new AppError(404, 'Active loan not found');
  const item = await LibraryItem.findOne(baseFilter(tenantId, { _id: loan.itemId }));
  if (!item) throw new AppError(404, 'Library item not found');

  loan.returnedAt = new Date();
  loan.status = opts.markLost ? 'lost' : 'returned';
  loan.updatedBy = tid(userId);
  if (!opts.markLost) {
    item.availableCopies = Math.min(item.totalCopies, item.availableCopies + 1);
    await item.save();
  }
  await loan.save();
  return toLoanPublic(loan, toItemPublic(item));
}

export async function listLoans(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { studentId?: string; itemId?: string; status?: string; page?: number; limit?: number }
) {
  await refreshOverdue(tenantId);
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'librarian', 'staff'].includes(r))) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else if (q.studentId) {
    filter.studentId = tid(q.studentId);
  }
  if (q.itemId) filter.itemId = tid(q.itemId);
  if (q.status) filter.status = q.status;

  const [loans, total] = await Promise.all([
    LibraryLoan.find(filter)
      .sort({ borrowedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LibraryLoan.countDocuments(filter),
  ]);
  const itemIds = [...new Set(loans.map((l) => String(l.itemId)))];
  const items = await LibraryItem.find({ _id: { $in: itemIds.map(tid) } }).lean();
  const itemMap = new Map(items.map((i) => [String(i._id), toItemPublic(i)]));
  return {
    items: loans.map((l) => toLoanPublic(l, itemMap.get(String(l.itemId)) || null)),
    total,
    page,
    limit,
  };
}

export async function createReservation(
  tenantId: string,
  body: { itemId: string; studentId?: string },
  user: { id: string; roles: string[] }
) {
  const studentId = await resolveStudentId(tenantId, user, body.studentId);
  const item = await LibraryItem.findOne(baseFilter(tenantId, { _id: tid(body.itemId), status: 'active' }));
  if (!item) throw new AppError(404, 'Library item not found');
  const existing = await LibraryReservation.findOne(
    baseFilter(tenantId, { itemId: item._id, studentId: tid(studentId), status: 'active' })
  );
  if (existing) throw new AppError(400, 'Active reservation already exists for this item');
  const expiresAt = new Date(Date.now() + LIBRARY_RESERVATION_HOLD_HOURS * 3600000);
  const doc = await LibraryReservation.create({
    tenantId: tid(tenantId),
    itemId: item._id,
    studentId: tid(studentId),
    status: 'active',
    queuedAt: new Date(),
    expiresAt,
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });
  return toReservationPublic(doc, toItemPublic(item));
}

export async function cancelReservation(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await LibraryReservation.findOne(baseFilter(tenantId, { _id: tid(id), status: 'active' }));
  if (!doc) throw new AppError(404, 'Active reservation not found');
  if (user.roles.includes('student')) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(doc.studentId) !== sid) throw new AppError(403, 'Not your reservation');
  }
  doc.status = 'cancelled';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return toReservationPublic(doc);
}

export async function listReservations(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { studentId?: string; itemId?: string; status?: string; page?: number; limit?: number }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'librarian'].includes(r))) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else if (q.studentId) {
    filter.studentId = tid(q.studentId);
  }
  if (q.itemId) filter.itemId = tid(q.itemId);
  if (q.status) filter.status = q.status;
  const [rows, total] = await Promise.all([
    LibraryReservation.find(filter)
      .sort({ queuedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LibraryReservation.countDocuments(filter),
  ]);
  const itemIds = [...new Set(rows.map((r) => String(r.itemId)))];
  const items = await LibraryItem.find({ _id: { $in: itemIds.map(tid) } }).lean();
  const itemMap = new Map(items.map((i) => [String(i._id), toItemPublic(i)]));
  return {
    items: rows.map((r) => toReservationPublic(r, itemMap.get(String(r.itemId)) || null)),
    total,
    page,
    limit,
  };
}

export async function listFines(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { studentId?: string; status?: string; page?: number; limit?: number }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'librarian'].includes(r))) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else if (q.studentId) {
    filter.studentId = tid(q.studentId);
  }
  if (q.status) filter.status = q.status;
  const [rows, total] = await Promise.all([
    LibraryFine.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LibraryFine.countDocuments(filter),
  ]);
  return { items: rows.map(toFinePublic), total, page, limit };
}

export async function waiveFine(
  tenantId: string,
  fineId: string,
  reason: string | undefined,
  userId: string
) {
  const fine = await LibraryFine.findOne(baseFilter(tenantId, { _id: tid(fineId), status: 'pending' }));
  if (!fine) throw new AppError(404, 'Pending fine not found');
  fine.status = 'waived';
  fine.waivedAt = new Date();
  fine.waivedBy = tid(userId);
  fine.waivedReason = reason || 'Waived by librarian';
  fine.updatedBy = tid(userId);
  await fine.save();
  return toFinePublic(fine);
}
