/**
 * Seeds a full demo tenant: hierarchy, 2 students, 1 faculty, 1 course with
 * modules/lessons, enrollment, and sample lesson content.
 *
 * Usage: npx tsx src/scripts/seedDemoTenant.ts
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { Tenant } from '../modules/tenants/tenant.model';
import { hashPassword } from '../utils/password';
import {
  University,
  Department,
  Program,
  Batch,
  Section,
  AcademicYear,
} from '../modules/academic/academic.models';
import { Student } from '../modules/students/student.model';
import { Faculty } from '../modules/faculty/faculty.model';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
} from '../modules/courses/course.model';
import { seedPlans } from '../modules/plans/plan.model';
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

async function upsertUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: SystemRole[];
  tenantId: mongoose.Types.ObjectId;
}) {
  const email = params.email.toLowerCase().trim();
  const password = await hashPassword(params.password);
  const permissions = permissionsForRoles(params.roles);
  const existing = await User.findOne({ email, isDeleted: false }).select('+password');
  if (existing) {
    existing.firstName = params.firstName;
    existing.lastName = params.lastName;
    existing.roles = params.roles;
    existing.permissions = permissions;
    existing.tenantId = params.tenantId;
    existing.isActive = true;
    existing.isEmailVerified = true;
    existing.password = password;
    await existing.save();
    return existing;
  }
  return User.create({
    email,
    password,
    firstName: params.firstName,
    lastName: params.lastName,
    roles: params.roles,
    permissions,
    tenantId: params.tenantId,
    isEmailVerified: true,
    isActive: true,
    loginHistory: [],
    refreshTokens: [],
    failedLoginAttempts: 0,
    lockUntil: null,
    isDeleted: false,
  });
}

async function main() {
  console.log('🌱 Seeding demo tenant…');
  await mongoose.connect(env.MONGODB_URI);
  await seedPlans();

  const slug = 'demo-stanford';
  let tenant = await Tenant.findOne({ slug });
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Demo Stanford University',
      slug,
      status: 'active',
      planTier: 'professional', planId: 'professional',
      contactEmail: 'dean.mitchell@stanford.edu',
      isDeleted: false,
    });
    console.log('✅ Tenant created', tenant.id);
  } else {
    console.log('🔄 Tenant exists', tenant.id);
  }
  const tenantId = tenant._id as mongoose.Types.ObjectId;

  const admin = await upsertUser({
    email: 'dean.mitchell@stanford.edu',
    password: 'Password123!',
    firstName: 'Dean',
    lastName: 'Mitchell',
    roles: ['tenant_admin'],
    tenantId,
  });
  const facultyUser = await upsertUser({
    email: 'prof.jenkins@stanford.edu',
    password: 'Password123!',
    firstName: 'Professor',
    lastName: 'Jenkins',
    roles: ['faculty'],
    tenantId,
  });
  const studentUser1 = await upsertUser({
    email: 'alex.rivera@stanford.edu',
    password: 'Password123!',
    firstName: 'Alex',
    lastName: 'Rivera',
    roles: ['student'],
    tenantId,
  });
  const studentUser2 = await upsertUser({
    email: 'jordan.lee@stanford.edu',
    password: 'Password123!',
    firstName: 'Jordan',
    lastName: 'Lee',
    roles: ['student'],
    tenantId,
  });

  let university = await University.findOne({ tenantId, code: 'STAN' });
  if (!university) {
    university = await University.create({
      tenantId,
      name: 'Stanford Demo University',
      code: 'STAN',
      isDeleted: false,
    });
  }

  let department = await Department.findOne({ tenantId, code: 'CSE' });
  if (!department) {
    department = await Department.create({
      tenantId,
      universityId: university._id,
      name: 'Computer Science',
      code: 'CSE',
      hodUserId: facultyUser._id,
      isDeleted: false,
    });
  }

  let program = await Program.findOne({ tenantId, code: 'BTECH-CSE' });
  if (!program) {
    program = await Program.create({
      tenantId,
      departmentId: department._id,
      name: 'B.Tech Computer Science',
      code: 'BTECH-CSE',
      degreeType: 'ug',
      durationYears: 4,
      totalCredits: 160,
      coordinatorUserId: facultyUser._id,
      isDeleted: false,
    });
  }

  let batch = await Batch.findOne({ tenantId, code: 'CSE-2024' });
  if (!batch) {
    batch = await Batch.create({
      tenantId,
      programId: program._id,
      name: 'CSE 2024',
      code: 'CSE-2024',
      startYear: 2024,
      endYear: 2028,
      isDeleted: false,
    });
  }

  let section = await Section.findOne({ tenantId, code: 'CSE-A' });
  if (!section) {
    section = await Section.create({
      tenantId,
      batchId: batch._id,
      name: 'Section A',
      code: 'CSE-A',
      isDeleted: false,
    });
  }

  await AcademicYear.findOneAndUpdate(
    { tenantId, name: '2024-25' },
    {
      $setOnInsert: {
        tenantId,
        name: '2024-25',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-07-31'),
        isCurrent: true,
        isDeleted: false,
      },
    },
    { upsert: true }
  );

  let faculty = await Faculty.findOne({ tenantId, employeeId: 'FAC-001' });
  if (!faculty) {
    faculty = await Faculty.create({
      tenantId,
      userId: facultyUser._id,
      employeeId: 'FAC-001',
      firstName: 'Professor',
      lastName: 'Jenkins',
      email: 'prof.jenkins@stanford.edu',
      departmentId: department._id,
      designation: 'Associate Professor',
      employmentType: 'full_time',
      status: 'active',
      isDeleted: false,
    });
  }

  async function upsertStudent(
    user: { _id: mongoose.Types.ObjectId },
    enrollmentNumber: string,
    firstName: string,
    lastName: string,
    email: string
  ) {
    let s = await Student.findOne({ tenantId, enrollmentNumber });
    if (!s) {
      s = await Student.create({
        tenantId,
        userId: user._id,
        enrollmentNumber,
        firstName,
        lastName,
        email,
        programId: program!._id,
        batchId: batch!._id,
        sectionId: section!._id,
        departmentId: department!._id,
        status: 'active',
        isDeleted: false,
      });
    }
    return s;
  }

  const student1 = await upsertStudent(
    studentUser1,
    'ENR-2024-001',
    'Alex',
    'Rivera',
    'alex.rivera@stanford.edu'
  );
  const student2 = await upsertStudent(
    studentUser2,
    'ENR-2024-002',
    'Jordan',
    'Lee',
    'jordan.lee@stanford.edu'
  );

  let course = await Course.findOne({ tenantId, code: 'CS101' });
  if (!course) {
    course = await Course.create({
      tenantId,
      code: 'CS101',
      title: 'Introduction to Programming',
      description: 'Fundamentals of programming with practical lessons.',
      courseType: 'theory',
      credits: 4,
      programId: program._id,
      departmentId: department._id,
      status: 'published',
      maxSeats: 60,
      isDeleted: false,
    });
  }

  let mod = await CourseModule.findOne({ tenantId, courseId: course._id, title: 'Getting Started' });
  if (!mod) {
    mod = await CourseModule.create({
      tenantId,
      courseId: course._id,
      title: 'Getting Started',
      order: 1,
      isDeleted: false,
    });
  }

  let lesson1 = await CourseLesson.findOne({
    tenantId,
    moduleId: mod._id,
    title: 'Welcome & Course Overview',
  });
  if (!lesson1) {
    lesson1 = await CourseLesson.create({
      tenantId,
      courseId: course._id,
      moduleId: mod._id,
      title: 'Welcome & Course Overview',
      order: 1,
      contentType: 'text',
      textBody:
        'Welcome to CS101. This course introduces programming concepts, problem solving, and basic algorithms. Complete each lesson in order and track your progress.',
      contentSummary: 'Course introduction and learning outcomes.',
      isDeleted: false,
    });
  }

  let lesson2 = await CourseLesson.findOne({
    tenantId,
    moduleId: mod._id,
    title: 'Sample Reading (PDF)',
  });
  if (!lesson2) {
    lesson2 = await CourseLesson.create({
      tenantId,
      courseId: course._id,
      moduleId: mod._id,
      title: 'Sample Reading (PDF)',
      order: 2,
      contentType: 'pdf',
      contentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'dummy.pdf',
      contentSummary: 'Sample PDF attachment for viewer testing.',
      isDeleted: false,
    });
  }

  for (const st of [student1, student2]) {
    const existing = await CourseEnrollment.findOne({
      tenantId,
      studentId: st._id,
      courseId: course._id,
      status: 'enrolled',
    });
    if (!existing) {
      await CourseEnrollment.create({
        tenantId,
        studentId: st._id,
        courseId: course._id,
        status: 'enrolled',
        enrolledAt: new Date(),
        isDeleted: false,
      });
    }
  }

  console.log('');
  console.log('🎉 Demo tenant seed complete');
  console.log('--------------------------------------------');
  console.log('Tenant slug:     demo-stanford');
  console.log('Tenant id:      ', String(tenantId));
  console.log('Admin:           dean.mitchell@stanford.edu');
  console.log('Faculty:         prof.jenkins@stanford.edu');
  console.log('Students:        alex.rivera@stanford.edu, jordan.lee@stanford.edu');
  console.log('Password:        Password123!');
  console.log('Course:          CS101 with 2 lessons (text + sample PDF)');
  console.log('--------------------------------------------');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
