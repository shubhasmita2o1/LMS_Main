import { Request, Response, NextFunction } from 'express';
import * as service from './exam.service';
import {
  createExamSchema,
  updateExamSchema,
  attachQuestionsSchema,
  allocateStudentsSchema,
  invigilatorSchema,
  createCenterSchema,
  updateCenterSchema,
  saveAnswersSchema,
  flagQuestionSchema,
  suspicionEventSchema,
  manualScoreSchema,
  listExamsQuerySchema,
} from './exam.validation';

function tenantId(req: Request): string {
  return String((req as any).tenantId || (req as any).user?.tenantId);
}

function userId(req: Request): string {
  return String((req as any).user?.id || (req as any).user?._id);
}

function role(req: Request): string {
  return String((req as any).user?.role || '');
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listExamsQuerySchema.parse(req.query);
    const isStudent = role(req) === 'student';
    const result = isStudent
      ? await service.listMyExams(tenantId(req), userId(req))
      : await service.listExams(tenantId(req), q);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const r = role(req);
    let studentId: string | undefined;
    if (r === 'student') {
      const { resolveStudentId } = await import('../learn/learn.service');
      studentId = await resolveStudentId(tenantId(req), userId(req));
    }
    const data = await service.getExam(tenantId(req), req.params.id, {
      includeKeys: r !== 'student',
      role: r,
      studentId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createExamSchema.parse(req.body);
    const data = await service.createExam(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateExamSchema.parse(req.body);
    const data = await service.updateExam(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.publishExam(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function close(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.closeExam(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function attachQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const body = attachQuestionsSchema.parse(req.body);
    const data = await service.attachQuestions(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function allocate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = allocateStudentsSchema.parse(req.body);
    const data = await service.allocateStudents(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listAllocations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAllocations(tenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function addInvigilator(req: Request, res: Response, next: NextFunction) {
  try {
    const body = invigilatorSchema.parse(req.body);
    const data = await service.addInvigilator(tenantId(req), req.params.id, body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listInvigilators(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listInvigilators(tenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAttempts(tenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function manualScore(req: Request, res: Response, next: NextFunction) {
  try {
    const body = manualScoreSchema.parse(req.body);
    const data = await service.manualScore(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      body,
      userId(req)
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// Centers
export async function listCenters(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listCenters(tenantId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function createCenter(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createCenterSchema.parse(req.body);
    const data = await service.createCenter(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function updateCenter(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateCenterSchema.parse(req.body);
    const data = await service.updateCenter(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function deleteCenter(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.deleteCenter(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

// Student flow
export async function myExams(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listMyExams(tenantId(req), userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getPaper(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getPaper(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function startAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.startAttempt(tenantId(req), req.params.id, userId(req), {
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function saveAnswers(req: Request, res: Response, next: NextFunction) {
  try {
    const body = saveAnswersSchema.parse(req.body);
    const data = await service.saveAnswers(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      userId(req),
      body
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function flagQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const body = flagQuestionSchema.parse(req.body);
    const data = await service.flagQuestion(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      userId(req),
      body
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function submitAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.submitAttempt(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      userId(req)
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function suspicionEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const body = suspicionEventSchema.parse(req.body);
    const data = await service.logSuspicionEvent(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      userId(req),
      body
    );
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getResult(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getAttemptResult(
      tenantId(req),
      req.params.id,
      req.params.attemptId,
      userId(req),
      role(req)
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}
