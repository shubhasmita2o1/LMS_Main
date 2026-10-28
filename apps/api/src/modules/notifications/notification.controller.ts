import { Request, Response, NextFunction } from 'express';
import * as svc from './notification.service';
import {
  listNotificationsQuerySchema,
  updatePreferencesSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deliveryLogsQuerySchema,
} from './notification.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}

function userId(req: Request): string {
  return String(req.user?.id || '');
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listNotificationsQuerySchema.parse(req.query);
    const result = await svc.listMyNotifications(tenantId(req), userId(req), {
      page: q.page,
      limit: q.limit,
      unreadOnly: q.unreadOnly,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await svc.unreadCount(tenantId(req), userId(req));
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.markRead(tenantId(req), userId(req), req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const modified = await svc.markAllRead(tenantId(req), userId(req));
    res.json({ success: true, data: { modified } });
  } catch (err) {
    next(err);
  }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getPreferences(tenantId(req), userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function patchPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updatePreferencesSchema.parse(req.body);
    const data = await svc.updatePreferences(tenantId(req), userId(req), body.preferences);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.listTemplates(tenantId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTemplateSchema.parse(req.body);
    const data = await svc.createTemplate(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateTemplateSchema.parse(req.body);
    const data = await svc.updateTemplate(tenantId(req), req.params.id, body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteTemplate(tenantId(req), req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

export async function listDeliveryLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const q = deliveryLogsQuerySchema.parse(req.query);
    const data = await svc.listDeliveryLogs(tenantId(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
