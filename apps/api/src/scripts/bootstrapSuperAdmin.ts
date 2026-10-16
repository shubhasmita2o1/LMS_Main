/**
 * Controlled Super Admin bootstrap (CLI only — not a public route).
 *
 * Usage:
 *   BOOTSTRAP_SA_EMAIL=admin@example.com BOOTSTRAP_SA_PASSWORD='StrongPass1' \
 *     npx tsx src/scripts/bootstrapSuperAdmin.ts
 *
 * Does not wipe existing super admins. Creates or upgrades the given email only.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { hashPassword } from '../utils/password';
import {
  SYSTEM_ROLE_PERMISSIONS,
  type SystemRole,
  type Permission,
} from '@university-lms/shared';

function permissionsForRoles(roles: SystemRole[]): Permission[] {
  const permissions = new Map<string, Permission>();
  for (const role of roles) {
    for (const permission of SYSTEM_ROLE_PERMISSIONS[role] || []) {
      const key = `${permission.resource}:${permission.action}`;
      if (!permissions.has(key)) {
        permissions.set(key, {
          resource: permission.resource as Permission['resource'],
          action: permission.action as Permission['action'],
        });
      }
    }
  }
  return Array.from(permissions.values());
}

async function main() {
  const email = (process.env.BOOTSTRAP_SA_EMAIL || '').toLowerCase().trim();
  const password = process.env.BOOTSTRAP_SA_PASSWORD || '';
  const firstName = process.env.BOOTSTRAP_SA_FIRST_NAME || 'System';
  const lastName = process.env.BOOTSTRAP_SA_LAST_NAME || 'Administrator';

  if (!email || !password) {
    console.error('Set BOOTSTRAP_SA_EMAIL and BOOTSTRAP_SA_PASSWORD');
    process.exit(1);
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('Password must be at least 8 chars with a letter and a number');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  const passwordHash = await hashPassword(password);
  const roles: SystemRole[] = ['super_admin'];
  const permissions = permissionsForRoles(roles);

  const existing = await User.findOne({ email, isDeleted: false }).select('+password');
  if (existing) {
    existing.roles = roles;
    existing.permissions = permissions;
    existing.tenantId = null;
    existing.isEmailVerified = true;
    existing.approvalStatus = 'approved';
    existing.approvedAt = new Date();
    existing.isActive = true;
    existing.password = passwordHash;
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    await existing.save();
    console.log(`✅ Upgraded existing user to super_admin: ${email}`);
  } else {
    await User.create({
      email,
      password: passwordHash,
      firstName,
      lastName,
      roles,
      permissions,
      tenantId: null,
      isEmailVerified: true,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      isActive: true,
      loginHistory: [],
      refreshTokens: [],
      isDeleted: false,
    });
    console.log(`✅ Created super_admin: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
