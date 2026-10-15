import { Request, Response, NextFunction } from 'express';
import * as svc from './quiz.service';
import {
  listQuizzesQuerySchema,
  quizCreateSchema,
  quizUpdateSchema,
  attachQuestionsSchema,
  saveAnswersSchema,
  gradeAttemptSchema,
} from './quiz.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantIdFrom(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  return id;
}

function userFrom(req: Request) {
  if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return { id: req.user.id, roles: req.user.roles || [] };
}

function ok(res: Response, data: unknown, message?: string, meta?: unknown) {
  res.status(200).json({ success: true, data, message, meta });
}

function created(res: Response, data: unknown, message?: string) {
  res.status(201).json({ success: true, data, message });
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuizzesQuerySchema.parse(req.query);
    const result = await svc.listQuizzes(tenantIdFrom(req), q, userFrom(req));
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

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = quizCreateSchema.parse(req.body);
    created(res, await svc.createQuiz(tenantIdFrom(req), body, userFrom(req)), 'Quiz created');
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getQuiz(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = quizUpdateSchema.parse(req.body);
    ok(res, await svc.updateQuiz(tenantIdFrom(req), req.params.id, body, userFrom(req)), 'Updated');
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.softDeleteQuiz(tenantIdFrom(req), req.params.id, userFrom(req)), 'Deleted');
  } catch (e) {
    next(e);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.publishQuiz(tenantIdFrom(req), req.params.id, userFrom(req)), 'Published');
  } catch (e) {
    next(e);
  }
}

export async function attachQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const body = attachQuestionsSchema.parse(req.body);
    ok(
      res,
      await svc.attachQuestions(tenantIdFrom(req), req.params.id, body.questions, userFrom(req)),
      'Questions attached'
    );
  } catch (e) {
    next(e);
  }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.startAttempt(tenantIdFrom(req), req.params.id, userFrom(req), {
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
    created(res, result, 'Attempt started');
  } catch (e) {
    next(e);
  }
}

export async function myAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.myAttempts(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.listAttempts(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await svc.getAttempt(tenantIdFrom(req), req.params.id, userFrom(req)));
  } catch (e) {
    next(e);
  }
}

export async function saveAnswers(req: Request, res: Response, next: NextFunction) {
  try {
    const body = saveAnswersSchema.parse(req.body);
    ok(
      res,
      await svc.saveAnswers(tenantIdFrom(req), req.params.id, body.answers, userFrom(req)),
      'Saved'
    );
  } catch (e) {
    next(e);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await svc.submitAttempt(tenantIdFrom(req), req.params.id, userFrom(req)),
      'Submitted'
    );
  } catch (e) {
    next(e);
  }
}

export async function grade(req: Request, res: Response, next: NextFunction) {
  try {
    const body = gradeAttemptSchema.parse(req.body);
    ok(
      res,
      await svc.gradeAttempt(tenantIdFrom(req), req.params.id, body, userFrom(req)),
      'Graded'
    );
  } catch (e) {
    next(e);
  }
}
