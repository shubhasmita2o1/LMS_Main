/**
 * First-run installation setup.
 *
 * Atomicity strategy (works without replica-set transactions):
 * 1. Refuse if already locked.
 * 2. Create Institution (unique partial index prevents concurrent doubles).
 * 3. Create Institution Super Admin bound to institution.tenantId.
 * 4. Lock installation only if still unlocked (findOneAndUpdate).
 * 5. If lock fails (concurrent winner), roll back created docs and return 409.
 *
 * No default / hardcoded credentials. Password is supplied by the installer.
 */
import { Types } from 'mongoose';
import { User } from '../users/user.model';
import { Institution } from '../institution/institution.model';
import {
  createInstitution,
  isInstallationLocked,
  lockInstallation,
  ensureInstallationDocument,
  type CreateInstitutionInput,
} from '../institution/institution.service';
import { hashPassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import type { CompleteSetupBody } from './setup.validation';

export interface SetupResult {
  institution: {
    id: string;
    tenantId: string;
    name: string;
    type: string;
  };
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  locked: true;
}

export async function completeSetup(input: CompleteSetupBody): Promise<SetupResult> {
  if (await isInstallationLocked()) {
    throw new AppError(403, 'Installation is already completed and locked.', 'INSTALLATION_LOCKED');
  }

  await ensureInstallationDocument();

  const institutionInput: CreateInstitutionInput = {
    name: input.institution.name,
    code: input.institution.code,
    type: input.institution.type,
    hierarchyConfig: input.institution.hierarchyConfig,
    featureToggles: input.institution.featureToggles,
  };

  let institution;
  try {
    institution = await createInstitution(institutionInput);
  } catch (err) {
    throw err;
  }

  const tenantId = institution.tenantId as Types.ObjectId;
  const email = input.admin.email.toLowerCase().trim();

  // Ensure no existing user with this email for this institution
  const existingUser = await User.findOne({
    email,
    isDeleted: false,
  }).lean();
  if (existingUser) {
    // Roll back institution if we just created it and cannot proceed
    await Institution.deleteOne({ _id: institution._id });
    throw new AppError(409, 'Email is already registered.', 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.admin.password);

  // Institution Super Admin:
  // Until the full Indian RBAC catalogue lands, tenant_admin is the
  // highest institutional role (broad manage permissions). tenantId is set
  // to the institution (never null — that was SaaS global Super Admin).
  const admin = await User.create({
    email,
    password: passwordHash,
    firstName: input.admin.firstName.trim(),
    lastName: input.admin.lastName.trim(),
    roles: ['tenant_admin'],
    permissions: [],
    tenantId,
    isEmailVerified: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
    isActive: true,
    loginHistory: [],
    refreshTokens: [],
  });

  const locked = await lockInstallation(institution._id as Types.ObjectId);
  if (!locked) {
    // Concurrent setup won the lock — roll back our writes
    await User.deleteOne({ _id: admin._id });
    await Institution.deleteOne({ _id: institution._id });
    throw new AppError(
      409,
      'Another setup process completed concurrently. Installation is locked.',
      'INSTALLATION_LOCKED'
    );
  }

  return {
    institution: {
      id: String(institution._id),
      tenantId: String(institution.tenantId),
      name: institution.name,
      type: institution.type,
    },
    admin: {
      id: String(admin._id),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      roles: admin.roles as string[],
    },
    locked: true,
  };
}
