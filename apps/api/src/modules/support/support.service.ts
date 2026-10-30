import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  SupportTicket,
  SupportMessage,
  type ISupportTicket,
  type ISupportMessage,
} from './support.model';
import { Student } from '../students/student.model';
import type { SupportTicketPublic, SupportMessagePublic } from '@university-lms/shared';

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

function toTicket(d: ISupportTicket | Record<string, unknown>, studentName?: string | null, assigneeName?: string | null): SupportTicketPublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    studentId: String(x.studentId),
    category: x.category,
    subject: x.subject,
    description: x.description,
    priority: x.priority,
    status: x.status,
    assigneeId: idStr(x.assigneeId),
    assigneeName: assigneeName ?? null,
    attachments: x.attachments || [],
    escalationLevel: x.escalationLevel ?? 0,
    studentName: studentName ?? null,
    lastMessageAt: x.lastMessageAt ?? null,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function toMessage(d: ISupportMessage | Record<string, unknown>, authorName?: string | null): SupportMessagePublic {
  const x = d as any;
  return {
    id: String(x._id),
    tenantId: String(x.tenantId),
    ticketId: String(x.ticketId),
    authorId: String(x.authorId),
    authorName: authorName ?? null,
    body: x.body,
    isInternalNote: !!x.isInternalNote,
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

function isStaff(user: { roles: string[] }) {
  return user.roles.some((r) =>
    ['tenant_admin', 'university_admin', 'staff', 'super_admin', 'faculty'].includes(r)
  );
}

export async function createTicket(
  tenantId: string,
  body: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
    attachments?: Array<{ fileKey: string; fileName: string; mimeType?: string }>;
  },
  user: { id: string; roles: string[] }
) {
  const studentId = await resolveStudentId(tenantId, user);
  const doc = await SupportTicket.create({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    category: body.category,
    subject: body.subject,
    description: body.description,
    priority: body.priority || 'medium',
    status: 'open',
    attachments: body.attachments || [],
    escalationLevel: 0,
    lastMessageAt: new Date(),
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });
  // Seed first message from description
  await SupportMessage.create({
    tenantId: tid(tenantId),
    ticketId: doc._id,
    authorId: tid(user.id),
    body: body.description,
    isInternalNote: false,
    createdBy: tid(user.id),
  });
  return toTicket(doc);
}

export async function listTickets(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: {
    status?: string;
    category?: string;
    priority?: string;
    assigneeId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = q.page || 1;
  const limit = q.limit || 20;
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (!isStaff(user)) {
    const sid = await resolveStudentId(tenantId, user);
    filter.studentId = tid(sid);
  } else {
    if (q.studentId) filter.studentId = tid(q.studentId);
    if (q.assigneeId) filter.assigneeId = tid(q.assigneeId);
  }
  if (q.status) filter.status = q.status;
  if (q.category) filter.category = q.category;
  if (q.priority) filter.priority = q.priority;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);
  return { items: items.map((t) => toTicket(t)), total, page, limit };
}

export async function getTicket(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await SupportTicket.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Ticket not found');
  if (!isStaff(user)) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(doc.studentId) !== sid) throw new AppError(403, 'Not your ticket');
  }
  return toTicket(doc);
}

export async function updateTicket(
  tenantId: string,
  id: string,
  body: {
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    category?: string;
  },
  userId: string
) {
  const doc = await SupportTicket.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Ticket not found');
  if (body.status !== undefined) doc.status = body.status as any;
  if (body.priority !== undefined) doc.priority = body.priority as any;
  if (body.category !== undefined) doc.category = body.category as any;
  if (body.assigneeId !== undefined) {
    doc.assigneeId = body.assigneeId ? tid(body.assigneeId) : null;
  }
  doc.updatedBy = tid(userId);
  await doc.save();
  return toTicket(doc);
}

export async function escalateTicket(
  tenantId: string,
  id: string,
  note: string | null | undefined,
  userId: string
) {
  const doc = await SupportTicket.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Ticket not found');
  doc.escalationLevel = Math.min(5, (doc.escalationLevel || 0) + 1);
  if (doc.priority === 'low') doc.priority = 'medium';
  else if (doc.priority === 'medium') doc.priority = 'high';
  else if (doc.priority === 'high') doc.priority = 'urgent';
  if (doc.status === 'open') doc.status = 'in_progress';
  doc.updatedBy = tid(userId);
  await doc.save();
  if (note) {
    await SupportMessage.create({
      tenantId: tid(tenantId),
      ticketId: doc._id,
      authorId: tid(userId),
      body: `[Escalated to level ${doc.escalationLevel}] ${note}`,
      isInternalNote: true,
      createdBy: tid(userId),
    });
  }
  return toTicket(doc);
}

export async function listMessages(
  tenantId: string,
  ticketId: string,
  user: { id: string; roles: string[] }
) {
  const ticket = await SupportTicket.findOne(baseFilter(tenantId, { _id: tid(ticketId) })).lean();
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (!isStaff(user)) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(ticket.studentId) !== sid) throw new AppError(403, 'Not your ticket');
  }
  const filter: Record<string, unknown> = baseFilter(tenantId, { ticketId: tid(ticketId) });
  if (!isStaff(user)) {
    filter.isInternalNote = false;
  }
  const items = await SupportMessage.find(filter).sort({ createdAt: 1 }).lean();
  return { items: items.map((m) => toMessage(m)), ticket: toTicket(ticket) };
}

export async function addMessage(
  tenantId: string,
  ticketId: string,
  body: { body: string; isInternalNote?: boolean },
  user: { id: string; roles: string[] }
) {
  const ticket = await SupportTicket.findOne(baseFilter(tenantId, { _id: tid(ticketId) }));
  if (!ticket) throw new AppError(404, 'Ticket not found');
  const staff = isStaff(user);
  if (!staff) {
    const sid = await resolveStudentId(tenantId, user);
    if (String(ticket.studentId) !== sid) throw new AppError(403, 'Not your ticket');
    if (body.isInternalNote) throw new AppError(403, 'Students cannot post internal notes');
  }
  const msg = await SupportMessage.create({
    tenantId: tid(tenantId),
    ticketId: ticket._id,
    authorId: tid(user.id),
    body: body.body,
    isInternalNote: staff ? !!body.isInternalNote : false,
    createdBy: tid(user.id),
  });
  ticket.lastMessageAt = new Date();
  if (!staff && ticket.status === 'waiting_student') {
    ticket.status = 'in_progress';
  } else if (staff && !body.isInternalNote && ticket.status === 'open') {
    ticket.status = 'in_progress';
  } else if (staff && !body.isInternalNote) {
    ticket.status = 'waiting_student';
  }
  ticket.updatedBy = tid(user.id);
  await ticket.save();
  return toMessage(msg);
}
