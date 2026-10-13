import { Request, Response, NextFunction } from 'express';
import * as svc from './learn.service';
import {
  progressUpdateSchema,
  noteCreateSchema,
  noteUpdateSchema,
  bookmarkCreateSchema,
  liveClassCreateSchema,
  liveClassUpdateSchema,
  completeLiveClassSchema,
  attachContentSchema,
  listLiveClassesQuerySchema,
} from './learn.validation';
import { AppError } from '../../middleware/errorHandler';

function tenantIdFrom(req: Request): string {
  const id = req.tenantId || req.user?.tenantId;
  if (!id) throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
  return id;
}

function userFrom(req: Request) {
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  return req.user;
}

function ok(res: Response, data: unknown, message?: string) {
  res.status(200).json({ success: true, data, message });
}

function created(res: Response, data: unknown, message?: string) {
  res.status(201).json({ success: true, data, message });
}

export async function myCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.listMyCourses(tenantIdFrom(req), user.id));
  } catch (e) {
    next(e);
  }
}

export async function courseOutline(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.getCourseLearnOutline(tenantIdFrom(req), req.params.id, user));
  } catch (e) {
    next(e);
  }
}

export async function lessonDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.getLessonDetail(tenantIdFrom(req), req.params.id, user));
  } catch (e) {
    next(e);
  }
}

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = progressUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateLessonProgress(tenantIdFrom(req), req.params.id, user.id, body),
      'Progress updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function courseProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.getMyCourseProgress(tenantIdFrom(req), req.params.id, user.id));
  } catch (e) {
    next(e);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = noteCreateSchema.parse(req.body);
    created(
      res,
      await svc.createNote(tenantIdFrom(req), req.params.id, user.id, body.body),
      'Note created'
    );
  } catch (e) {
    next(e);
  }
}

export async function listNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.listNotesForLesson(tenantIdFrom(req), req.params.id, user.id));
  } catch (e) {
    next(e);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = noteUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateNote(tenantIdFrom(req), req.params.id, user.id, body.body),
      'Note updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.deleteNote(tenantIdFrom(req), req.params.id, user.id), 'Note deleted');
  } catch (e) {
    next(e);
  }
}

export async function addBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = bookmarkCreateSchema.parse(req.body ?? {});
    created(
      res,
      await svc.addBookmark(tenantIdFrom(req), req.params.id, user.id, body.label),
      'Bookmark added'
    );
  } catch (e) {
    next(e);
  }
}

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.listBookmarksForCourse(tenantIdFrom(req), req.params.id, user.id));
  } catch (e) {
    next(e);
  }
}

export async function removeBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(
      res,
      await svc.removeBookmark(tenantIdFrom(req), req.params.id, user.id),
      'Bookmark removed'
    );
  } catch (e) {
    next(e);
  }
}

export async function createLiveClass(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = liveClassCreateSchema.parse(req.body);
    created(
      res,
      await svc.createLiveClass(tenantIdFrom(req), body, user.id),
      'Live class scheduled'
    );
  } catch (e) {
    next(e);
  }
}

export async function listLiveClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const q = listLiveClassesQuerySchema.parse(req.query);
    ok(res, await svc.listLiveClasses(tenantIdFrom(req), q, user));
  } catch (e) {
    next(e);
  }
}

export async function getLiveClass(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(res, await svc.getLiveClass(tenantIdFrom(req), req.params.id, user));
  } catch (e) {
    next(e);
  }
}

export async function updateLiveClass(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = liveClassUpdateSchema.parse(req.body);
    ok(
      res,
      await svc.updateLiveClass(tenantIdFrom(req), req.params.id, body, user.id),
      'Live class updated'
    );
  } catch (e) {
    next(e);
  }
}

export async function startLiveClass(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    ok(
      res,
      await svc.startLiveClass(tenantIdFrom(req), req.params.id, user.id),
      'Live class started'
    );
  } catch (e) {
    next(e);
  }
}

export async function completeLiveClass(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = completeLiveClassSchema.parse(req.body ?? {});
    ok(
      res,
      await svc.completeLiveClass(
        tenantIdFrom(req),
        req.params.id,
        user.id,
        body.recordingUrl ?? undefined
      ),
      'Live class completed'
    );
  } catch (e) {
    next(e);
  }
}

export async function uploadContent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    // Prefer multipart if middleware attached a file; otherwise accept base64 JSON (MVP)
    const multipart = (req as any).file as
      | { buffer: Buffer; originalname: string; mimetype: string; size: number }
      | undefined;

    let file: { buffer: Buffer; originalname: string; mimetype: string; size: number };

    if (multipart) {
      file = multipart;
    } else {
      const { fileName, mimeType, base64 } = req.body || {};
      if (!fileName || !base64) {
        throw new AppError(
          400,
          'Provide multipart file or JSON { fileName, mimeType, base64 }',
          'VALIDATION_ERROR'
        );
      }
      const buffer = Buffer.from(String(base64).replace(/^data:[^;]+;base64,/, ''), 'base64');
      file = {
        buffer,
        originalname: String(fileName),
        mimetype: String(mimeType || 'application/octet-stream'),
        size: buffer.length,
      };
    }

    created(
      res,
      await svc.uploadContent(tenantIdFrom(req), file, user.id),
      'File uploaded'
    );
  } catch (e) {
    next(e);
  }
}

export async function attachContent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = userFrom(req);
    const body = attachContentSchema.parse(req.body);
    ok(
      res,
      await svc.attachLessonContent(tenantIdFrom(req), req.params.id, body, user.id),
      'Content attached'
    );
  } catch (e) {
    next(e);
  }
}
