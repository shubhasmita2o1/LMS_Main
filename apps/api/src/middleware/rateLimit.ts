/**
 * Simple in-memory rate limiter skeleton for Phase 1.
 * Replace with Redis-backed limiter (e.g. rate-limiter-flexible) before production scale.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator = (req) => req.ip || 'unknown' } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      next(
        new AppError(429, 'Too many requests, please try again later', 'RATE_LIMIT_EXCEEDED')
      );
      return;
    }

    next();
  };
}

/** Default API rate limit: 100 requests per minute per IP */
export const defaultApiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
