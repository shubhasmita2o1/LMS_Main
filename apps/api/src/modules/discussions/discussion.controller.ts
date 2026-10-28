import { Request, Response, NextFunction } from 'express';
import * as svc from './discussion.service';
import {
  createThreadSchema,
  createReplySchema,
  createReportSchema,
  listThreadsQuerySchema,
  listReportsQuerySchema,
  resolveReportSchema,
} from './discussion.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}

function currentUser(req: Request) {
  return {
    id: String(req.user?.id || ''),
    roles: (req.user?.roles || []) as string[],
  };
}

export async function listThreads(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listThreadsQuerySchema.parse(req.query);
    const result = await svc.listThreads(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      q
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getThread(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getThread(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      req.params.threadId
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createThread(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createThreadSchema.parse(req.body);
    const data = await svc.createThread(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      body
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createReply(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createReplySchema.parse(req.body);
    const data = await svc.createReply(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      req.params.threadId,
      body
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function lockThread(req: Request, res: Response, next: NextFunction) {
  try {
    const lock = req.body?.lock !== false;
    const data = await svc.lockThread(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      req.params.threadId,
      lock
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function pinThread(req: Request, res: Response, next: NextFunction) {
  try {
    const pin = req.body?.pin !== false;
    const data = await svc.pinThread(
      tenantId(req),
      currentUser(req),
      req.params.courseId,
      req.params.threadId,
      pin
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function hideReply(req: Request, res: Response, next: NextFunction) {
  try {
    const hide = req.body?.hide !== false;
    const data = await svc.hideReply(
      tenantId(req),
      currentUser(req),
      req.params.replyId,
      hide
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function markAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const isAnswer = req.body?.isAnswer !== false;
    const data = await svc.markAnswer(
      tenantId(req),
      currentUser(req),
      req.params.replyId,
      isAnswer
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createReportSchema.parse(req.body);
    const data = await svc.createReport(tenantId(req), currentUser(req), body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listReportsQuerySchema.parse(req.query);
    const data = await svc.listReports(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resolveReportSchema.parse(req.body);
    const data = await svc.resolveReport(
      tenantId(req),
      currentUser(req),
      req.params.reportId,
      body.status
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
