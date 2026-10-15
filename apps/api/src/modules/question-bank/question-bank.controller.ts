import { Request, Response, NextFunction } from 'express';
import * as svc from './question-bank.service';
import {
  listSubjectsQuerySchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  listUnitsQuerySchema,
  unitCreateSchema,
  unitUpdateSchema,
  listTopicsQuerySchema,
  topicCreateSchema,
  topicUpdateSchema,
  listQuestionsQuerySchema,
  questionCreateSchema,
  questionUpdateSchema,
  importQuestionsSchema,
} from './question-bank.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantIdFrom(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  return id;
}

function ok(res: Response, data: unknown, message?: string, meta?: unknown) {
  res.status(200).json({ success: true, data, message, meta });
}

function created(res: Response, data: unknown, message?: string) {
  res.status(201).json({ success: true, data, message });
}

// Subjects
export async function listSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listSubjectsQuerySchema.parse(req.query);
    const result = await svc.listSubjects(tenantIdFrom(req), q);
    ok(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    next(e);
  }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const body = subjectCreateSchema.parse(req.body);
    created(res, await svc.createSubject(tenantIdFrom(req), body, req.user?.id), 'Subject created');
  } catch (e) {
    next(e);
  }
}

export async function updateSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const body = subjectUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateSubject(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.deleteSubject(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Units
export async function listUnits(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listUnitsQuerySchema.parse(req.query);
    const result = await svc.listUnits(tenantIdFrom(req), q);
    ok(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    next(e);
  }
}

export async function createUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const body = unitCreateSchema.parse(req.body);
    created(res, await svc.createUnit(tenantIdFrom(req), body, req.user?.id), 'Unit created');
  } catch (e) {
    next(e);
  }
}

export async function updateUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const body = unitUpdateSchema.parse(req.body);
    ok(res, await svc.updateUnit(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteUnit(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.deleteUnit(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Topics
export async function listTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listTopicsQuerySchema.parse(req.query);
    const result = await svc.listTopics(tenantIdFrom(req), q);
    ok(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    next(e);
  }
}

export async function createTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const body = topicCreateSchema.parse(req.body);
    created(res, await svc.createTopic(tenantIdFrom(req), body, req.user?.id), 'Topic created');
  } catch (e) {
    next(e);
  }
}

export async function updateTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const body = topicUpdateSchema.parse(req.body);
    ok(res, await svc.updateTopic(tenantIdFrom(req), req.params.id, body, req.user?.id), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.deleteTopic(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

// Questions
export async function listQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuestionsQuerySchema.parse(req.query);
    const result = await svc.listQuestions(tenantIdFrom(req), q);
    ok(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    next(e);
  }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getQuestion(tenantIdFrom(req), req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = questionCreateSchema.parse(req.body);
    created(res, await svc.createQuestion(tenantIdFrom(req), body, req.user?.id), 'Question created');
  } catch (e) {
    next(e);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = questionUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateQuestion(tenantIdFrom(req), req.params.id, body, req.user?.id),
      'Updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.deleteQuestion(tenantIdFrom(req), req.params.id, req.user?.id), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function importQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const body = importQuestionsSchema.parse(req.body);
    created(
      res,
      await svc.importQuestions(tenantIdFrom(req), body.questions, req.user?.id),
      'Questions imported'
    );
  } catch (e) {
    next(e);
  }
}

export async function exportQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuestionsQuerySchema
      .pick({
        subjectId: true,
        unitId: true,
        topicId: true,
        type: true,
        difficulty: true,
        status: true,
      })
      .parse(req.query);
    ok(res, await svc.exportQuestions(tenantIdFrom(req), q));
  } catch (e) {
    next(e);
  }
}
