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
  | 'registrar'
  | 'faculty'
  | 'student'
  | 'department_head'
  | 'exam_controller'
  | 'finance'
  | 'librarian'
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
  | 'import'
  | 'approve'
  | 'submit'
  | 'evaluate'
  | 'invigilate'
  | 'attempt';

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
  | 'curriculum'
  | 'student'
  | 'faculty'
  | 'assessment'
  | 'assignment'
  | 'quiz'
  | 'question'
  | 'exam'
  | 'grade'
  | 'attendance'
  | 'fee'
  | 'billing'
  | 'notification'
  | 'analytics'
  | 'lab'
  | 'practical'
  | 'library'
  | 'placement'
  | 'communication'
  | 'report'
  | 'document'
  | 'setting'
  | 'audit'
  | 'support'
  | 'feature_flag'
  | 'plan'
  | 'live_class'
  | 'learning'
  | 'result'
  | 'gradebook';

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

// ─── Phase 5: Student Information System ────────────────────────────────────

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

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

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

export type AdmissionType = 'regular' | 'lateral' | 'transfer' | 'nri' | 'management' | 'other';

export type StudentDocumentType =
  | 'id_proof'
  | 'marksheet'
  | 'photo'
  | 'certificate'
  | 'address_proof'
  | 'other';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';

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
  type: StudentDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  size?: number;
  verificationStatus: DocumentVerificationStatus;
  uploadedAt: Date | string;
  uploadedBy?: string | null;
}

export interface StudentListItem {
  id: string;
  tenantId: string;
  enrollmentNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: StudentStatus;
  programId?: string | null;
  batchId?: string | null;
  sectionId?: string | null;
  departmentId?: string | null;
  admissionDate?: Date | string | null;
  photoUrl?: string;
  createdAt: Date | string;
}

export interface StudentPublic extends StudentListItem {
  userId?: string | null;
  rollNumber?: string;
  registrationNumber?: string;
  alternatePhone?: string;
  dateOfBirth?: Date | string | null;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  nationality?: string;
  category?: string;
  permanentAddress?: AddressInfo;
  currentAddress?: AddressInfo;
  admissionType?: AdmissionType;
  currentSemesterId?: string | null;
  academicYearId?: string | null;
  academicNotes?: string;
  guardians: GuardianInfo[];
  emergencyContacts: EmergencyContactInfo[];
  previousEducation: PreviousEducationInfo[];
  enrollmentStatus?: EnrollmentStatus;
  updatedAt: Date | string;
}

export interface StudentStats {
  total: number;
  byStatus: Record<string, number>;
  byProgram: Array<{ programId: string; count: number }>;
  byBatch: Array<{ batchId: string; count: number }>;
}

// ─── Phase 6: Faculty Management ────────────────────────────────────────────

export type FacultyStatus = 'active' | 'inactive' | 'on_leave' | 'retired' | 'terminated';

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

export interface FacultyListItem {
  id: string;
  tenantId: string;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
  employmentType?: EmploymentType;
  departmentId?: string | null;
  status: FacultyStatus;
  photoUrl?: string;
  dateOfJoining?: Date | string | null;
  createdAt: Date | string;
}

export interface FacultyPublic extends FacultyListItem {
  userId?: string | null;
  alternatePhone?: string;
  dateOfBirth?: Date | string | null;
  gender?: Gender;
  additionalDepartmentIds: string[];
  dateOfLeaving?: Date | string | null;
  qualifications: FacultyQualification[];
  specializations: string[];
  experienceYears?: number;
  bio?: string;
  officeLocation?: string;
  officeHours?: string;
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

export interface FacultyStats {
  total: number;
  byStatus: Record<string, number>;
  byDepartment: Array<{ departmentId: string; count: number }>;
  byEmploymentType: Record<string, number>;
}

// ─── Phase 7: Curriculum & Course Management ────────────────────────────────

export type CourseType =
  | 'core'
  | 'elective'
  | 'lab'
  | 'project'
  | 'seminar'
  | 'audit'
  | 'other';

export type CourseStatus = 'draft' | 'active' | 'archived' | 'inactive';

export type PrerequisiteType = 'required' | 'recommended';

export type LessonContentType =
  | 'pdf'
  | 'ppt'
  | 'pptx'
  | 'docx'
  | 'image'
  | 'zip'
  | 'video'
  | 'link'
  | 'text'
  | 'other';

/** @deprecated Prefer LessonContentType — kept for compatibility */
export type ContentType = LessonContentType;

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type LiveClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type VideoProvider = 'url' | 'youtube' | 'vimeo';

export type MeetingProvider = 'zoom' | 'meet' | 'teams' | 'custom';

export type CourseEnrollmentStatus =
  | 'enrolled'
  | 'dropped'
  | 'completed'
  | 'failed'
  | 'withdrawn';

export type OfferingStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface CourseCredits {
  theory: number;
  practical: number;
  total: number;
}

export interface CoursePrerequisite {
  courseId: string;
  type: PrerequisiteType;
}

export interface LearningOutcome {
  code?: string;
  description: string;
  order?: number;
}

export interface CourseListItem {
  id: string;
  tenantId: string;
  programId: string;
  departmentId?: string | null;
  code: string;
  name: string;
  shortName?: string;
  courseType: CourseType;
  credits: CourseCredits;
  status: CourseStatus;
  isElective: boolean;
  isLab: boolean;
  maxSeats?: number | null;
  createdAt: Date | string;
}

export interface CoursePublic extends CourseListItem {
  description?: string;
  lectureHours?: number;
  labHours?: number;
  tutorialHours?: number;
  prerequisites: CoursePrerequisite[];
  corequisites: string[];
  learningOutcomes: LearningOutcome[];
  syllabusOutline?: string;
  updatedAt: Date | string;
  modulesCount?: number;
  lessonsCount?: number;
}

export interface CourseModulePublic {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  lessonsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CourseLessonPublic {
  id: string;
  tenantId: string;
  courseId: string;
  moduleId: string;
  chapterId?: string | null;
  title: string;
  order: number;
  contentType: LessonContentType;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  contentSummary?: string;
  /** Content delivery */
  contentUrl?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  textBody?: string | null;
  videoProvider?: VideoProvider | null;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  captionsUrl?: string | null;
  transcript?: string | null;
  allowDownload?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LearningProgressPublic {
  id: string;
  tenantId: string;
  studentId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  status: ProgressStatus;
  progressPercent: number;
  lastPositionSeconds: number;
  completedAt?: Date | string | null;
  timeSpentSeconds: number;
  updatedAt: Date | string;
  createdAt: Date | string;
}

export interface CourseProgressSummary {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  progressPercent: number;
  lastLessonId?: string | null;
  lastAccessedAt?: Date | string | null;
}

export interface LearningNotePublic {
  id: string;
  tenantId: string;
  studentId: string;
  lessonId: string;
  courseId: string;
  body: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BookmarkPublic {
  id: string;
  tenantId: string;
  studentId: string;
  lessonId: string;
  courseId: string;
  label?: string | null;
  createdAt: Date | string;
}

export interface LiveClassPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  sectionId?: string | null;
  title: string;
  description?: string | null;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  status: LiveClassStatus;
  meetingProvider: MeetingProvider;
  meetingUrl?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  hostFacultyId?: string | null;
  recordingUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LearnOutlineLesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  contentType: LessonContentType;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  progress?: {
    status: ProgressStatus;
    progressPercent: number;
    lastPositionSeconds: number;
  } | null;
}

export interface LearnOutlineModule {
  id: string;
  title: string;
  order: number;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  lessons: LearnOutlineLesson[];
  progressPercent: number;
}

export interface LearnCourseOutline {
  course: CourseListItem & { description?: string };
  modules: LearnOutlineModule[];
  progress: CourseProgressSummary;
  enrollmentStatus?: CourseEnrollmentStatus | null;
}

export interface EnrolledCourseWithProgress {
  enrollment: CourseEnrollmentPublic;
  course: CourseListItem;
  progress: CourseProgressSummary;
}

export interface CourseOfferingPublic {
  id: string;
  tenantId: string;
  courseId: string;
  sectionId?: string | null;
  batchId?: string | null;
  academicYearId?: string | null;
  semesterId?: string | null;
  facultyIds: string[];
  maxStudents?: number | null;
  status: OfferingStatus;
  enrolledCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CurriculumEntryPublic {
  id: string;
  tenantId: string;
  programId: string;
  courseId: string;
  semesterNumber?: number | null;
  yearNumber?: number | null;
  isMandatory: boolean;
  creditsOverride?: number | null;
  order?: number;
  createdAt: Date | string;
}

export interface CourseEnrollmentPublic {
  id: string;
  tenantId: string;
  studentId: string;
  courseId: string;
  offeringId?: string | null;
  sectionId?: string | null;
  status: CourseEnrollmentStatus;
  enrolledAt: Date | string;
  grade?: string | null;
  createdAt: Date | string;
}

export interface CourseStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byProgram: Array<{ programId: string; count: number }>;
}

// ─── Phase 9: Assignments, Quiz & Question Bank ─────────────────────────────

export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'late'
  | 'graded'
  | 'returned'
  | 'resubmitted';

export type QuestionType =
  | 'mcq'
  | 'multi_select'
  | 'true_false'
  | 'fill_blank'
  | 'short'
  | 'long'
  | 'numerical'
  | 'matching';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type QuizAttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'auto_submitted'
  | 'graded';

export type QuestionBankStatus = 'active' | 'draft' | 'archived';
export type QuizShowResults = 'never' | 'after_submit' | 'after_close';

export interface FileAttachmentRef {
  fileKey: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  url?: string;
}

export interface RubricCriterion {
  criterion: string;
  maxMarks: number;
  description?: string;
}

export interface RubricScore {
  criterionIndex: number;
  marks: number;
  comment?: string;
}

export interface QuestionOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QBankSubjectPublic {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  departmentId?: string | null;
  status: QuestionBankStatus;
  unitsCount?: number;
  questionsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QBankUnitPublic {
  id: string;
  tenantId: string;
  subjectId: string;
  name: string;
  order: number;
  status: QuestionBankStatus;
  topicsCount?: number;
  questionsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QBankTopicPublic {
  id: string;
  tenantId: string;
  unitId: string;
  subjectId: string;
  name: string;
  order: number;
  status: QuestionBankStatus;
  questionsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QuestionPublic {
  id: string;
  tenantId: string;
  subjectId: string;
  unitId?: string | null;
  topicId?: string | null;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options?: QuestionOption[];
  correctAnswer?: string | null;
  matchingPairs?: MatchingPair[];
  marks: number;
  difficulty: Difficulty;
  bloomLevel?: BloomLevel | null;
  explanation?: string | null;
  tags: string[];
  status: QuestionBankStatus;
  usageCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QuestionSafePublic {
  id: string;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options?: Array<{ key: string; text: string }>;
  matchingPairs?: Array<{ left: string; right?: string }>;
  marks: number;
  order?: number;
}

export interface AssignmentPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  attachments: FileAttachmentRef[];
  maxMarks: number;
  passingMarks?: number | null;
  availableFrom?: Date | string | null;
  dueAt?: Date | string | null;
  lateDueAt?: Date | string | null;
  allowLate: boolean;
  latePenaltyPercent?: number | null;
  allowResubmission: boolean;
  maxSubmissions: number;
  rubric: RubricCriterion[];
  status: AssignmentStatus;
  createdBy?: string | null;
  submissionsCount?: number;
  mySubmissionStatus?: SubmissionStatus | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AssignmentSubmissionPublic {
  id: string;
  tenantId: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  attemptNumber: number;
  body?: string | null;
  attachments: FileAttachmentRef[];
  submittedAt?: Date | string | null;
  isLate: boolean;
  status: SubmissionStatus;
  marksAwarded?: number | null;
  feedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: Date | string | null;
  rubricScores?: RubricScore[];
  plagiarismScore?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  studentName?: string;
}

export interface QuizQuestionRef {
  questionId: string;
  marks?: number | null;
  order: number;
}

export interface QuizPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  questions: QuizQuestionRef[];
  totalMarks: number;
  durationMinutes?: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: QuizShowResults;
  availableFrom?: Date | string | null;
  dueAt?: Date | string | null;
  status: AssignmentStatus;
  passPercent?: number | null;
  negativeMarking?: number | null;
  autoSubmitOnTimeout: boolean;
  createdBy?: string | null;
  attemptsCount?: number;
  myAttemptsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QuizAnswer {
  questionId: string;
  response?: string | string[] | MatchingPair[] | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
}

export interface QuizAttemptPublic {
  id: string;
  tenantId: string;
  quizId: string;
  studentId: string;
  courseId: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: Date | string;
  submittedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  answers: QuizAnswer[];
  totalMarksAwarded?: number | null;
  percent?: number | null;
  questionOrder?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  studentName?: string;
}

// ─── Phase 10: Gradebook, Results & Attendance ───────────────────────────────

export type GradeComponentType =
  | 'assignment'
  | 'quiz'
  | 'midterm'
  | 'final'
  | 'attendance'
  | 'project'
  | 'other'
  | 'manual';

export type GradeComponentSource = 'assignment' | 'quiz' | 'attendance' | 'manual';

export type GradebookStatus = 'open' | 'locked' | 'published';

export type ResultStatus = 'draft' | 'moderation' | 'published' | 'held';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'holiday';

export type AttendanceSessionType = 'lecture' | 'lab' | 'tutorial' | 'other';

export type AttendanceMethod = 'manual' | 'qr' | 'biometric' | 'import';

export type AttendanceSessionStatus = 'open' | 'closed';

export interface GradeComponentConfig {
  key: string;
  name: string;
  type: GradeComponentType;
  weightPercent: number;
  maxMarks: number;
  source: GradeComponentSource;
  sourceIds?: string[];
  dropLowest?: number;
}

export interface GradebookPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  academicYearId?: string | null;
  semesterId?: string | null;
  title: string;
  status: GradebookStatus;
  components: GradeComponentConfig[];
  lockedAt?: Date | string | null;
  lockedBy?: string | null;
  publishedAt?: Date | string | null;
  publishedBy?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  courseName?: string;
  courseCode?: string;
}

export interface GradeEntryPublic {
  id: string;
  tenantId: string;
  gradebookId: string;
  studentId: string;
  componentKey: string;
  rawMarks: number;
  maxMarks: number;
  percent: number;
  overriddenMarks?: number | null;
  overrideReason?: string | null;
  overriddenBy?: string | null;
  sourceRef?: { type: string; id: string } | null;
  isExcluded?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GradebookTotalPublic {
  id: string;
  tenantId: string;
  gradebookId: string;
  studentId: string;
  weightedPercent: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  rank?: number | null;
  isPass?: boolean | null;
  recomputedAt?: Date | string | null;
  studentName?: string;
  studentCode?: string;
}

export interface StudentGradeRow {
  studentId: string;
  studentName?: string;
  studentCode?: string;
  entries: Record<string, GradeEntryPublic | undefined>;
  total?: GradebookTotalPublic | null;
}

export interface ResultPublic {
  id: string;
  tenantId: string;
  gradebookId: string;
  studentId: string;
  status: ResultStatus;
  publishedAt?: Date | string | null;
  publishedBy?: string | null;
  weightedPercent: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPass?: boolean | null;
  components: Array<{
    key: string;
    name: string;
    weightPercent: number;
    rawMarks: number;
    maxMarks: number;
    percent: number;
    contribution: number;
  }>;
  remarks?: string | null;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  title?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TranscriptItem {
  resultId: string;
  gradebookId: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  title: string;
  weightedPercent: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPass?: boolean | null;
  publishedAt?: Date | string | null;
}

export interface AttendanceSessionPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  sectionId?: string | null;
  date: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  sessionType: AttendanceSessionType;
  topic?: string | null;
  title?: string | null;
  markedBy?: string | null;
  method: AttendanceMethod;
  status: AttendanceSessionStatus;
  qrToken?: string | null;
  presentCount?: number;
  absentCount?: number;
  totalMarked?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  courseName?: string;
}

export interface AttendanceRecordPublic {
  id: string;
  tenantId: string;
  sessionId: string;
  studentId: string;
  courseId: string;
  status: AttendanceStatus;
  markedAt?: Date | string | null;
  markedBy?: string | null;
  note?: string | null;
  studentName?: string;
  studentCode?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AttendanceSummaryPublic {
  studentId: string;
  courseId: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  holidayCount: number;
  totalSessions: number;
  /** present + late typically count toward percent */
  percent: number;
  isShortage: boolean;
  minimumPercent: number;
  studentName?: string;
  studentCode?: string;
}

// ─── Phase 11: Practical & Lab Platform ─────────────────────────────────────

export type PracticalStatus = 'draft' | 'published' | 'closed' | 'archived';
export type LabStatus = 'draft' | 'published' | 'archived';
export type ExperimentStatus = 'draft' | 'published' | 'closed' | 'archived';

export type SubmissionKind =
  | 'code'
  | 'report'
  | 'screenshot'
  | 'output'
  | 'github'
  | 'mixed';

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export type LabLanguage = 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'sql';

export type TestCaseVisibility = 'public' | 'hidden';

export type EvaluationMode = 'auto' | 'manual' | 'hybrid';

export type LabSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'running'
  | 'scored'
  | 'evaluated'
  | 'returned';

export type EvaluationStatus = 'pending' | 'auto_scored' | 'manual' | 'completed';

export interface LabTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  visibility: TestCaseVisibility;
  weight: number;
  /** Optional display name for faculty */
  name?: string;
}

/** Student-safe view: hidden expectedOutput stripped */
export interface LabTestCasePublic {
  id: string;
  input: string;
  expectedOutput?: string; // only for public
  visibility: TestCaseVisibility;
  weight: number;
  name?: string;
}

export interface LabTestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string | null;
  durationMs?: number | null;
  /** weight contribution when scored */
  score?: number | null;
}

export interface PracticalPublic {
  id: string;
  tenantId: string;
  courseId: string;
  offeringId?: string | null;
  title: string;
  description?: string | null;
  status: PracticalStatus;
  facultyOwnerIds: string[];
  availableFrom?: Date | string | null;
  availableTo?: Date | string | null;
  maxScore: number;
  weightPercent?: number | null;
  labCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  courseName?: string;
  courseCode?: string;
}

export interface LabPublic {
  id: string;
  tenantId: string;
  practicalId: string;
  courseId: string;
  title: string;
  order: number;
  instructions?: string | null;
  defaultLanguage: LabLanguage;
  timeoutSec: number;
  memoryMb: number;
  status: LabStatus;
  experimentCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExperimentPublic {
  id: string;
  tenantId: string;
  labId: string;
  practicalId?: string;
  courseId?: string;
  title: string;
  statement: string;
  allowedLanguages: LabLanguage[];
  starterCode: Partial<Record<LabLanguage, string>>;
  timeLimitSec: number;
  memoryLimitMb: number;
  maxScore: number;
  testCases: LabTestCasePublic[];
  evaluationMode: EvaluationMode;
  attachments: FileAttachmentRef[];
  status: ExperimentStatus;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LabSubmissionPublic {
  id: string;
  tenantId: string;
  experimentId: string;
  labId: string;
  studentId: string;
  courseId: string;
  kind: SubmissionKind;
  language?: LabLanguage | null;
  code?: string | null;
  reportFileKey?: string | null;
  screenshotFileKey?: string | null;
  outputText?: string | null;
  githubUrl?: string | null;
  executionJobId?: string | null;
  autoScore?: number | null;
  manualScore?: number | null;
  totalScore?: number | null;
  status: LabSubmissionStatus;
  attemptNumber: number;
  submittedAt?: Date | string | null;
  /** Public test results only for students; faculty may see all */
  testResults?: LabTestResult[];
  publicPassed?: number;
  publicTotal?: number;
  hiddenPassed?: number;
  hiddenTotal?: number;
  evaluationStatus?: EvaluationStatus;
  feedback?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  studentName?: string;
  studentCode?: string;
  experimentTitle?: string;
}

export interface ExecutionJobPublic {
  id: string;
  tenantId: string;
  submissionId: string;
  studentId: string;
  experimentId: string;
  language: LabLanguage;
  status: ExecutionStatus;
  queuedAt: Date | string;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  stdout?: string | null;
  stderr?: string | null;
  exitCode?: number | null;
  testResults: LabTestResult[];
  errorMessage?: string | null;
  workerId?: string | null;
  durationMs?: number | null;
}

export interface LabEvaluationPublic {
  id: string;
  tenantId: string;
  submissionId: string;
  autoScore?: number | null;
  manualScore?: number | null;
  totalScore?: number | null;
  vivaScore?: number | null;
  rubricNotes?: string | null;
  feedback?: string | null;
  status: EvaluationStatus;
  evaluatedBy?: string | null;
  evaluatedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DigitalLabRecordPublic {
  id: string;
  tenantId: string;
  studentId: string;
  practicalId: string;
  labId?: string | null;
  entries: Array<{
    experimentId: string;
    experimentTitle?: string;
    bestScore?: number | null;
    attempts: number;
    lastSubmittedAt?: Date | string | null;
  }>;
  cumulativeScore: number;
  maxPossibleScore: number;
  vivaMarks?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Adapter contracts (shared for API + worker docs) */
export interface ExecutionJobInput {
  jobId: string;
  tenantId: string;
  submissionId: string;
  language: LabLanguage;
  code: string;
  timeLimitSec: number;
  memoryLimitMb: number;
  testCases: Array<{ id: string; input: string; expectedOutput: string; weight: number }>;
}

export interface ExecutionStatusResult {
  jobId: string;
  status: ExecutionStatus;
  stdout?: string | null;
  stderr?: string | null;
  exitCode?: number | null;
  testResults?: LabTestResult[];
  errorMessage?: string | null;
  durationMs?: number | null;
}

// ─── Phase 12: Examination System ────────────────────────────────────────────

export type ExamStatus = 'draft' | 'scheduled' | 'live' | 'closed' | 'graded' | 'cancelled';
export type ExamMode = 'online' | 'offline' | 'hybrid';
export type ExamAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'auto_submitted'
  | 'void';
export type AllocationStatus = 'allocated' | 'present' | 'absent' | 'malpractice';
export type SuspicionEventType =
  | 'tab_blur'
  | 'fullscreen_exit'
  | 'copy_paste'
  | 'multiple_login'
  | 'heartbeat_miss'
  | 'other';
export type ExamShowResultAfter = 'submit' | 'close' | 'manual' | 'never';

export interface ExamSettings {
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarkPerQuestion?: number | null;
  allowNavigation: boolean;
  allowFlagging: boolean;
  autosaveIntervalSec: number;
  autoSubmitOnTimeout: boolean;
  showResultAfter: ExamShowResultAfter;
}

export interface ExamQuestionSnapshot {
  /** Original question bank id (if any) */
  questionBankId?: string | null;
  /** Stable id used inside this exam paper */
  questionId: string;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options?: QuestionOption[];
  /** Correct keys / answer kept server-side only after publish */
  correctAnswer?: string | null;
  matchingPairs?: MatchingPair[];
  marks: number;
  order: number;
  difficulty?: Difficulty;
  explanation?: string | null;
}

export interface ExamQuestionRefInput {
  questionBankId: string;
  marks?: number | null;
  order?: number;
}

export interface ExamCenterPublic {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  building?: string | null;
  room?: string | null;
  capacity: number;
  address?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExamInvigilatorPublic {
  id: string;
  tenantId: string;
  examId: string;
  userId: string;
  centerId?: string | null;
  roleNote?: 'chief' | 'assistant' | null;
  userName?: string | null;
  userEmail?: string | null;
}

export interface ExamAllocationPublic {
  id: string;
  tenantId: string;
  examId: string;
  studentId: string;
  centerId?: string | null;
  seatNumber?: string | null;
  invigilatorId?: string | null;
  status: AllocationStatus;
  studentName?: string | null;
  studentCode?: string | null;
  centerName?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExamPublic {
  id: string;
  tenantId: string;
  courseId?: string | null;
  programId?: string | null;
  departmentId?: string | null;
  title: string;
  code: string;
  description?: string | null;
  mode: ExamMode;
  status: ExamStatus;
  startAt: Date | string;
  endAt: Date | string;
  durationMinutes: number;
  settings: ExamSettings;
  /** Question refs without correct answers for students */
  questionCount: number;
  totalMarks: number;
  centerIds: string[];
  publishedAt?: Date | string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** Admin-only: question snapshots may include keys after close/grade */
  questions?: ExamQuestionSnapshot[];
  myAllocation?: ExamAllocationPublic | null;
  myAttemptsCount?: number;
  attemptsCount?: number;
}

/** Student-facing paper — never includes correctAnswer */
export interface ExamPaperQuestion {
  questionId: string;
  type: QuestionType;
  stem: string;
  richText?: string | null;
  options?: Array<{ key: string; text: string }>;
  matchingPairs?: Array<{ left: string; right?: string }>;
  marks: number;
  order: number;
}

export interface ExamPaperPublic {
  examId: string;
  title: string;
  code: string;
  durationMinutes: number;
  settings: Pick<
    ExamSettings,
    | 'allowNavigation'
    | 'allowFlagging'
    | 'autosaveIntervalSec'
    | 'autoSubmitOnTimeout'
    | 'shuffleQuestions'
    | 'shuffleOptions'
  >;
  endsAt: Date | string;
  questions: ExamPaperQuestion[];
  attemptId: string;
  attemptNumber: number;
  status: ExamAttemptStatus;
}

export interface ExamAnswerItem {
  questionId: string;
  response?: string | string[] | null;
  flagged?: boolean;
  answeredAt?: Date | string | null;
}

export interface ExamAttemptPublic {
  id: string;
  tenantId: string;
  examId: string;
  studentId: string;
  allocationId?: string | null;
  status: ExamAttemptStatus;
  attemptNumber: number;
  startedAt: Date | string;
  submittedAt?: Date | string | null;
  endsAt: Date | string;
  answers: ExamAnswerItem[];
  marksObtained?: number | null;
  autoScore?: number | null;
  manualScore?: number | null;
  totalMarks?: number | null;
  suspicionScore: number;
  lastAutosaveAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExamSuspicionEventPublic {
  id: string;
  tenantId: string;
  examId: string;
  attemptId: string;
  studentId: string;
  type: SuspicionEventType;
  detail?: string | null;
  clientTimestamp?: Date | string | null;
  serverTimestamp: Date | string;
  metadata?: Record<string, unknown> | null;
}

export interface ExamResultPublic {
  attemptId: string;
  examId: string;
  status: ExamAttemptStatus;
  marksObtained: number;
  totalMarks: number;
  autoScore?: number | null;
  manualScore?: number | null;
  submittedAt?: Date | string | null;
  showBreakdown: boolean;
  /** Only when policy allows and graded */
  breakdown?: Array<{
    questionId: string;
    marks: number;
    marksAwarded: number;
    isCorrect?: boolean | null;
  }>;
}
