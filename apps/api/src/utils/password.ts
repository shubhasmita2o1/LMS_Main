import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_EXPIRES_SECONDS,
  type TokenPayload,
  type SystemRole,
  type TenantId,
  type UserId,
} from '@university-lms/shared';
import { env } from '../config/env';

export function signAccessToken(payload: {
  sub: UserId;
  tenantId: TenantId | null;
  roles: SystemRole[];
}): string {
  const body: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: payload.sub,
    tenantId: payload.tenantId,
    roles: payload.roles,
    type: 'access',
  };
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: {
  sub: UserId;
  tenantId: TenantId | null;
  roles: SystemRole[];
}): string {
  const body: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: payload.sub,
    tenantId: payload.tenantId,
    roles: payload.roles,
    type: 'refresh',
  };
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(body, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

export function getAccessTokenExpiresInSeconds(): number {
  return ACCESS_TOKEN_EXPIRES_SECONDS;
}
