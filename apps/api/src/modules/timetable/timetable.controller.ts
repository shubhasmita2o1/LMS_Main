import { Request, Response, NextFunction } from 'express';
import * as svc from './timetable.service';
import {
  createRoomSchema,
  updateRoomSchema,
  createEntrySchema,
  updateEntrySchema,
  listEntriesQuerySchema,
  conflictCheckSchema,
  substituteSchema,
} from './timetable.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}
function userId(req: Request): string {
  return String(req.user?.id || '');
}
function currentUser(req: Request) {
  return { id: userId(req), roles: (req.user?.roles || []) as string[] };
}

export async function listRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.listRooms(tenantId(req), {
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
      isActive:
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createRoomSchema.parse(req.body);
    const data = await svc.createRoom(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateRoomSchema.parse(req.body);
    const data = await svc.updateRoom(tenantId(req), req.params.id, body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteRoom(tenantId(req), req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

export async function listEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listEntriesQuerySchema.parse(req.query);
    const data = await svc.listEntries(tenantId(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createEntrySchema.parse(req.body);
    const data = await svc.createEntry(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateEntrySchema.parse(req.body);
    const data = await svc.updateEntry(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.softDeleteEntry(tenantId(req), req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

export async function cancelEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.cancelEntry(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function substituteEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const body = substituteSchema.parse(req.body);
    const data = await svc.substituteEntry(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checkConflicts(req: Request, res: Response, next: NextFunction) {
  try {
    const body = conflictCheckSchema.parse(req.body);
    const conflicts = await svc.checkConflicts(tenantId(req), body);
    res.json({ success: true, data: { conflicts } });
  } catch (err) {
    next(err);
  }
}

export async function calendarMe(req: Request, res: Response, next: NextFunction) {
  try {
    const dayOfWeek =
      req.query.dayOfWeek !== undefined ? Number(req.query.dayOfWeek) : undefined;
    const data = await svc.calendarMe(tenantId(req), currentUser(req), {
      dayOfWeek: Number.isFinite(dayOfWeek) ? dayOfWeek : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
