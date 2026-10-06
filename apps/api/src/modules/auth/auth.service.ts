import crypto from 'crypto';
import {
  type AuthUser,
  type AuthTokens,
  type LoginResponse,
  type Permission,
  type SystemRole,
  SYSTEM_ROLE_PERMISSIONS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  REFRESH_TOKEN_EXPIRES_IN,
} from '@university-lms/shared';
import { User, type IUser } from '../users/user.model';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiresInSeconds,
} from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import type { RegisterBody, LoginBody } from './auth.validation';
import mongoose from 'mongoose';

function permissionsForRoles(roles: SystemRole[]): Permission[] {
  const set = new Map<string, Permission>();
  for (const role of roles) {
    for (const p of SYSTEM_ROLE_PERMISSIONS[role] || []) {
      const key = `${p.resource}:${p.action}`;
      if (!set.has(key)) {
        set.set(key, {
          resource: p.resource as Permission['resource'],
          action: p.action as Permission['action'],
        });
      }
    }
  }
  return Array.from(set.values());
}

function toAuthUser(user: IUser | Record<string, unknown>): AuthUser {
  const u = user as IUser;
  const roles = (u.roles || []) as SystemRole[];
  return {
    id: String(u._id),
    tenantId: u.tenantId ? String(u.tenantId) : null,
    email: u.email,
    roles,
    permissions: (u.permissions?.length
      ? u.permissions
      : permissionsForRoles(roles)) as Permission[],
    firstName: u.firstName,
    lastName: u.lastName,
  };
}

function parseRefreshExpiry(): Date {
  // REFRESH_TOKEN_EXPIRES_IN is like "7d"
  const match = /^(\d+)([dhms])$/.exec(REFRESH_TOKEN_EXPIRES_IN);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const ms =
    unit === 'd'
      ? n * 24 * 60 * 60 * 1000
      : unit === 'h'
        ? n * 60 * 60 * 1000
        : unit === 'm'
          ? n * 60 * 1000
          : n * 1000;
  return new Date(now + ms);
}

export async function registerUser(
  input: RegisterBody,
  meta: { ip?: string; userAgent?: string }
): Promise<LoginResponse> {
  const existingCount = await User.countDocuments({ isDeleted: false });
  const isFirstUser = existingCount === 0;

  let roles: SystemRole[];
  let tenantId: mongoose.Types.ObjectId | null = null;

  if (isFirstUser) {
    // Bootstrap: first user becomes super_admin
    roles = ['super_admin'];
    tenantId = null;
  } else {
    // Controlled registration — only tenant_admin or similar when allowed
    const requestedRole = (input.role || 'tenant_admin') as SystemRole;
    if (requestedRole === 'super_admin') {
      throw new AppError(403, 'Cannot self-register as super_admin', 'FORBIDDEN');
    }
    // For Phase 2: allow tenant_admin registration with optional tenantId
    // (Phase 3 will gate this behind Super Admin / invite flow)
    if (!['tenant_admin', 'university_admin', 'faculty', 'student', 'staff'].includes(requestedRole)) {
      throw new AppError(400, 'Invalid role for registration', 'VALIDATION_ERROR');
    }
        roles = [requestedRole];
    if (input.tenantId) {
      if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
        throw new AppError(400, 'Invalid tenantId', 'VALIDATION_ERROR');
      }
      tenantId = new mongoose.Types.ObjectId(input.tenantId);
    } else {
      // Generate a placeholder tenant ObjectId for demo tenant users (Phase 3 replaces with real Tenant)
      tenantId = new mongoose.Types.ObjectId();
    }
  }

  const email = input.email.toLowerCase().trim();

  const conflict = await User.findOne({
    email,
    tenantId: tenantId,
    isDeleted: false,
  });
  if (conflict) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  // Also block same email as existing super_admin
  if (tenantId === null) {
    const sa = await User.findOne({ email, tenantId: null, isDeleted: false });
    if (sa) throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);
  const permissions = permissionsForRoles(roles);

  const user = await User.create({
    email,
    password: passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    roles,
    permissions,
    tenantId,
    isEmailVerified: isFirstUser, // first user auto-verified
    isActive: true,
    loginHistory: [],
    refreshTokens: [],
  });

  const tokens = await issueTokens(user, meta);
  return { user: toAuthUser(user), tokens };
}

export async function loginUser(
  input: LoginBody,
  meta: { ip?: string; userAgent?: string }
): Promise<LoginResponse> {
  const email = input.email.toLowerCase().trim();

  // Build query: if tenantId provided, scope; else try super_admin then any
  let user: IUser | null = null;

  if (input.tenantId && mongoose.Types.ObjectId.isValid(input.tenantId)) {
    user = await User.findOne({
      email,
      tenantId: new mongoose.Types.ObjectId(input.tenantId),
      isDeleted: false,
    }).select('+password +refreshTokens');
  } else {
    // Prefer super_admin (tenantId null), else first matching active user
    user = await User.findOne({
      email,
      tenantId: null,
      isDeleted: false,
    }).select('+password +refreshTokens');

    if (!user) {
      user = await User.findOne({
        email,
        isDeleted: false,
      }).select('+password +refreshTokens');
    }
  }

  // Generic error — never reveal whether email exists
  const invalidCreds = () =>
    new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  if (!user) {
    throw invalidCreds();
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(423, 'Account temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  const valid = await comparePassword(input.password, user.password);
  if (!valid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.loginHistory = [
      ...(user.loginHistory || []).slice(-19),
      { at: new Date(), ip: meta.ip, userAgent: meta.userAgent, success: false },
    ];
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalidCreds();
  }

  // Success — reset lock
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  user.loginHistory = [
    ...(user.loginHistory || []).slice(-19),
    { at: new Date(), ip: meta.ip, userAgent: meta.userAgent, success: true },
  ];
  await user.save();

  const tokens = await issueTokens(user, meta);
  return { user: toAuthUser(user), tokens };
}

async function issueTokens(
  user: IUser,
  meta: { ip?: string; userAgent?: string }
): Promise<AuthTokens> {
  const roles = user.roles as SystemRole[];
  const tenantId = user.tenantId ? String(user.tenantId) : null;

  const accessToken = signAccessToken({
    sub: String(user._id),
    tenantId,
    roles,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    tenantId,
    roles,
  });

  const expiresAt = parseRefreshExpiry();

  // Store hashed refresh token for revocation capability
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Keep last 10 refresh tokens
  const existing = (user.refreshTokens || []).filter((t) => t.expiresAt > new Date());
  existing.push({
    token: tokenHash,
    expiresAt,
    createdAt: new Date(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });
  user.refreshTokens = existing.slice(-10);
  await user.save();

  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

export async function refreshTokens(
  refreshToken: string,
  meta: { ip?: string; userAgent?: string }
): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const user = await User.findOne({
    _id: payload.sub,
    isDeleted: false,
    isActive: true,
  }).select('+refreshTokens');

  if (!user) {
    throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const stored = (user.refreshTokens || []).find(
    (t) => t.token === tokenHash && t.expiresAt > new Date()
  );
  if (!stored) {
    throw new AppError(401, 'Refresh token revoked or expired', 'INVALID_REFRESH_TOKEN');
  }

  // Rotate: remove old, issue new
  user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== tokenHash);
  await user.save();

  return issueTokens(user, meta);
}

export async function logoutUser(
  userId: string,
  refreshToken?: string
): Promise<void> {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== tokenHash);
  } else {
    user.refreshTokens = [];
  }
  await user.save();
}

export async function logoutAll(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user || !user.isActive) {
    throw new AppError(401, 'User not found', 'UNAUTHORIZED');
  }
  return toAuthUser(user);
}

/** Password reset — architecture ready (email mock) */
export async function requestPasswordReset(
  email: string,
  tenantId?: string
): Promise<{ message: string }> {
  const query: Record<string, unknown> = {
    email: email.toLowerCase().trim(),
    isDeleted: false,
  };
  if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
    query.tenantId = new mongoose.Types.ObjectId(tenantId);
  }

  const user = await User.findOne(query).select('+passwordResetToken +passwordResetExpires');
  // Always return same message
  const msg = 'If an account exists, a reset link has been sent.';

  if (!user) return { message: msg };

  const raw = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(raw).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  // Phase 2: log token for dev (replace with email service)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Password reset token for ${email}: ${raw}`);
  }

  return { message: msg };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
    isDeleted: false,
  }).select('+password +passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) {
    throw new AppError(400, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  user.password = await hashPassword(newPassword);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = []; // force re-login
  await user.save();
}
