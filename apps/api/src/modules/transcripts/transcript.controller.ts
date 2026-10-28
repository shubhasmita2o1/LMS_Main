import { Request, Response, NextFunction } from 'express';
import * as svc from './transcript.service';
import {
  generateTranscriptSchema,
  createCertificateSchema,
  listQuerySchema,
} from './transcript.validation';

function tenantId(req: Request): string {
  return String(req.tenantId || (req as any).tenant?._id || '');
}
function userId(req: Request): string {
  return String(req.user?.id || '');
}
function currentUser(req: Request) {
  return { id: userId(req), roles: (req.user?.roles || []) as string[] };
}

export async function listTranscripts(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const data = await svc.listTranscripts(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getTranscript(tenantId(req), currentUser(req), req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function generateTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const body = generateTranscriptSchema.parse(req.body);
    const data = await svc.generateTranscript(tenantId(req), body.studentId, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function issueTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.issueTranscript(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function revokeTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.revokeTranscript(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listCertificates(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const data = await svc.listCertificates(tenantId(req), currentUser(req), q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createCertificateSchema.parse(req.body);
    const data = await svc.createCertificate(tenantId(req), body, userId(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function issueCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.issueCertificate(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function revokeCertificate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.revokeCertificate(tenantId(req), req.params.id, userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function publicVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.publicVerify(req.params.code);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
