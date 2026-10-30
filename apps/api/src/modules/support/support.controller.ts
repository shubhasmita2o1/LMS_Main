import { Request, Response, NextFunction } from 'express';
import * as svc from './support.service';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuerySchema,
  createMessageSchema,
  escalateSchema,
} from './support.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}
function userId(req: Request): string {
  return String(req.user?.id || '');
}
function currentUser(req: Request) {
  return { id: userId(req), roles: (req.user?.roles || []) as string[] };
}

export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTicketSchema.parse(req.body);
    const data = await svc.createTicket(tenantId(req), body, currentUser(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listTicketsQuerySchema.parse(req.query);
    const data = await svc.listTickets(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getTicket(tenantId(req), req.params.id, currentUser(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateTicketSchema.parse(req.body);
    const data = await svc.updateTicket(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function escalateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const body = escalateSchema.parse(req.body || {});
    const data = await svc.escalateTicket(tenantId(req), req.params.id, body.note, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.listMessages(tenantId(req), req.params.id, currentUser(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createMessageSchema.parse(req.body);
    const data = await svc.addMessage(tenantId(req), req.params.id, body, currentUser(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
