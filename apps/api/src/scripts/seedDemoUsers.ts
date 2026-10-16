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

const DEMO_USERS: Array<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: SystemRole[];
  tenantId: mongoose.Types.ObjectId | null;
}> = [
  {
    email: 'admin@university.edu',
    password: 'Password123!',
    firstName: 'System',
    lastName: 'Administrator',
    roles: ['super_admin'],
    tenantId: null,
  },
  {
    email: 'dean.mitchell@stanford.edu',
    password: 'Password123!',
    firstName: 'Dean',
    lastName: 'Mitchell',
    roles: ['tenant_admin'],
    tenantId: new mongoose.Types.ObjectId(),
  },
  {
    email: 'university.admin@stanford.edu',
    password: 'Password123!',
    firstName: 'University',
    lastName: 'Administrator',
    roles: ['university_admin'],
    tenantId: new mongoose.Types.ObjectId(),
  },
  {
    email: 'prof.jenkins@stanford.edu',
    password: 'Password123!',
    firstName: 'Professor',
    lastName: 'Jenkins',
    roles: ['faculty'],
    tenantId: new mongoose.Types.ObjectId(),
  },
  {
    email: 'alex.rivera@stanford.edu',
    password: 'Password123!',
    firstName: 'Alex',
    lastName: 'Rivera',
    roles: ['student'],
    tenantId: new mongoose.Types.ObjectId(),
  },
  {
    email: 'staff.demo@stanford.edu',
    password: 'Password123!',
    firstName: 'Demo',
    lastName: 'Staff',
    roles: ['staff'],
    tenantId: new mongoose.Types.ObjectId(),
  },
];

async function seedDemoUsers() {
  console.log('🌱 Starting demo user seed (approved + active)...');

  await mongoose.connect(env.MONGODB_URI);

  console.log('✅ MongoDB connected');

  for (const demoUser of DEMO_USERS) {
    const email = demoUser.email.toLowerCase().trim();

    const password = await hashPassword(demoUser.password);

    const permissions = permissionsForRoles(demoUser.roles);

    const existingUser = await User.findOne({
      email,
      isDeleted: false,
    }).select('+password +refreshTokens');

    if (existingUser) {
      existingUser.firstName = demoUser.firstName;
      existingUser.lastName = demoUser.lastName;
      existingUser.roles = demoUser.roles;
      existingUser.permissions = permissions;
      existingUser.tenantId = demoUser.tenantId;
      existingUser.isActive = true;
      existingUser.isEmailVerified = true;
      existingUser.approvalStatus = 'approved';
      existingUser.approvedAt = existingUser.approvedAt || new Date();
      existingUser.rejectionReason = null;
      existingUser.password = password;
      existingUser.failedLoginAttempts = 0;
      existingUser.lockUntil = null;

      await existingUser.save();

      console.log(`🔄 Updated (approved/active): ${email}`);
    } else {
      await User.create({
        email,
        password,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        roles: demoUser.roles,
        permissions,
        tenantId: demoUser.tenantId,
        isEmailVerified: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        isActive: true,
        loginHistory: [],
        refreshTokens: [],
        failedLoginAttempts: 0,
        lockUntil: null,
        isDeleted: false,
      });

      console.log(`✅ Created (approved/active): ${email}`);
    }
  }

  const backfill = await User.updateMany(
    {
      isDeleted: false,
      $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: null }],
      isActive: true,
      isEmailVerified: true,
    },
    {
      $set: {
        approvalStatus: 'approved',
        approvedAt: new Date(),
      },
    }
  );
  if (backfill.modifiedCount) {
    console.log(`🩹 Backfilled approvalStatus=approved on ${backfill.modifiedCount} existing user(s)`);
  }

  console.log('');
  console.log('🎉 Demo users seeded successfully!');
  console.log('Public registration never creates super_admin.');
  console.log('Use seed:bootstrap-sa for controlled Super Admin bootstrap.');
}

seedDemoUsers()
  .catch((error) => {
    console.error('❌ Demo user seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
