import { Request, Response, NextFunction } from 'express';
import * as svc from './library.service';
import {
  listItemsQuerySchema,
  createItemSchema,
  updateItemSchema,
  createLoanSchema,
  returnLoanSchema,
  createReservationSchema,
  listLoansQuerySchema,
  listFinesQuerySchema,
  waiveFineSchema,
} from './library.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}
function userId(req: Request): string {
  return String(req.user?.id || '');
}
function currentUser(req: Request) {
  return { id: userId(req), roles: (req.user?.roles || []) as string[] };
}

export async function listItems(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listItemsQuerySchema.parse(req.query);
    const data = await svc.listItems(tenantId(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getItem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getItem(tenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createItemSchema.parse(req.body);
    const data = await svc.createItem(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateItemSchema.parse(req.body);
    const data = await svc.updateItem(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.deleteItem(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createLoanSchema.parse(req.body);
    const data = await svc.createLoan(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function returnLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const body = returnLoanSchema.parse(req.body || {});
    const data = await svc.returnLoan(tenantId(req), req.params.id, body, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listLoans(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listLoansQuerySchema.parse(req.query);
    const data = await svc.listLoans(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createReservationSchema.parse(req.body);
    const data = await svc.createReservation(tenantId(req), body, currentUser(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function cancelReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.cancelReservation(tenantId(req), req.params.id, currentUser(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listLoansQuerySchema.parse(req.query);
    const data = await svc.listReservations(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listFines(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listFinesQuerySchema.parse(req.query);
    const data = await svc.listFines(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function waiveFine(req: Request, res: Response, next: NextFunction) {
  try {
    const body = waiveFineSchema.parse(req.body || {});
    const data = await svc.waiveFine(tenantId(req), req.params.id, body.reason, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function refreshOverdue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.refreshOverdue(tenantId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
