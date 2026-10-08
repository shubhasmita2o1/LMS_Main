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
  console.log('🌱 Starting demo user seed...');

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
      existingUser.password = password;
      existingUser.failedLoginAttempts = 0;
      existingUser.lockUntil = null;

      await existingUser.save();

      console.log(`🔄 Updated: ${email}`);
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
        isActive: true,
        loginHistory: [],
        refreshTokens: [],
        failedLoginAttempts: 0,
        lockUntil: null,
        isDeleted: false,
      });

      console.log(`✅ Created: ${email}`);
    }
  }

  console.log('');
  console.log('🎉 Demo users seeded successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('--------------------------------------------');
  console.log('Super Admin       admin@university.edu');
  console.log('Tenant Admin      dean.mitchell@stanford.edu');
  console.log('University Admin  university.admin@stanford.edu');
  console.log('Faculty           prof.jenkins@stanford.edu');
  console.log('Student           alex.rivera@stanford.edu');
  console.log('Staff             staff.demo@stanford.edu');
  console.log('Password          Password123!');
  console.log('--------------------------------------------');
}

seedDemoUsers()
  .catch((error) => {
    console.error('❌ Demo user seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });