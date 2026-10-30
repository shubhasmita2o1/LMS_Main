import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  Company,
  PlacementDrive,
  PlacementApplication,
  Interview,
  Offer,
  type ICompany,
  type IPlacementDrive,
  type IPlacementApplication,
  type IInterview,
  type IOffer,
} from './placement.model';
import { Student } from '../students/student.model';
import type {
  CompanyPublic,
  PlacementDrivePublic,
  PlacementApplicationPublic,
  InterviewPublic,
  OfferPublic,
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

function toCompany(d: ICompany | Record<string, unknown>): CompanyPublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    name: x.name,
    industry: x.industry ?? null,
    website: x.website ?? null,
    description: x.description ?? null,
    status: x.status,
    contactEmail: x.contactEmail ?? null,
    contactPhone: x.contactPhone ?? null,
    logoUrl: x.logoUrl ?? null,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function toDrive(
  d: IPlacementDrive | Record<string, unknown>,
  company?: Partial<CompanyPublic> | null,
  applicationCount?: number
): PlacementDrivePublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    companyId: String(x.companyId),
    title: x.title,
    jobType: x.jobType,
    description: x.description ?? null,
    packageMin: x.packageMin ?? null,
    packageMax: x.packageMax ?? null,
    location: x.location ?? null,
    eligibility: x.eligibility ?? null,
    applicationOpenAt: x.applicationOpenAt ?? null,
    applicationCloseAt: x.applicationCloseAt ?? null,
    status: x.status,
    company: company ?? null,
    applicationCount,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function toApp(
  d: IPlacementApplication | Record<string, unknown>,
  drive?: Partial<PlacementDrivePublic> | null,
  studentName?: string | null
): PlacementApplicationPublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    driveId: String(x.driveId),
    studentId: String(x.studentId),
    status: x.status,
    resumeFileKey: x.resumeFileKey ?? null,
    coverNote: x.coverNote ?? null,
    timeline: (x.timeline || []).map((t: any) => ({
      at: t.at,
      status: t.status,
      note: t.note,
    })),
    drive: drive ?? null,
    studentName: studentName ?? null,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function toInterview(d: IInterview | Record<string, unknown>): InterviewPublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    applicationId: String(x.applicationId),
    scheduledAt: x.scheduledAt,
    mode: x.mode,
    locationOrLink: x.locationOrLink ?? null,
    result: x.result ?? null,
    notes: x.notes ?? null,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function toOffer(
  d: IOffer | Record<string, unknown>,
  company?: Partial<CompanyPublic> | null
): OfferPublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    applicationId: String(x.applicationId),
    studentId: String(x.studentId),
    companyId: String(x.companyId),
    packageAmount: x.packageAmount ?? null,
    currency: x.currency || 'INR',
    roleTitle: x.roleTitle,
    status: x.status,
    offeredAt: x.offeredAt,
    acceptedAt: x.acceptedAt ?? null,
    expiresAt: x.expiresAt ?? null,
    notes: x.notes ?? null,
    company: company ?? null,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

async function resolveStudentId(
  tenantId: string,
  user: { id: string; roles: string[] },
  explicit?: string
): Promise<string> {
  if (user.roles.includes('student')) {
    const s = await Student.findOne(baseFilter(tenantId, { userId: tid(user.id) })).lean();
    if (!s) throw new AppError(404, 'Student profile not found');
    return String(s._id);
  }
  if (!explicit) throw new AppError(400, 'studentId required');
  return explicit;
}

// ── Companies ──────────────────────────────────────────────────────────────

export async function listCompanies(
  tenantId: string,
  q: { status?: string; page?: number; limit?: number; search?: string }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.search) filter.name = { $regex: q.search, $options: 'i' };
  const [items, total] = await Promise.all([
    Company.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Company.countDocuments(filter),
  ]);
  return { items: items.map(toCompany), total, page, limit };
}

export async function createCompany(
  tenantId: string,
  body: Record<string, unknown>,
  userId: string
) {
  const doc = await Company.create({
    tenantId: tid(tenantId),
    ...body,
    website: body.website || null,
    contactEmail: body.contactEmail || null,
    logoUrl: body.logoUrl || null,
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  return toCompany(doc);
}

export async function updateCompany(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId: string
) {
  const doc = await Company.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Company not found');
  Object.assign(doc, body, { updatedBy: tid(userId) });
  if (body.website === '') doc.website = null;
  if (body.contactEmail === '') doc.contactEmail = null;
  await doc.save();
  return toCompany(doc);
}

export async function deleteCompany(tenantId: string, id: string, userId: string) {
  const doc = await Company.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Company not found');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

// ── Drives ─────────────────────────────────────────────────────────────────

export async function listDrives(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { status?: string; jobType?: string; companyId?: string; page?: number; limit?: number }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'staff'].includes(r))) {
    filter.status = 'open';
  } else if (q.status) {
    filter.status = q.status;
  }
  if (q.jobType) filter.jobType = q.jobType;
  if (q.companyId) filter.companyId = tid(q.companyId);
  const [items, total] = await Promise.all([
    PlacementDrive.find(filter)
      .sort({ applicationOpenAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PlacementDrive.countDocuments(filter),
  ]);
  const companyIds = [...new Set(items.map((d) => String(d.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds.map(tid) } }).lean();
  const cmap = new Map(companies.map((c) => [String(c._id), toCompany(c)]));
  const counts = await PlacementApplication.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        isDeleted: false,
        driveId: { $in: items.map((d) => d._id) },
      },
    },
    { $group: { _id: '$driveId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count as number]));
  return {
    items: items.map((d) =>
      toDrive(d, cmap.get(String(d.companyId)) || null, countMap.get(String(d._id)) || 0)
    ),
    total,
    page,
    limit,
  };
}

export async function getDrive(tenantId: string, id: string) {
  const doc = await PlacementDrive.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Drive not found');
  const company = await Company.findOne(baseFilter(tenantId, { _id: doc.companyId })).lean();
  const count = await PlacementApplication.countDocuments(
    baseFilter(tenantId, { driveId: doc._id })
  );
  return toDrive(doc, company ? toCompany(company) : null, count);
}

export async function createDrive(
  tenantId: string,
  body: Record<string, unknown>,
  userId: string
) {
  const company = await Company.findOne(baseFilter(tenantId, { _id: tid(String(body.companyId)) }));
  if (!company) throw new AppError(404, 'Company not found');
  const doc = await PlacementDrive.create({
    tenantId: tid(tenantId),
    companyId: company._id,
    title: body.title,
    jobType: body.jobType,
    description: body.description || null,
    packageMin: body.packageMin ?? null,
    packageMax: body.packageMax ?? null,
    location: body.location || null,
    eligibility: body.eligibility || null,
    applicationOpenAt: body.applicationOpenAt ? new Date(String(body.applicationOpenAt)) : null,
    applicationCloseAt: body.applicationCloseAt ? new Date(String(body.applicationCloseAt)) : null,
    status: body.status || 'draft',
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  return toDrive(doc, toCompany(company));
}

export async function updateDrive(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId: string
) {
  const doc = await PlacementDrive.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Drive not found');
  if (body.title !== undefined) doc.title = String(body.title);
  if (body.jobType !== undefined) doc.jobType = body.jobType as any;
  if (body.description !== undefined) doc.description = body.description as string | null;
  if (body.packageMin !== undefined) doc.packageMin = body.packageMin as number | null;
  if (body.packageMax !== undefined) doc.packageMax = body.packageMax as number | null;
  if (body.location !== undefined) doc.location = body.location as string | null;
  if (body.eligibility !== undefined) doc.eligibility = body.eligibility as any;
  if (body.applicationOpenAt !== undefined)
    doc.applicationOpenAt = body.applicationOpenAt
      ? new Date(String(body.applicationOpenAt))
      : null;
  if (body.applicationCloseAt !== undefined)
    doc.applicationCloseAt = body.applicationCloseAt
      ? new Date(String(body.applicationCloseAt))
      : null;
  if (body.status !== undefined) doc.status = body.status as any;
  if (body.companyId !== undefined) {
    const company = await Company.findOne(baseFilter(tenantId, { _id: tid(String(body.companyId)) }));
    if (!company) throw new AppError(404, 'Company not found');
    doc.companyId = company._id as any;
  }
  doc.updatedBy = tid(userId);
  await doc.save();
  return toDrive(doc);
}

export async function setDriveStatus(
  tenantId: string,
  id: string,
  status: 'open' | 'closed' | 'completed' | 'draft',
  userId: string
) {
  const doc = await PlacementDrive.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Drive not found');
  doc.status = status;
  if (status === 'open' && !doc.applicationOpenAt) doc.applicationOpenAt = new Date();
  if (status === 'closed' && !doc.applicationCloseAt) doc.applicationCloseAt = new Date();
  doc.updatedBy = tid(userId);
  await doc.save();
  return toDrive(doc);
}

export async function deleteDrive(tenantId: string, id: string, userId: string) {
  const doc = await PlacementDrive.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Drive not found');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

// ── Applications ───────────────────────────────────────────────────────────

function parseCgpa(student: any): number | null {
  const raw = student?.percentageOrCgpa || student?.cgpa;
  if (raw == null) return null;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) ? n : null;
}

export async function applyToDrive(
  tenantId: string,
  body: { driveId: string; resumeFileKey?: string | null; coverNote?: string | null },
  user: { id: string; roles: string[] }
) {
  const studentId = await resolveStudentId(tenantId, user);
  const drive = await PlacementDrive.findOne(
    baseFilter(tenantId, { _id: tid(body.driveId), status: 'open' })
  );
  if (!drive) throw new AppError(404, 'Open drive not found');
  const now = new Date();
  if (drive.applicationCloseAt && now > drive.applicationCloseAt) {
    throw new AppError(400, 'Application window has closed');
  }
  if (drive.applicationOpenAt && now < drive.applicationOpenAt) {
    throw new AppError(400, 'Application window has not opened yet');
  }

  const student = await Student.findOne(baseFilter(tenantId, { _id: tid(studentId) })).lean();
  if (!student) throw new AppError(404, 'Student not found');

  const elig = drive.eligibility;
  if (elig?.minCgpa != null) {
    const cgpa = parseCgpa(student);
    if (cgpa == null) {
      // Soft fail with message if data missing
      throw new AppError(
        400,
        `Eligibility requires minimum CGPA ${elig.minCgpa}, but CGPA is not available on your profile`
      );
    }
    if (cgpa < elig.minCgpa) {
      throw new AppError(400, `Minimum CGPA required: ${elig.minCgpa}. Your CGPA: ${cgpa}`);
    }
  }

  const existing = await PlacementApplication.findOne(
    baseFilter(tenantId, { driveId: drive._id, studentId: tid(studentId) })
  );
  if (existing) throw new AppError(400, 'You have already applied to this drive');

  const doc = await PlacementApplication.create({
    tenantId: tid(tenantId),
    driveId: drive._id,
    studentId: tid(studentId),
    status: 'applied',
    resumeFileKey: body.resumeFileKey || null,
    coverNote: body.coverNote || null,
    timeline: [{ at: new Date(), status: 'applied', note: 'Application submitted' }],
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });
  return toApp(doc, toDrive(drive));
}

export async function listApplications(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { driveId?: string; studentId?: string; status?: string; page?: number; limit?: number }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'staff'].includes(r))) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else if (q.studentId) {
    filter.studentId = tid(q.studentId);
  }
  if (q.driveId) filter.driveId = tid(q.driveId);
  if (q.status) filter.status = q.status;
  const [items, total] = await Promise.all([
    PlacementApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PlacementApplication.countDocuments(filter),
  ]);
  const driveIds = [...new Set(items.map((a) => String(a.driveId)))];
  const drives = await PlacementDrive.find({ _id: { $in: driveIds.map(tid) } }).lean();
  const dmap = new Map(drives.map((d) => [String(d._id), toDrive(d)]));
  return {
    items: items.map((a) => toApp(a, dmap.get(String(a.driveId)) || null)),
    total,
    page,
    limit,
  };
}

export async function updateApplicationStatus(
  tenantId: string,
  id: string,
  body: { status: string; note?: string | null },
  userId: string
) {
  const doc = await PlacementApplication.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Application not found');
  doc.status = body.status as any;
  doc.timeline = doc.timeline || [];
  doc.timeline.push({
    at: new Date(),
    status: body.status,
    note: body.note || undefined,
  });
  doc.updatedBy = tid(userId);
  await doc.save();
  return toApp(doc);
}

export async function withdrawApplication(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await PlacementApplication.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Application not found');
  if (user.roles.includes('student')) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(doc.studentId) !== sid) throw new AppError(403, 'Not your application');
  }
  if (['accepted', 'rejected', 'withdrawn'].includes(doc.status)) {
    throw new AppError(400, `Cannot withdraw application in status ${doc.status}`);
  }
  doc.status = 'withdrawn';
  doc.timeline.push({ at: new Date(), status: 'withdrawn', note: 'Withdrawn by student' });
  doc.updatedBy = tid(user.id);
  await doc.save();
  return toApp(doc);
}

// ── Interviews & Offers ────────────────────────────────────────────────────

export async function createInterview(
  tenantId: string,
  body: {
    applicationId: string;
    scheduledAt: string;
    mode?: string;
    locationOrLink?: string | null;
    notes?: string | null;
  },
  userId: string
) {
  const app = await PlacementApplication.findOne(
    baseFilter(tenantId, { _id: tid(body.applicationId) })
  );
  if (!app) throw new AppError(404, 'Application not found');
  const doc = await Interview.create({
    tenantId: tid(tenantId),
    applicationId: app._id,
    scheduledAt: new Date(body.scheduledAt),
    mode: body.mode || 'online',
    locationOrLink: body.locationOrLink || null,
    notes: body.notes || null,
    result: 'pending',
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  if (app.status === 'applied' || app.status === 'shortlisted') {
    app.status = 'interview';
    app.timeline.push({ at: new Date(), status: 'interview', note: 'Interview scheduled' });
    app.updatedBy = tid(userId);
    await app.save();
  }
  return toInterview(doc);
}

export async function updateInterview(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId: string
) {
  const doc = await Interview.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Interview not found');
  if (body.scheduledAt) doc.scheduledAt = new Date(String(body.scheduledAt));
  if (body.mode) doc.mode = body.mode as any;
  if (body.locationOrLink !== undefined) doc.locationOrLink = body.locationOrLink as string | null;
  if (body.result) doc.result = body.result as any;
  if (body.notes !== undefined) doc.notes = body.notes as string | null;
  doc.updatedBy = tid(userId);
  await doc.save();
  return toInterview(doc);
}

export async function listInterviews(tenantId: string, applicationId?: string) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (applicationId) filter.applicationId = tid(applicationId);
  const items = await Interview.find(filter).sort({ scheduledAt: 1 }).lean();
  return { items: items.map(toInterview) };
}

export async function createOffer(
  tenantId: string,
  body: {
    applicationId: string;
    packageAmount?: number | null;
    currency?: string;
    roleTitle: string;
    expiresAt?: string | null;
    notes?: string | null;
  },
  userId: string
) {
  const app = await PlacementApplication.findOne(
    baseFilter(tenantId, { _id: tid(body.applicationId) })
  );
  if (!app) throw new AppError(404, 'Application not found');
  const drive = await PlacementDrive.findOne(baseFilter(tenantId, { _id: app.driveId }));
  if (!drive) throw new AppError(404, 'Drive not found');
  const doc = await Offer.create({
    tenantId: tid(tenantId),
    applicationId: app._id,
    studentId: app.studentId,
    companyId: drive.companyId,
    packageAmount: body.packageAmount ?? null,
    currency: body.currency || 'INR',
    roleTitle: body.roleTitle,
    status: 'pending',
    offeredAt: new Date(),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    notes: body.notes || null,
    createdBy: tid(userId),
    updatedBy: tid(userId),
  });
  app.status = 'offered';
  app.timeline.push({ at: new Date(), status: 'offered', note: body.roleTitle });
  app.updatedBy = tid(userId);
  await app.save();
  const company = await Company.findOne(baseFilter(tenantId, { _id: drive.companyId })).lean();
  return toOffer(doc, company ? toCompany(company) : null);
}

export async function listOffers(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { studentId?: string; status?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (user.roles.includes('student') && !user.roles.some((r) => ['tenant_admin', 'university_admin'].includes(r))) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else if (q.studentId) {
    filter.studentId = tid(q.studentId);
  }
  if (q.status) filter.status = q.status;
  const items = await Offer.find(filter).sort({ offeredAt: -1 }).lean();
  const companyIds = [...new Set(items.map((o) => String(o.companyId)))];
  const companies = await Company.find({ _id: { $in: companyIds.map(tid) } }).lean();
  const cmap = new Map(companies.map((c) => [String(c._id), toCompany(c)]));
  return {
    items: items.map((o) => toOffer(o, cmap.get(String(o.companyId)) || null)),
  };
}

export async function respondOffer(
  tenantId: string,
  id: string,
  accept: boolean,
  user: { id: string; roles: string[] }
) {
  const doc = await Offer.findOne(baseFilter(tenantId, { _id: tid(id), status: 'pending' }));
  if (!doc) throw new AppError(404, 'Pending offer not found');
  if (user.roles.includes('student')) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(doc.studentId) !== sid) throw new AppError(403, 'Not your offer');
  }
  doc.status = accept ? 'accepted' : 'declined';
  if (accept) doc.acceptedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  const app = await PlacementApplication.findOne(baseFilter(tenantId, { _id: doc.applicationId }));
  if (app) {
    app.status = accept ? 'accepted' : 'rejected';
    app.timeline.push({
      at: new Date(),
      status: accept ? 'accepted' : 'rejected',
      note: accept ? 'Offer accepted' : 'Offer declined',
    });
    await app.save();
  }
  return toOffer(doc);
}
