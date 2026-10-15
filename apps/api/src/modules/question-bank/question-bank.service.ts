import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  QBankSubject,
  QBankUnit,
  QBankTopic,
  Question,
} from './question-bank.model';
import type {
  QBankSubjectPublic,
  QBankUnitPublic,
  QBankTopicPublic,
  QuestionPublic,
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

function mapSubject(d: any): QBankSubjectPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    name: d.name,
    code: d.code ?? null,
    departmentId: idStr(d.departmentId),
    status: d.status,
    unitsCount: d.unitsCount,
    questionsCount: d.questionsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapUnit(d: any): QBankUnitPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    subjectId: String(d.subjectId),
    name: d.name,
    order: d.order ?? 0,
    status: d.status,
    topicsCount: d.topicsCount,
    questionsCount: d.questionsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapTopic(d: any): QBankTopicPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    unitId: String(d.unitId),
    subjectId: String(d.subjectId),
    name: d.name,
    order: d.order ?? 0,
    status: d.status,
    questionsCount: d.questionsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapQuestion(d: any): QuestionPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    subjectId: String(d.subjectId),
    unitId: idStr(d.unitId),
    topicId: idStr(d.topicId),
    type: d.type,
    stem: d.stem,
    richText: d.richText ?? null,
    options: (d.options || []).map((o: any) => ({
      key: o.key,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
    correctAnswer: d.correctAnswer ?? null,
    matchingPairs: (d.matchingPairs || []).map((p: any) => ({
      left: p.left,
      right: p.right,
    })),
    marks: d.marks,
    difficulty: d.difficulty,
    bloomLevel: d.bloomLevel ?? null,
    explanation: d.explanation ?? null,
    tags: d.tags || [],
    status: d.status,
    usageCount: d.usageCount ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export async function listSubjects(
  tenantId: string,
  q: { page: number; limit: number; search?: string; status?: string; departmentId?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.status) filter.status = q.status;
  if (q.departmentId) filter.departmentId = tid(q.departmentId);
  if (q.search) filter.name = { $regex: q.search, $options: 'i' };

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    QBankSubject.find(filter).sort({ name: 1 }).skip(skip).limit(q.limit).lean(),
    QBankSubject.countDocuments(filter),
  ]);

  return {
    items: items.map(mapSubject),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createSubject(
  tenantId: string,
  body: {
    name: string;
    code?: string | null;
    departmentId?: string | null;
    status?: string;
  },
  userId?: string
) {
  const doc = await QBankSubject.create({
    tenantId: tid(tenantId),
    name: body.name,
    code: body.code ?? null,
    departmentId: body.departmentId ? tid(body.departmentId) : null,
    status: body.status ?? 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapSubject(doc.toObject());
}

export async function updateSubject(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await QBankSubject.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Subject not found', 'NOT_FOUND');
  if (body.name !== undefined) doc.name = body.name as string;
  if (body.code !== undefined) doc.code = body.code as string | null;
  if (body.departmentId !== undefined)
    doc.departmentId = body.departmentId ? tid(body.departmentId as string) : null;
  if (body.status !== undefined) doc.status = body.status as any;
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapSubject(doc.toObject());
}

export async function deleteSubject(tenantId: string, id: string, userId?: string) {
  const doc = await QBankSubject.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Subject not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

// ─── Units ──────────────────────────────────────────────────────────────────

export async function listUnits(
  tenantId: string,
  q: { subjectId?: string; page: number; limit: number }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.subjectId) filter.subjectId = tid(q.subjectId);
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    QBankUnit.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(q.limit).lean(),
    QBankUnit.countDocuments(filter),
  ]);
  return {
    items: items.map(mapUnit),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createUnit(
  tenantId: string,
  body: { subjectId: string; name: string; order?: number; status?: string },
  userId?: string
) {
  const subject = await QBankSubject.findOne(baseFilter(tenantId, { _id: tid(body.subjectId) }));
  if (!subject) throw new AppError(404, 'Subject not found', 'NOT_FOUND');
  const doc = await QBankUnit.create({
    tenantId: tid(tenantId),
    subjectId: tid(body.subjectId),
    name: body.name,
    order: body.order ?? 0,
    status: body.status ?? 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapUnit(doc.toObject());
}

export async function updateUnit(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await QBankUnit.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Unit not found', 'NOT_FOUND');
  if (body.name !== undefined) doc.name = body.name as string;
  if (body.order !== undefined) doc.order = body.order as number;
  if (body.status !== undefined) doc.status = body.status as any;
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapUnit(doc.toObject());
}

export async function deleteUnit(tenantId: string, id: string, userId?: string) {
  const doc = await QBankUnit.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Unit not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

// ─── Topics ─────────────────────────────────────────────────────────────────

export async function listTopics(
  tenantId: string,
  q: { unitId?: string; subjectId?: string; page: number; limit: number }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.unitId) filter.unitId = tid(q.unitId);
  if (q.subjectId) filter.subjectId = tid(q.subjectId);
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    QBankTopic.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(q.limit).lean(),
    QBankTopic.countDocuments(filter),
  ]);
  return {
    items: items.map(mapTopic),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createTopic(
  tenantId: string,
  body: { unitId: string; name: string; order?: number; status?: string },
  userId?: string
) {
  const unit = await QBankUnit.findOne(baseFilter(tenantId, { _id: tid(body.unitId) }));
  if (!unit) throw new AppError(404, 'Unit not found', 'NOT_FOUND');
  const doc = await QBankTopic.create({
    tenantId: tid(tenantId),
    unitId: tid(body.unitId),
    subjectId: unit.subjectId,
    name: body.name,
    order: body.order ?? 0,
    status: body.status ?? 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapTopic(doc.toObject());
}

export async function updateTopic(
  tenantId: string,
  id: string,
  body: Record<string, unknown>,
  userId?: string
) {
  const doc = await QBankTopic.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Topic not found', 'NOT_FOUND');
  if (body.name !== undefined) doc.name = body.name as string;
  if (body.order !== undefined) doc.order = body.order as number;
  if (body.status !== undefined) doc.status = body.status as any;
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapTopic(doc.toObject());
}

export async function deleteTopic(tenantId: string, id: string, userId?: string) {
  const doc = await QBankTopic.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Topic not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

// ─── Questions ──────────────────────────────────────────────────────────────

export async function listQuestions(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    search?: string;
    subjectId?: string;
    unitId?: string;
    topicId?: string;
    type?: string;
    difficulty?: string;
    status?: string;
    tags?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.subjectId) filter.subjectId = tid(q.subjectId);
  if (q.unitId) filter.unitId = tid(q.unitId);
  if (q.topicId) filter.topicId = tid(q.topicId);
  if (q.type) filter.type = q.type;
  if (q.difficulty) filter.difficulty = q.difficulty;
  if (q.status) filter.status = q.status;
  if (q.tags) {
    const tags = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length) filter.tags = { $in: tags };
  }
  if (q.search) {
    filter.$or = [
      { stem: { $regex: q.search, $options: 'i' } },
      { tags: { $regex: q.search, $options: 'i' } },
    ];
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Question.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(q.limit).lean(),
    Question.countDocuments(filter),
  ]);

  return {
    items: items.map(mapQuestion),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getQuestion(tenantId: string, id: string) {
  const doc = await Question.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Question not found', 'NOT_FOUND');
  return mapQuestion(doc);
}

export async function createQuestion(
  tenantId: string,
  body: Record<string, any>,
  userId?: string
) {
  const subject = await QBankSubject.findOne(baseFilter(tenantId, { _id: tid(body.subjectId) }));
  if (!subject) throw new AppError(404, 'Subject not found', 'NOT_FOUND');

  const doc = await Question.create({
    tenantId: tid(tenantId),
    subjectId: tid(body.subjectId),
    unitId: body.unitId ? tid(body.unitId) : null,
    topicId: body.topicId ? tid(body.topicId) : null,
    type: body.type,
    stem: body.stem,
    richText: body.richText ?? null,
    options: body.options ?? [],
    correctAnswer: body.correctAnswer ?? null,
    matchingPairs: body.matchingPairs ?? [],
    marks: body.marks ?? 1,
    difficulty: body.difficulty ?? 'medium',
    bloomLevel: body.bloomLevel ?? null,
    explanation: body.explanation ?? null,
    tags: body.tags ?? [],
    status: body.status ?? 'active',
    createdBy: userId ? tid(userId) : null,
  });
  return mapQuestion(doc.toObject());
}

export async function updateQuestion(
  tenantId: string,
  id: string,
  body: Record<string, any>,
  userId?: string
) {
  const doc = await Question.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Question not found', 'NOT_FOUND');

  const fields = [
    'stem',
    'richText',
    'type',
    'options',
    'correctAnswer',
    'matchingPairs',
    'marks',
    'difficulty',
    'bloomLevel',
    'explanation',
    'tags',
    'status',
  ] as const;
  for (const f of fields) {
    if (body[f] !== undefined) (doc as any)[f] = body[f];
  }
  if (body.subjectId !== undefined) doc.subjectId = tid(body.subjectId);
  if (body.unitId !== undefined) doc.unitId = body.unitId ? tid(body.unitId) : null;
  if (body.topicId !== undefined) doc.topicId = body.topicId ? tid(body.topicId) : null;
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapQuestion(doc.toObject());
}

export async function deleteQuestion(tenantId: string, id: string, userId?: string) {
  const doc = await Question.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Question not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { id };
}

export async function importQuestions(
  tenantId: string,
  questions: Record<string, any>[],
  userId?: string
) {
  const created: QuestionPublic[] = [];
  for (const q of questions) {
    created.push(await createQuestion(tenantId, q, userId));
  }
  return { imported: created.length, items: created };
}

export async function exportQuestions(
  tenantId: string,
  q: {
    subjectId?: string;
    unitId?: string;
    topicId?: string;
    type?: string;
    difficulty?: string;
    status?: string;
  }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.subjectId) filter.subjectId = tid(q.subjectId);
  if (q.unitId) filter.unitId = tid(q.unitId);
  if (q.topicId) filter.topicId = tid(q.topicId);
  if (q.type) filter.type = q.type;
  if (q.difficulty) filter.difficulty = q.difficulty;
  if (q.status) filter.status = q.status;

  const items = await Question.find(filter).sort({ createdAt: 1 }).limit(2000).lean();
  return items.map(mapQuestion);
}

/** Increment usage when attached to a quiz */
export async function bumpUsageCount(tenantId: string, questionIds: string[]) {
  if (!questionIds.length) return;
  await Question.updateMany(
    baseFilter(tenantId, { _id: { $in: questionIds.map(tid) } }),
    { $inc: { usageCount: 1 } }
  );
}
