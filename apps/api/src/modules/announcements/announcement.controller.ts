import { Request, Response, NextFunction } from 'express';
import * as svc from './announcement.service';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsQuerySchema,
} from './announcement.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}

function currentUser(req: Request) {
  return {
    id: String(req.user?.id || ''),
    roles: (req.user?.roles || []) as string[],
  };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listAnnouncementsQuerySchema.parse(req.query);
    const result = await svc.listForUser(tenantId(req), currentUser(req), q);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getById(tenantId(req), currentUser(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createAnnouncementSchema.parse(req.body);
    const data = await svc.create(tenantId(req), currentUser(req), body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateAnnouncementSchema.parse(req.body);
    const data = await svc.update(tenantId(req), currentUser(req), req.params.id, body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.publish(tenantId(req), currentUser(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.archive(tenantId(req), currentUser(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
