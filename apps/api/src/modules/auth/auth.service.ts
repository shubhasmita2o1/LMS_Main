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
import { env } from '../../config/env';
import {
  sendEmail,
  verificationEmailHtml,
  passwordResetEmailHtml,
} from '../../services/email.service';

const EMAIL_VERIFY_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

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

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Eligibility for issuing access/refresh tokens */
export function assertLoginEligible(user: IUser): void {
  if (user.isDeleted) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(423, 'Account temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
  }
  if (!user.isEmailVerified) {
    throw new AppError(
      403,
      'Please verify your email before signing in. Check your inbox for the verification link.',
      'EMAIL_NOT_VERIFIED'
    );
  }
  if (user.approvalStatus === 'pending') {
    throw new AppError(
      403,
      'Your account is awaiting administrator approval.',
      'APPROVAL_PENDING'
    );
  }
  if (user.approvalStatus === 'rejected') {
    throw new AppError(
      403,
      'Your registration was not approved. Contact your administrator for details.',
      'APPROVAL_REJECTED'
    );
  }
  if (!user.isActive) {
    throw new AppError(403, 'Account is deactivated', 'ACCOUNT_INACTIVE');
  }
  if (user.approvalStatus !== 'approved') {
    throw new AppError(403, 'Account is not approved for access', 'APPROVAL_PENDING');
  }
}

/**
 * Public registration — never creates super_admin, never trusts client role/tenantId,
 * never issues tokens. Account is pending + unverified + inactive.
 */
export async function registerUser(
  input: RegisterBody,
  _meta: { ip?: string; userAgent?: string }
): Promise<{ email: string; message: string }> {
  const email = input.email.toLowerCase().trim();

  // Global uniqueness for public registrations (no tenant yet)
  const existing = await User.findOne({
    email,
    isDeleted: false,
  });
  if (existing) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);
  const rawVerifyToken = generateSecureToken();
  const tokenHash = hashToken(rawVerifyToken);

  const user = await User.create({
    email,
    password: passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: [], // assigned only on admin approval
    permissions: [],
    tenantId: null,
    organizationName: input.organizationName?.trim() || null,
    isEmailVerified: false,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    isActive: false,
    loginHistory: [],
    refreshTokens: [],
  });

  const verifyUrl = `${env.APP_URL.replace(/\/$/, '')}/verify-email?token=${rawVerifyToken}`;

  try {
    await sendEmail({
      to: email,
      subject: 'Verify your University LMS email',
      html: verificationEmailHtml({ firstName: user.firstName, verifyUrl }),
      text: `Hi ${user.firstName}, verify your email: ${verifyUrl}`,
    });
  } catch (err) {
    // In production without email config, surface failure; in dev sendEmail already logs
    if (env.NODE_ENV === 'production' && env.EMAIL_PROVIDER_API_KEY) {
      // roll back user so they can retry cleanly
      await User.deleteOne({ _id: user._id });
      throw new AppError(503, 'Unable to send verification email. Try again later.', 'EMAIL_SEND_FAILED');
    }
    // Dev without provider: email was logged; keep the user
    if (env.NODE_ENV === 'production' && !env.EMAIL_PROVIDER_API_KEY) {
      await User.deleteOne({ _id: user._id });
      throw new AppError(503, 'Email provider not configured', 'EMAIL_SEND_FAILED');
    }
  }

  return {
    email,
    message:
      'Registration successful. Please check your email to verify your address. After verification, an administrator must approve your account before you can sign in.',
  };
}

export async function verifyEmail(rawToken: string): Promise<{ message: string }> {
  if (!rawToken?.trim()) {
    throw new AppError(400, 'Verification token is required', 'VALIDATION_ERROR');
  }
  const tokenHash = hashToken(rawToken.trim());
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    isDeleted: false,
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) {
    throw new AppError(400, 'Invalid or expired verification link', 'INVALID_VERIFICATION_TOKEN');
  }

  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    throw new AppError(400, 'Verification link has expired. Request a new one.', 'VERIFICATION_EXPIRED');
  }

  if (user.isEmailVerified) {
    // Idempotent success for already-verified
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();
    return {
      message:
        'Email already verified. Your account is awaiting administrator approval before you can sign in.',
    };
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  // approval and isActive remain pending / false
  await user.save();

  return {
    message:
      'Email verified successfully. Your account is awaiting administrator approval. You will be able to sign in once your account is approved and activated.',
  };
}

export async function resendVerification(emailRaw: string): Promise<{ message: string }> {
  const email = emailRaw.toLowerCase().trim();
  const generic =
    'If an account exists and requires verification, a new email has been sent.';

  const user = await User.findOne({ email, isDeleted: false }).select(
    '+emailVerificationTokenHash +emailVerificationExpires'
  );
  if (!user || user.isEmailVerified) {
    return { message: generic };
  }

  const rawToken = generateSecureToken();
  user.emailVerificationTokenHash = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
  await user.save();

  const verifyUrl = `${env.APP_URL.replace(/\/$/, '')}/verify-email?token=${rawToken}`;
  try {
    await sendEmail({
      to: email,
      subject: 'Verify your University LMS email',
      html: verificationEmailHtml({ firstName: user.firstName, verifyUrl }),
      text: `Hi ${user.firstName}, verify your email: ${verifyUrl}`,
    });
  } catch {
    // still return generic
  }
  return { message: generic };
}

export async function loginUser(
  input: LoginBody,
  meta: { ip?: string; userAgent?: string }
): Promise<LoginResponse> {
  const email = input.email.toLowerCase().trim();

  let user: IUser | null = null;

  if (input.tenantId && mongoose.Types.ObjectId.isValid(input.tenantId)) {
    user = await User.findOne({
      email,
      tenantId: new mongoose.Types.ObjectId(input.tenantId),
      isDeleted: false,
    }).select('+password +refreshTokens');
  } else {
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

  const invalidCreds = () =>
    new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  if (!user) {
    throw invalidCreds();
  }

  // Lock check before password to avoid unnecessary work, but still generic for missing users
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(423, 'Account temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
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

  // Lifecycle gates (after password so we don't leak which accounts exist via verification-only errors for wrong emails)
  assertLoginEligible(user);

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
  const tokenHash = hashToken(refreshToken);

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

  const tokenHash = hashToken(refreshToken);

  const user = await User.findOne({
    _id: payload.sub,
    isDeleted: false,
  }).select('+refreshTokens');

  if (!user) {
    throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  try {
    assertLoginEligible(user);
  } catch (err) {
    // Clear sessions if suspended/unapproved
    user.refreshTokens = [];
    await user.save();
    throw err;
  }

  const stored = (user.refreshTokens || []).find(
    (t) => t.token === tokenHash && t.expiresAt > new Date()
  );
  if (!stored) {
    throw new AppError(401, 'Refresh token revoked or expired', 'INVALID_REFRESH_TOKEN');
  }

  user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== tokenHash);
  await user.save();

  return issueTokens(user, meta);
}

export async function logoutUser(userId: string, refreshToken?: string): Promise<void> {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
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
  if (!user) {
    throw new AppError(401, 'User not found', 'UNAUTHORIZED');
  }
  assertLoginEligible(user);
  return toAuthUser(user);
}

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
  const msg = 'If an account exists, a reset link has been sent.';

  if (!user) return { message: msg };

  const raw = generateSecureToken();
  user.passwordResetToken = hashToken(raw);
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${raw}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your University LMS password',
      html: passwordResetEmailHtml({ firstName: user.firstName, resetUrl }),
      text: `Hi ${user.firstName}, reset your password: ${resetUrl}`,
    });
  } catch {
    // generic response always
  }

  return { message: msg };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = hashToken(token);
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
  user.refreshTokens = [];
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();
}
