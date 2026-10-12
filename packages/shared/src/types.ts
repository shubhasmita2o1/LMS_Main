/**

 * Core shared types for multi-tenant University LMS

 */



export type TenantId = string;

export type UserId = string;

export type ObjectId = string;



/** Base document fields present on every MongoDB document */

export interface BaseDocument {

  _id: ObjectId;

  tenantId: TenantId;

  createdAt: Date;

  updatedAt: Date;

  createdBy?: UserId;

  updatedBy?: UserId;

  isDeleted?: boolean;

  deletedAt?: Date | null;

}



/** User roles (expandable via RBAC) */

export type SystemRole =

  | 'super_admin'

  | 'tenant_admin'

  | 'university_admin'

  | 'faculty'

  | 'student'

  | 'staff'

  | 'parent'

  | 'guest';



/** Permission action */

export type PermissionAction =

  | 'create'

  | 'read'

  | 'update'

  | 'delete'

  | 'manage'

  | 'export'

  | 'import';



/** Resource types for fine-grained RBAC */

export type ResourceType =

  | 'tenant'

  | 'user'

  | 'role'

  | 'university'

  | 'campus'

  | 'school'

  | 'department'

  | 'program'

  | 'batch'

  | 'section'

  | 'course'

  | 'student'

  | 'faculty'

  | 'assignment'

  | 'quiz'

  | 'exam'

  | 'grade'

  | 'attendance'

  | 'fee'

  | 'billing'

  | 'notification'

  | 'analytics'

  | 'lab'

  | 'library'

  | 'placement'

  | 'feature_flag'

  | 'plan';



export interface Permission {

  resource: ResourceType;

  action: PermissionAction;

  /** Optional scope, e.g. own department only */

  scope?: string;

}



export interface AuthUser {

  id: UserId;

  tenantId: TenantId | null; // null for super_admin

  email: string;

  roles: SystemRole[];

  permissions: Permission[];

  firstName?: string;

  lastName?: string;

}



/** JWT access token payload — keep minimal (no sensitive data) */

export interface TokenPayload {

  sub: UserId;

  tenantId: TenantId | null;

  roles: SystemRole[];

  type: 'access' | 'refresh';

  iat?: number;

  exp?: number;

}



export interface AuthTokens {

  accessToken: string;

  refreshToken: string;

  expiresIn: number; // seconds

}



export interface LoginInput {

  email: string;

  password: string;

  tenantId?: string; // optional: required for tenant users when not resolved from host

}



export interface RegisterInput {

  email: string;

  password: string;

  firstName: string;

  lastName: string;

  /** Controlled: only super_admin or tenant_admin bootstrap */

  role?: SystemRole;

  tenantId?: string | null;

}



export interface LoginResponse {

  user: AuthUser;

  tokens: AuthTokens;

}



// ─── Phase 3: Tenant / Plan / Billing ───────────────────────────────────────



export type TenantStatus =

  | 'active'

  | 'trialing'

  | 'past_due'

  | 'canceled'

  | 'suspended';



export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type PlanId = PlanTier | string;



export type BillingInterval = 'month' | 'year';

export type BillingProvider = 'stripe' | 'razorpay' | 'none';



export interface TenantBranding {

  name?: string;

  logoUrl?: string;

  primaryColor?: string;

  secondaryColor?: string;

  faviconUrl?: string;

  customDomain?: string;

}



export interface TenantLimits {

  maxStudents: number;

  maxFaculty: number;

  maxStorageGB: number;

  maxCourses: number;

  maxAdmins: number;

}



export type UsageMetricKey =

  | 'activeStudents'

  | 'activeFaculty'

  | 'storageBytes'

  | 'apiCalls'

  | 'courses'

  | 'activeAdmins';



export interface UsageMetric {

  metric: UsageMetricKey;

  value: number;

  limit?: number;

  periodStart?: Date | string;

  periodEnd?: Date | string;

}



export interface FeatureFlagDefinition {

  key: string;

  name: string;

  description?: string;

  defaultValue: boolean;

}



export interface TenantFeatureFlags {

  [key: string]: boolean;

}



export interface SubscriptionInfo {

  provider: BillingProvider;

  subscriptionId?: string | null;

  customerId?: string | null;

  status?: TenantStatus;

  currentPeriodEnd?: Date | string | null;

  trialEndsAt?: Date | string | null;

  cancelAtPeriodEnd?: boolean;

}



export interface TenantPublic {

  id: string;

  name: string;

  slug: string;

  status: TenantStatus;

  planId: PlanId;

  planTier: PlanTier;

  branding: TenantBranding;

  limits: TenantLimits;

  featureFlags: TenantFeatureFlags;

  customDomain?: string | null;

  subscription?: SubscriptionInfo;

  trialEndsAt?: Date | string | null;

  currentPeriodEnd?: Date | string | null;

  ownerId?: string | null;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface PlanPublic {

  id: string;

  key: PlanTier;

  name: string;

  description?: string;

  price: number;

  currency: string;

  interval: BillingInterval;

  features: string[];

  featureFlags: TenantFeatureFlags;

  limits: TenantLimits;

  isActive: boolean;

  isPublic: boolean;

  trialDays: number;

  sortOrder: number;

}



export interface PlatformStats {

  totalTenants: number;

  activeTenants: number;

  trialingTenants: number;

  suspendedTenants: number;

  totalUsers: number;

  revenueSkeleton: {

    currency: string;

    mrrEstimate: number;

    note: string;

  };

}



export interface ApiResponse<T = unknown> {

  success: boolean;

  data?: T;

  message?: string;

  error?: {

    code: string;

    message?: string;

    details?: unknown;

  };

  meta?: {

    page?: number;

    limit?: number;

    total?: number;

    totalPages?: number;

  };

}



/** Login history entry (stored on User) */

export interface LoginHistoryEntry {

  at: Date;

  ip?: string;

  userAgent?: string;

  success: boolean;

}



// ─── Phase 4: Academic hierarchy ────────────────────────────────────────────



export type AcademicEntityStatus = 'active' | 'inactive' | 'archived';



export type UniversityType =

  | 'public'

  | 'private'

  | 'deemed'

  | 'autonomous'

  | 'other';



export type DegreeType =

  | 'certificate'

  | 'diploma'

  | 'ug'

  | 'pg'

  | 'doctoral'

  | 'integrated'

  | 'other';



export interface GradeBand {

  letter: string;

  minPercent: number;

  maxPercent: number;

  gradePoint: number;

}



export interface GradingScheme {

  name: string;

  scaleMax: number;

  bands: GradeBand[];

}



export interface CreditStructure {

  minCreditsPerSemester: number;

  maxCreditsPerSemester: number;

  creditHoursPerLecture: number;

  creditHoursPerLab: number;

}



export interface AttendanceRules {

  minimumPercent: number;

  considerMedicalLeave: boolean;

}



export interface PromotionRules {

  minCgpaToPass: number;

  maxBacklogsAllowed: number;

}



export interface AcademicConfig {

  gradingScheme: GradingScheme;

  creditStructure: CreditStructure;

  attendanceRules: AttendanceRules;

  promotionRules: PromotionRules;

}



export interface UniversityPublic {

  id: string;

  tenantId: string;

  name: string;

  code: string;

  type: UniversityType;

  address?: string;

  contactEmail?: string;

  contactPhone?: string;

  logoUrl?: string;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface CampusPublic {

  id: string;

  tenantId: string;

  universityId: string;

  name: string;

  code: string;

  address?: string;

  isMainCampus: boolean;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface SchoolPublic {

  id: string;

  tenantId: string;

  universityId: string;

  campusId?: string | null;

  name: string;

  code: string;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface DepartmentPublic {

  id: string;

  tenantId: string;

  universityId: string;

  campusId?: string | null;

  schoolId?: string | null;

  name: string;

  code: string;

  hodUserId?: string | null;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface ProgramPublic {

  id: string;

  tenantId: string;

  departmentId: string;

  name: string;

  code: string;

  degreeType: DegreeType;

  durationYears: number;

  totalCredits: number;

  coordinatorUserId?: string | null;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface AcademicYearPublic {

  id: string;

  tenantId: string;

  name: string;

  startDate: Date | string;

  endDate: Date | string;

  isCurrent: boolean;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface SemesterPublic {

  id: string;

  tenantId: string;

  academicYearId: string;

  name: string;

  sequence: number;

  startDate?: Date | string | null;

  endDate?: Date | string | null;

  isCurrent: boolean;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface BatchPublic {

  id: string;

  tenantId: string;

  programId: string;

  academicYearId?: string | null;

  name: string;

  startYear: number;

  endYear: number;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface SectionPublic {

  id: string;

  tenantId: string;

  batchId: string;

  name: string;

  maxStudents: number;

  advisorUserId?: string | null;

  status: AcademicEntityStatus;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface AcademicTreeNode {

  id: string;

  type: 'university' | 'campus' | 'school' | 'department' | 'program' | 'batch' | 'section';

  name: string;

  code?: string;

  status?: AcademicEntityStatus;

  children?: AcademicTreeNode[];

}





/** Shared Student and Faculty module types */



export type Gender =

  | 'male'

  | 'female'

  | 'other'

  | 'prefer_not_to_say';



export type StudentStatus =

  | 'active'

  | 'inactive'

  | 'graduated'

  | 'suspended'

  | 'withdrawn'

  | 'on_leave'

  | 'alumni';



export type EnrollmentStatus =

  | 'enrolled'

  | 'provisional'

  | 'deferred'

  | 'completed'

  | 'cancelled';



export type BloodGroup =

  | 'A+'

  | 'A-'

  | 'B+'

  | 'B-'

  | 'AB+'

  | 'AB-'

  | 'O+'

  | 'O-'

  | 'unknown';



export type AdmissionType =

  | 'regular'

  | 'lateral'

  | 'transfer'

  | 'nri'

  | 'management'

  | 'other';



export interface AddressInfo {

  line1?: string;

  line2?: string;

  city?: string;

  state?: string;

  postalCode?: string;

  country?: string;

}



export interface GuardianInfo {

  name: string;

  relation: string;

  phone?: string;

  email?: string;

  occupation?: string;

  address?: string;

  isPrimary?: boolean;

}



export interface EmergencyContactInfo {

  name: string;

  relation: string;

  phone: string;

}



export interface PreviousEducationInfo {

  institution: string;

  boardOrUniversity?: string;

  year?: number;

  percentageOrCgpa?: string;

  qualification?: string;

}



export interface StudentDocumentPublic {

  id: string;

  studentId: string;

  tenantId: string;

  type: string;

  fileName: string;

  fileUrl: string;

  mimeType?: string;

  size?: number;

  verificationStatus: 'pending' | 'verified' | 'rejected';

  uploadedAt: Date | string;

  uploadedBy?: string | null;

}



export interface StudentListItem {

  id: string;

  tenantId: string;

  userId?: string | null;

  enrollmentNumber: string;

  rollNumber?: string;

  registrationNumber?: string;

  firstName: string;

  middleName?: string;

  lastName: string;

  email?: string;

  phone?: string;

  status: StudentStatus;

  enrollmentStatus: EnrollmentStatus;

  programId?: string | null;

  batchId?: string | null;

  sectionId?: string | null;

  departmentId?: string | null;

  photoUrl?: string;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface StudentPublic extends StudentListItem {

  alternatePhone?: string;

  dateOfBirth?: Date | string | null;

  gender?: Gender;

  bloodGroup?: BloodGroup;

  nationality?: string;

  category?: string;

  permanentAddress?: AddressInfo;

  currentAddress?: AddressInfo;

  admissionDate?: Date | string | null;

  admissionType?: AdmissionType;

  currentSemesterId?: string | null;

  academicYearId?: string | null;

  academicNotes?: string;

  guardians: GuardianInfo[];

  emergencyContacts: EmergencyContactInfo[];

  previousEducation: PreviousEducationInfo[];

}



export type FacultyStatus =

  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'retired'
  | 'terminated';



export type EmploymentType =

  | 'full_time'

  | 'part_time'

  | 'visiting'

  | 'contract'

  | 'adjunct';



export type FacultyAssignmentRole =

  | 'instructor'

  | 'coordinator'

  | 'lab_instructor'

  | 'guest_lecturer'

  | 'other';



export interface FacultyQualification {

  degree: string;

  institution?: string;

  year?: number;

  specialization?: string;

}



export interface FacultyPublic {

  id: string;

  tenantId: string;

  userId?: string | null;

  employeeId: string;

  firstName: string;

  middleName?: string;

  lastName: string;

  email?: string;

  phone?: string;

  alternatePhone?: string;

  dateOfBirth?: Date | string | null;

  gender?: Gender;

  photoUrl?: string;

  designation?: string;

  employmentType: EmploymentType;

  departmentId?: string | null;

  additionalDepartmentIds: string[];

  dateOfJoining?: Date | string | null;

  dateOfLeaving?: Date | string | null;

  status: FacultyStatus;

  qualifications: FacultyQualification[];

  specializations: string[];

  experienceYears?: number;

  bio?: string;

  officeLocation?: string;

  officeHours?: string;

  createdAt: Date | string;

  updatedAt: Date | string;

}



export interface FacultyAssignmentPublic {

  id: string;

  tenantId: string;

  facultyId: string;

  courseId?: string | null;

  sectionId?: string | null;

  academicYearId?: string | null;

  semesterId?: string | null;

  role: FacultyAssignmentRole;

  workloadHours?: number;

  createdAt: Date | string;

}



export interface FacultyListItem extends FacultyPublic {}



/**
 * Aggregate student statistics returned by student reporting endpoints.
 * Keep this separate from FacultyStats because the dimensions differ.
 */
export interface StudentStats {
  total: number;
  byStatus: Record<string, number>;
  byProgram: Array<{ programId: string; count: number }>;
  byBatch: Array<{ batchId: string; count: number }>;
}

export interface FacultyStats {

  total: number;

  byStatus: Record<string, number>;

  byDepartment: Array<{ departmentId: string; count: number }>;

  byEmploymentType: Record<string, number>;

}
