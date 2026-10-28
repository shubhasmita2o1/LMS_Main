import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { Transcript, Certificate, type ITranscript, type ICertificate } from './transcript.model';
import type {
  TranscriptPublic,
  CertificatePublic,
  VerificationPublicResult,
  TranscriptLineSnapshot,
  CertificateType,
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

function randomCode(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function serialFor(prefix: string): string {
  const y = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${y}-${rand}`;
}

function hashSnapshot(snapshot: TranscriptLineSnapshot[]): string {
  const canonical = JSON.stringify(
    snapshot.map((s) => ({
      c: s.courseCode,
      t: s.courseTitle,
      cr: s.credits,
      g: s.grade ?? '',
      gp: s.gradePoints ?? '',
      m: s.marks ?? '',
    }))
  );
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function signPayload(payload: string): { algo: 'hmac-sha256'; signature: string; signedAt: Date } {
  const signature = crypto
    .createHmac('sha256', env.TRANSCRIPT_SIGNING_SECRET)
    .update(payload)
    .digest('hex');
  return { algo: 'hmac-sha256', signature, signedAt: new Date() };
}

function verifyHmac(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.TRANSCRIPT_SIGNING_SECRET)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function studentName(studentId: string): Promise<string | null> {
  try {
    const Student = mongoose.models.Student;
    if (!Student) return null;
    const s = await Student.findById(studentId).select('firstName lastName fullName').lean();
    if (!s) return null;
    return (
      (s as any).fullName ||
      [((s as any).firstName || ''), ((s as any).lastName || '')].join(' ').trim() ||
      null
    );
  } catch {
    return null;
  }
}

function mapTranscript(d: any, extra: Partial<TranscriptPublic> = {}): TranscriptPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    studentName: extra.studentName ?? null,
    programId: idStr(d.programId),
    programName: extra.programName ?? null,
    batchId: idStr(d.batchId),
    status: d.status,
    issuedAt: d.issuedAt ?? null,
    issuedBy: idStr(d.issuedBy),
    snapshot: (d.snapshot || []).map((s: any) => ({
      courseId: idStr(s.courseId),
      courseCode: s.courseCode,
      courseTitle: s.courseTitle,
      credits: s.credits ?? 0,
      grade: s.grade ?? null,
      gradePoints: s.gradePoints ?? null,
      marks: s.marks ?? null,
      termLabel: s.termLabel ?? null,
      resultStatus: s.resultStatus ?? null,
    })),
    gpa: d.gpa ?? null,
    cgpa: d.cgpa ?? null,
    totalCredits: d.totalCredits ?? null,
    serialNumber: d.serialNumber ?? null,
    verificationCode: d.verificationCode ?? null,
    pdfFileKey: d.pdfFileKey ?? null,
    digitalSignature: d.digitalSignature
      ? {
          algo: d.digitalSignature.algo,
          signature: d.digitalSignature.signature,
          signedAt: d.digitalSignature.signedAt,
        }
      : null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapCertificate(d: any, extra: Partial<CertificatePublic> = {}): CertificatePublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    studentId: String(d.studentId),
    studentName: extra.studentName ?? null,
    type: d.type,
    title: d.title,
    body: d.body ?? null,
    programName: d.programName ?? null,
    yearLabel: d.yearLabel ?? null,
    classDivision: d.classDivision ?? null,
    status: d.status,
    issuedAt: d.issuedAt ?? null,
    issuedBy: idStr(d.issuedBy),
    serialNumber: d.serialNumber ?? null,
    verificationCode: d.verificationCode ?? null,
    pdfFileKey: d.pdfFileKey ?? null,
    digitalSignature: d.digitalSignature
      ? {
          algo: d.digitalSignature.algo,
          signature: d.digitalSignature.signature,
          signedAt: d.digitalSignature.signedAt,
        }
      : null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function isAdmin(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'registrar'].includes(r)
  );
}

/** Build snapshot lines from published Results only */
async function buildSnapshotFromPublished(
  tenantId: string,
  studentId: string
): Promise<{
  snapshot: TranscriptLineSnapshot[];
  gpa: number | null;
  cgpa: number | null;
  totalCredits: number;
}> {
  const Result = mongoose.models.Result;
  if (!Result) {
    return { snapshot: [], gpa: null, cgpa: null, totalCredits: 0 };
  }

  const results = await Result.find({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    status: 'published',
    isDeleted: { $ne: true },
  }).lean();

  const Course = mongoose.models.Course;
  const snapshot: TranscriptLineSnapshot[] = [];
  let creditSum = 0;
  let weightedPoints = 0;
  let creditForGpa = 0;

  for (const r of results as any[]) {
    let courseCode = 'N/A';
    let courseTitle = 'Course';
    let credits = 0;
    if (Course && r.courseId) {
      const c = await Course.findById(r.courseId).select('code name credits').lean();
      if (c) {
        courseCode = (c as any).code || courseCode;
        courseTitle = (c as any).name || courseTitle;
        credits = Number((c as any).credits) || 0;
      }
    }

    const grade = r.letterGrade ?? r.grade ?? null;
    const gradePoints =
      r.gradePoints !== undefined && r.gradePoints !== null ? Number(r.gradePoints) : null;
    const marks = r.percentage ?? r.marksObtained ?? null;

    snapshot.push({
      courseId: idStr(r.courseId),
      courseCode,
      courseTitle,
      credits,
      grade,
      gradePoints,
      marks: marks !== null ? Number(marks) : null,
      termLabel: r.termLabel ?? null,
      resultStatus: r.status ?? 'published',
    });

    creditSum += credits;
    if (gradePoints !== null && credits > 0) {
      weightedPoints += gradePoints * credits;
      creditForGpa += credits;
    }
  }

  const gpa = creditForGpa > 0 ? Math.round((weightedPoints / creditForGpa) * 100) / 100 : null;
  return { snapshot, gpa, cgpa: gpa, totalCredits: creditSum };
}

export async function generateTranscript(
  tenantId: string,
  studentId: string,
  userId?: string
): Promise<TranscriptPublic> {
  const Student = mongoose.models.Student;
  if (!Student) throw new AppError(500, 'Student model unavailable', 'INTERNAL_ERROR');
  const student = await Student.findOne(baseFilter(tenantId, { _id: tid(studentId) }));
  if (!student) throw new AppError(404, 'Student not found', 'NOT_FOUND');

  const { snapshot, gpa, cgpa, totalCredits } = await buildSnapshotFromPublished(
    tenantId,
    studentId
  );
  if (!snapshot.length) {
    throw new AppError(
      400,
      'No published results found for this student',
      'NO_PUBLISHED_RESULTS'
    );
  }

  const doc = await Transcript.create({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    programId: (student as any).programId || null,
    batchId: (student as any).batchId || null,
    status: 'draft',
    snapshot,
    gpa,
    cgpa,
    totalCredits,
    createdBy: userId ? tid(userId) : null,
  });

  const name = await studentName(studentId);
  return mapTranscript(doc, { studentName: name });
}

export async function issueTranscript(
  tenantId: string,
  id: string,
  userId: string
): Promise<TranscriptPublic> {
  const doc = await Transcript.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Transcript not found', 'NOT_FOUND');
  if (doc.status === 'issued') return mapTranscript(doc, { studentName: await studentName(String(doc.studentId)) });
  if (doc.status === 'revoked') {
    throw new AppError(400, 'Cannot re-issue revoked transcript', 'INVALID_STATE');
  }

  const serial = serialFor('TR');
  const code = randomCode(24);
  const issuedAt = new Date();
  const snapHash = hashSnapshot(
    (doc.snapshot || []).map((s) => ({
      courseCode: s.courseCode,
      courseTitle: s.courseTitle,
      credits: s.credits,
      grade: s.grade,
      gradePoints: s.gradePoints,
      marks: s.marks,
    }))
  );
  const payload = `${tenantId}|${serial}|${doc.studentId}|transcript|${issuedAt.toISOString()}|${snapHash}`;
  const sig = signPayload(payload);

  doc.status = 'issued';
  doc.issuedAt = issuedAt;
  doc.issuedBy = tid(userId);
  doc.serialNumber = serial;
  doc.verificationCode = code;
  doc.digitalSignature = sig;
  await doc.save();

  return mapTranscript(doc, { studentName: await studentName(String(doc.studentId)) });
}

export async function revokeTranscript(
  tenantId: string,
  id: string,
  userId?: string
): Promise<TranscriptPublic> {
  const doc = await Transcript.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Transcript not found', 'NOT_FOUND');
  doc.status = 'revoked';
  doc.updatedBy = userId ? tid(userId) : null;
  await doc.save();
  return mapTranscript(doc);
}

export async function listTranscripts(
  tenantId: string,
  user: { id: string; roles: string[] },
  opts: { studentId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = baseFilter(tenantId);

  if (!isAdmin(user.roles)) {
    // student: only own
    const Student = mongoose.models.Student;
    if (!Student) return { items: [], total: 0 };
    const st = await Student.findOne({
      tenantId: tid(tenantId),
      userId: tid(user.id),
      isDeleted: { $ne: true },
    })
      .select('_id')
      .lean();
    if (!st) return { items: [], total: 0 };
    filter.studentId = (st as any)._id;
    filter.status = 'issued'; // students only see issued
  } else {
    if (opts.studentId) filter.studentId = tid(opts.studentId);
    if (opts.status) filter.status = opts.status;
  }

  const [docs, total] = await Promise.all([
    Transcript.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transcript.countDocuments(filter),
  ]);

  const items: TranscriptPublic[] = [];
  for (const d of docs) {
    items.push(mapTranscript(d, { studentName: await studentName(String(d.studentId)) }));
  }
  return { items, total };
}

export async function getTranscript(
  tenantId: string,
  user: { id: string; roles: string[] },
  id: string
): Promise<TranscriptPublic> {
  const doc = await Transcript.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Transcript not found', 'NOT_FOUND');

  if (!isAdmin(user.roles)) {
    const Student = mongoose.models.Student;
    const st = await Student?.findOne({
      tenantId: tid(tenantId),
      userId: tid(user.id),
      isDeleted: { $ne: true },
    })
      .select('_id')
      .lean();
    if (!st || String((st as any)._id) !== String(doc.studentId) || doc.status !== 'issued') {
      throw new AppError(403, 'Not allowed', 'FORBIDDEN');
    }
  }

  return mapTranscript(doc, { studentName: await studentName(String(doc.studentId)) });
}

// ─── Certificates ────────────────────────────────────────────────────────────

export async function createCertificate(
  tenantId: string,
  input: {
    studentId: string;
    type: CertificateType;
    title: string;
    body?: string | null;
    programName?: string | null;
    yearLabel?: string | null;
    classDivision?: string | null;
  },
  userId?: string
): Promise<CertificatePublic> {
  const Student = mongoose.models.Student;
  const student = await Student?.findOne(baseFilter(tenantId, { _id: tid(input.studentId) }));
  if (!student) throw new AppError(404, 'Student not found', 'NOT_FOUND');

  const doc = await Certificate.create({
    tenantId: tid(tenantId),
    studentId: tid(input.studentId),
    type: input.type,
    title: input.title.trim().slice(0, 300),
    body: input.body ?? null,
    programName: input.programName ?? null,
    yearLabel: input.yearLabel ?? null,
    classDivision: input.classDivision ?? null,
    status: 'draft',
    createdBy: userId ? tid(userId) : null,
  });

  return mapCertificate(doc, { studentName: await studentName(input.studentId) });
}

export async function issueCertificate(
  tenantId: string,
  id: string,
  userId: string
): Promise<CertificatePublic> {
  const doc = await Certificate.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Certificate not found', 'NOT_FOUND');
  if (doc.status === 'issued') {
    return mapCertificate(doc, { studentName: await studentName(String(doc.studentId)) });
  }
  if (doc.status === 'revoked') {
    throw new AppError(400, 'Cannot re-issue revoked certificate', 'INVALID_STATE');
  }

  const serial = serialFor(doc.type.toUpperCase().slice(0, 3));
  const code = randomCode(24);
  const issuedAt = new Date();
  const payload = `${tenantId}|${serial}|${doc.studentId}|${doc.type}|${issuedAt.toISOString()}|${doc.title}`;
  const sig = signPayload(payload);

  doc.status = 'issued';
  doc.issuedAt = issuedAt;
  doc.issuedBy = tid(userId);
  doc.serialNumber = serial;
  doc.verificationCode = code;
  doc.digitalSignature = sig;
  await doc.save();

  return mapCertificate(doc, { studentName: await studentName(String(doc.studentId)) });
}

export async function revokeCertificate(
  tenantId: string,
  id: string,
  userId?: string
): Promise<CertificatePublic> {
  const doc = await Certificate.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Certificate not found', 'NOT_FOUND');
  doc.status = 'revoked';
  doc.updatedBy = userId ? tid(userId) : null;
  await doc.save();
  return mapCertificate(doc);
}

export async function listCertificates(
  tenantId: string,
  user: { id: string; roles: string[] },
  opts: { studentId?: string; status?: string; page?: number; limit?: number } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = baseFilter(tenantId);

  if (!isAdmin(user.roles)) {
    const Student = mongoose.models.Student;
    const st = await Student?.findOne({
      tenantId: tid(tenantId),
      userId: tid(user.id),
      isDeleted: { $ne: true },
    })
      .select('_id')
      .lean();
    if (!st) return { items: [], total: 0 };
    filter.studentId = (st as any)._id;
    filter.status = 'issued';
  } else {
    if (opts.studentId) filter.studentId = tid(opts.studentId);
    if (opts.status) filter.status = opts.status;
  }

  const [docs, total] = await Promise.all([
    Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Certificate.countDocuments(filter),
  ]);

  const items: CertificatePublic[] = [];
  for (const d of docs) {
    items.push(mapCertificate(d, { studentName: await studentName(String(d.studentId)) }));
  }
  return { items, total };
}

/** Public verify — no auth; limited payload */
export async function publicVerify(code: string): Promise<VerificationPublicResult> {
  if (!code || code.length < 16) {
    return { valid: false, type: 'unknown', revoked: false };
  }

  const tr = await Transcript.findOne({ verificationCode: code, isDeleted: false }).lean();
  if (tr) {
    if (tr.status === 'revoked') {
      return {
        valid: false,
        type: 'transcript',
        serialNumber: tr.serialNumber ?? null,
        status: 'revoked',
        revoked: true,
        issuedAt: tr.issuedAt ?? null,
      };
    }
    if (tr.status !== 'issued' || !tr.digitalSignature) {
      return { valid: false, type: 'transcript', status: tr.status };
    }
    const snapHash = hashSnapshot(
      (tr.snapshot || []).map((s: any) => ({
        courseCode: s.courseCode,
        courseTitle: s.courseTitle,
        credits: s.credits,
        grade: s.grade,
        gradePoints: s.gradePoints,
        marks: s.marks,
      }))
    );
    const payload = `${tr.tenantId}|${tr.serialNumber}|${tr.studentId}|transcript|${new Date(tr.issuedAt!).toISOString()}|${snapHash}`;
    const ok = verifyHmac(payload, tr.digitalSignature.signature);
    const name = await studentName(String(tr.studentId));
    return {
      valid: ok,
      type: 'transcript',
      studentName: name,
      serialNumber: tr.serialNumber ?? null,
      issuedAt: tr.issuedAt ?? null,
      status: tr.status,
      revoked: false,
      summary: {
        gpa: tr.gpa ?? null,
        cgpa: tr.cgpa ?? null,
        totalCredits: tr.totalCredits ?? null,
        lineCount: (tr.snapshot || []).length,
      },
    };
  }

  const cert = await Certificate.findOne({ verificationCode: code, isDeleted: false }).lean();
  if (cert) {
    if (cert.status === 'revoked') {
      return {
        valid: false,
        type: cert.type,
        serialNumber: cert.serialNumber ?? null,
        status: 'revoked',
        revoked: true,
        issuedAt: cert.issuedAt ?? null,
      };
    }
    if (cert.status !== 'issued' || !cert.digitalSignature) {
      return { valid: false, type: cert.type, status: cert.status };
    }
    const payload = `${cert.tenantId}|${cert.serialNumber}|${cert.studentId}|${cert.type}|${new Date(cert.issuedAt!).toISOString()}|${cert.title}`;
    const ok = verifyHmac(payload, cert.digitalSignature.signature);
    const name = await studentName(String(cert.studentId));
    return {
      valid: ok,
      type: cert.type,
      studentName: name,
      programName: cert.programName ?? null,
      title: cert.title,
      serialNumber: cert.serialNumber ?? null,
      issuedAt: cert.issuedAt ?? null,
      status: cert.status,
      revoked: false,
    };
  }

  return { valid: false, type: 'unknown' };
}
