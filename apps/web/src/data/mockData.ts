export interface Tenant {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  logo: string;
  type: 'Research University' | 'Technology Institute' | 'Business School' | 'Medical College';
  accreditation: string;
  established: number;
  location: string;
  campusesCount: number;
  studentsCount: number;
  facultyCount: number;
  programsCount: number;
  status: 'active' | 'pending' | 'suspended';
  subscriptionPlan: 'Enterprise Tier' | 'Pro Academic' | 'Flagship Multi-Campus';
  renewalDate: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
}

export interface Campus {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isMainCampus: boolean;
  director: string;
  totalStudents: number;
  totalFaculty: number;
  status: 'active' | 'inactive';
}

export interface AcademicUnit {
  id: string;
  campusId: string;
  name: string;
  code: string;
  type: 'school' | 'department' | 'center';
  headName: string;
  headEmail: string;
  totalPrograms: number;
  totalFaculty: number;
}

export interface Program {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  code: string;
  degreeType: 'B.Tech' | 'M.Tech' | 'B.Sc' | 'M.Sc' | 'MBA' | 'MBBS' | 'Ph.D';
  durationYears: number;
  totalSemesters: number;
  totalCredits: number;
  currentBatches: number;
  status: 'active' | 'archived';
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  program: string;
  department: string;
  batch: string;
  semester: number;
  section: string;
  cgpa: number;
  attendancePercentage: number;
  feeStatus: 'Paid' | 'Partial' | 'Overdue';
  status: 'active' | 'on_leave' | 'graduated' | 'probation';
  admissionYear: number;
  dob: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  address: string;
}

export interface Faculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  designation: 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Adjunct Faculty';
  department: string;
  qualification: string;
  specialization: string;
  teachingLoadHours: number;
  status: 'active' | 'on_leave' | 'sabbatical';
  publicationsCount: number;
  experienceYears: number;
  joiningDate: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  type: 'Core' | 'Elective' | 'Lab' | 'Seminar';
  semester: number;
  instructorName: string;
  enrolledStudents: number;
  status: 'active' | 'draft' | 'archived';
  description: string;
  syllabusUnits: {
    unit: number;
    title: string;
    hours: number;
    topics: string[];
  }[];
  outcomes: string[];
}

export interface AssessmentItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  type: 'Assignment' | 'Quiz' | 'Project' | 'Lab Report';
  dueDate: string;
  maxScore: number;
  submittedCount: number;
  totalStudents: number;
  gradedCount: number;
  status: 'Published' | 'Grading' | 'Closed' | 'Draft';
  weightage: string;
}

export interface ExamRecord {
  id: string;
  examName: string;
  courseCode: string;
  courseName: string;
  date: string;
  timeSlot: string;
  room: string;
  totalCandidates: number;
  admitCardReleased: boolean;
  seatingPlanned: boolean;
  proctorName: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Marks Moderation';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseCode: string;
  courseName: string;
  batch: string;
  section: string;
  facultyName: string;
  totalPresent: number;
  totalAbsent: number;
  totalStrength: number;
  mode: 'Biometric + RFID' | 'Manual Register' | 'Mobile Geo-Fence';
}

export interface ResultGrade {
  id: string;
  studentRollNo: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  internalMarks: number;
  endSemMarks: number;
  totalMarks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
  gradePoints: number;
  status: 'Published' | 'Under Review' | 'Moderation Pending';
}

export interface AdmissionApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  programApplied: string;
  meritRank: number;
  entranceScore: number;
  quota: 'General' | 'OBC' | 'SC/ST' | 'EWS' | 'Sports / NRI';
  stage: 'Applied' | 'Under Review' | 'Counseling' | 'Seat Allocated' | 'Enrolled' | 'Rejected';
  appliedDate: string;
  documentsVerified: boolean;
  feePaid: boolean;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentRollNo: string;
  studentName: string;
  program: string;
  semester: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Overdue' | 'Waived';
  category: 'Tuition' | 'Hostel & Mess' | 'Lab & Library' | 'Examination';
}

export interface LibraryItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  status: 'Available' | 'Reserved' | 'Out of Stock';
  type: 'Physical Book' | 'E-Book / PDF' | 'Journal / Periodical';
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  logo: string;
  role: string;
  packageLPA: string;
  eligiblePrograms: string[];
  minCGPA: number;
  driveDate: string;
  registeredStudents: number;
  selectedCount: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Shortlisting';
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Academic' | 'Exam' | 'Emergency' | 'Placement' | 'Sports / Events';
  publishedAt: string;
  author: string;
  priority: 'Urgent' | 'High' | 'Normal';
  targetAudience: 'All Campus' | 'Undergraduates' | 'Faculty' | 'Postgraduates';
  content: string;
}

export interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  category:
    | 'LMS Access'
    | 'Fee Discrepancy'
    | 'Grade Correction'
    | 'Hostel & Wifi'
    | 'Library'
    | 'Network Access'
    | 'Classroom Tech'
    | 'General Query';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  creatorName: string;
  creatorRole: string;
  assignedTo: string;
  createdAt: string;
  slaDue: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'APPROVE';
  resourceType: string;
  resourceId: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-northridge',
    name: 'Northridge University',
    code: 'NRU',
    subdomain: 'northridge',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80',
    type: 'Research University',
    accreditation: 'NAAC A++ | ABET Accredited',
    established: 1968,
    location: 'Boston, Massachusetts, USA',
    campusesCount: 4,
    studentsCount: 14820,
    facultyCount: 840,
    programsCount: 58,
    status: 'active',
    subscriptionPlan: 'Enterprise Tier',
    renewalDate: '2027-08-31',
    contactEmail: 'administration@northridge.edu',
    contactPhone: '+1 (617) 555-0199',
    description: 'Premier tier-1 research institution renowned for engineering, computer science, and life sciences excellence.',
  },
  {
    id: 't-greenfield',
    name: 'Greenfield Institute of Technology',
    code: 'GIT',
    subdomain: 'greenfield-tech',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80',
    type: 'Technology Institute',
    accreditation: 'ABET | NBA Tier-1',
    established: 1985,
    location: 'San Jose, California, USA',
    campusesCount: 2,
    studentsCount: 9400,
    facultyCount: 520,
    programsCount: 34,
    status: 'active',
    subscriptionPlan: 'Flagship Multi-Campus',
    renewalDate: '2028-01-15',
    contactEmail: 'contact@git.edu',
    contactPhone: '+1 (408) 555-8900',
    description: 'Leading STEM institute focusing on artificial intelligence, robotics, aerospace engineering, and cyber-security.',
  },
  {
    id: 't-horizon',
    name: 'Horizon Business School',
    code: 'HBS',
    subdomain: 'horizon-biz',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
    type: 'Business School',
    accreditation: 'AACSB | AMBA | EQUIS Triple Crown',
    established: 1994,
    location: 'Chicago, Illinois, USA',
    campusesCount: 2,
    studentsCount: 4200,
    facultyCount: 210,
    programsCount: 18,
    status: 'active',
    subscriptionPlan: 'Pro Academic',
    renewalDate: '2026-12-31',
    contactEmail: 'dean@horizon.edu',
    contactPhone: '+1 (312) 555-4321',
    description: 'Top-ranked management school preparing executive leaders in fintech, strategy, entrepreneurship, and global logistics.',
  },
  {
    id: 't-lakeview',
    name: 'Lakeview Medical College & Research Center',
    code: 'LMC',
    subdomain: 'lakeview-med',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=120&auto=format&fit=crop&q=80',
    type: 'Medical College',
    accreditation: 'LCME | WHO Recognized',
    established: 1978,
    location: 'Minneapolis, Minnesota, USA',
    campusesCount: 3,
    studentsCount: 3600,
    facultyCount: 480,
    programsCount: 24,
    status: 'active',
    subscriptionPlan: 'Enterprise Tier',
    renewalDate: '2027-04-10',
    contactEmail: 'registrar@lakeviewmed.edu',
    contactPhone: '+1 (612) 555-7766',
    description: 'Comprehensive biomedical health sciences university with a 1,200-bed super-specialty teaching hospital.',
  },
];

export const MOCK_CAMPUSES: Campus[] = [
  {
    id: 'c-nru-main',
    tenantId: 't-northridge',
    name: 'Main Campus (Back Bay)',
    code: 'NRU-BOS',
    address: '750 Commonwealth Avenue',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    isMainCampus: true,
    director: 'Dr. Arthur Pendelton',
    totalStudents: 10200,
    totalFaculty: 580,
    status: 'active',
  },
  {
    id: 'c-nru-tech',
    tenantId: 't-northridge',
    name: 'Downtown Tech & Innovation Center',
    code: 'NRU-DTC',
    address: '100 Innovation Way',
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
    isMainCampus: false,
    director: 'Dr. Sarah Al-Mansoor',
    totalStudents: 2800,
    totalFaculty: 160,
    status: 'active',
  },
  {
    id: 'c-nru-health',
    tenantId: 't-northridge',
    name: 'Longwood Health Sciences Campus',
    code: 'NRU-HSC',
    address: '320 Brookline Avenue',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    isMainCampus: false,
    director: 'Dr. Robert C. Chang',
    totalStudents: 1820,
    totalFaculty: 100,
    status: 'active',
  },
  {
    id: 'c-git-sv',
    tenantId: 't-greenfield',
    name: 'Silicon Valley Campus',
    code: 'GIT-SV',
    address: '450 Technology Parkway',
    city: 'San Jose',
    state: 'CA',
    country: 'USA',
    isMainCampus: true,
    director: 'Prof. Ramesh Kulkarni',
    totalStudents: 6800,
    totalFaculty: 390,
    status: 'active',
  },
];

export const MOCK_ACADEMIC_UNITS: AcademicUnit[] = [
  {
    id: 'u-eng',
    campusId: 'c-nru-main',
    name: 'School of Engineering & Applied Sciences',
    code: 'SEAS',
    type: 'school',
    headName: 'Dr. Elizabeth Vance',
    headEmail: 'e.vance@northridge.edu',
    totalPrograms: 14,
    totalFaculty: 180,
  },
  {
    id: 'u-cs',
    campusId: 'c-nru-main',
    name: 'Department of Computer Science & Engineering',
    code: 'CSE',
    type: 'department',
    headName: 'Prof. Vikram Malhotra',
    headEmail: 'v.malhotra@northridge.edu',
    totalPrograms: 4,
    totalFaculty: 56,
  },
  {
    id: 'u-ece',
    campusId: 'c-nru-main',
    name: 'Department of Electrical & Electronics Engineering',
    code: 'ECE',
    type: 'department',
    headName: 'Dr. Sandra Oh',
    headEmail: 's.oh@northridge.edu',
    totalPrograms: 3,
    totalFaculty: 38,
  },
  {
    id: 'u-mech',
    campusId: 'c-nru-main',
    name: 'Department of Mechanical & Aerospace',
    code: 'MAE',
    type: 'department',
    headName: 'Prof. Daniel Sterling',
    headEmail: 'd.sterling@northridge.edu',
    totalPrograms: 3,
    totalFaculty: 42,
  },
];

export const MOCK_PROGRAMS: Program[] = [
  {
    id: 'p-btech-cse',
    departmentId: 'u-cs',
    departmentName: 'Computer Science & Engineering',
    name: 'B.Tech in Computer Science & Engineering',
    code: 'BTECH-CSE',
    degreeType: 'B.Tech',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    currentBatches: 4,
    status: 'active',
  },
  {
    id: 'p-btech-ai',
    departmentId: 'u-cs',
    departmentName: 'Computer Science & Engineering',
    name: 'B.Tech in Artificial Intelligence & Machine Learning',
    code: 'BTECH-AIML',
    degreeType: 'B.Tech',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 164,
    currentBatches: 3,
    status: 'active',
  },
  {
    id: 'p-mtech-cs',
    departmentId: 'u-cs',
    departmentName: 'Computer Science & Engineering',
    name: 'M.Tech in Advanced Computing & Cloud Systems',
    code: 'MTECH-CS',
    degreeType: 'M.Tech',
    durationYears: 2,
    totalSemesters: 4,
    totalCredits: 80,
    currentBatches: 2,
    status: 'active',
  },
  {
    id: 'p-btech-ece',
    departmentId: 'u-ece',
    departmentName: 'Electrical & Electronics Engineering',
    name: 'B.Tech in Electronics & VLSI Design',
    code: 'BTECH-VLSI',
    degreeType: 'B.Tech',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    currentBatches: 4,
    status: 'active',
  },
  {
    id: 'p-mba-fin',
    departmentId: 'u-eng',
    departmentName: 'Business School',
    name: 'Master of Business Administration (Fintech & Analytics)',
    code: 'MBA-FIN',
    degreeType: 'MBA',
    durationYears: 2,
    totalSemesters: 4,
    totalCredits: 96,
    currentBatches: 2,
    status: 'active',
  },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-101',
    rollNo: '2023CSE0101',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@student.northridge.edu',
    phone: '+1 (617) 555-8120',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2023-2027',
    semester: 5,
    section: 'CSE-A',
    cgpa: 3.88,
    attendancePercentage: 92.4,
    feeStatus: 'Paid',
    status: 'active',
    admissionYear: 2023,
    dob: '2004-04-12',
    gender: 'Female',
    parentName: 'Robert Hayes',
    parentPhone: '+1 (617) 555-8101',
    address: '42 Beacon St, Boston, MA 02108',
  },
  {
    id: 'stu-102',
    rollNo: '2023CSE0102',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.northridge.edu',
    phone: '+1 (617) 555-8121',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2023-2027',
    semester: 5,
    section: 'CSE-A',
    cgpa: 3.94,
    attendancePercentage: 96.0,
    feeStatus: 'Paid',
    status: 'active',
    admissionYear: 2023,
    dob: '2003-11-20',
    gender: 'Male',
    parentName: 'Sunil Patel',
    parentPhone: '+1 (617) 555-8102',
    address: '15 Commonwealth Ave, Newton, MA 02458',
  },
  {
    id: 'stu-103',
    rollNo: '2023CSE0103',
    name: 'Chloe Tremblay',
    email: 'chloe.t@student.northridge.edu',
    phone: '+1 (617) 555-8122',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2023-2027',
    semester: 5,
    section: 'CSE-B',
    cgpa: 3.65,
    attendancePercentage: 84.5,
    feeStatus: 'Partial',
    status: 'active',
    admissionYear: 2023,
    dob: '2004-01-18',
    gender: 'Female',
    parentName: 'Jean Tremblay',
    parentPhone: '+1 (617) 555-8103',
    address: '88 Cambridge Pkwy, Cambridge, MA 02142',
  },
  {
    id: 'stu-104',
    rollNo: '2023CSE0104',
    name: 'Mateo Rossi',
    email: 'm.rossi@student.northridge.edu',
    phone: '+1 (617) 555-8123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Artificial Intelligence',
    department: 'Computer Science & Engineering',
    batch: '2023-2027',
    semester: 5,
    section: 'AIML-A',
    cgpa: 3.42,
    attendancePercentage: 71.8,
    feeStatus: 'Overdue',
    status: 'probation',
    admissionYear: 2023,
    dob: '2004-06-30',
    gender: 'Male',
    parentName: 'Marco Rossi',
    parentPhone: '+1 (617) 555-8104',
    address: '110 Harvard St, Brookline, MA 02446',
  },
  {
    id: 'stu-105',
    rollNo: '2022CSE0045',
    name: 'Zoe Washington',
    email: 'zoe.w@student.northridge.edu',
    phone: '+1 (617) 555-8124',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2022-2026',
    semester: 7,
    section: 'CSE-A',
    cgpa: 3.91,
    attendancePercentage: 94.2,
    feeStatus: 'Paid',
    status: 'active',
    admissionYear: 2022,
    dob: '2003-03-15',
    gender: 'Female',
    parentName: 'Eleanor Washington',
    parentPhone: '+1 (617) 555-8105',
    address: '77 Boylston St, Boston, MA 02116',
  },
  {
    id: 'stu-106',
    rollNo: '2024CSE0210',
    name: 'David Kim',
    email: 'david.kim@student.northridge.edu',
    phone: '+1 (617) 555-8125',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    program: 'B.Tech in Computer Science',
    department: 'Computer Science & Engineering',
    batch: '2024-2028',
    semester: 3,
    section: 'CSE-C',
    cgpa: 3.78,
    attendancePercentage: 89.0,
    feeStatus: 'Paid',
    status: 'active',
    admissionYear: 2024,
    dob: '2005-08-04',
    gender: 'Male',
    parentName: 'Min-Soo Kim',
    parentPhone: '+1 (617) 555-8106',
    address: '250 Somerville Ave, Somerville, MA 02143',
  },
];

export const MOCK_FACULTY: Faculty[] = [
  {
    id: 'fac-201',
    employeeId: 'EMP-CS-01',
    name: 'Prof. Elena Rostova',
    email: 'faculty.cs@northridge.edu',
    phone: '+1 (617) 555-7001',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    designation: 'Professor',
    department: 'Computer Science & Engineering',
    qualification: 'Ph.D. in Distributed Systems (MIT)',
    specialization: 'Cloud Architecture & Distributed Algorithms',
    teachingLoadHours: 14,
    status: 'active',
    publicationsCount: 38,
    experienceYears: 16,
    joiningDate: '2012-08-15',
  },
  {
    id: 'fac-202',
    employeeId: 'EMP-CS-02',
    name: 'Prof. Vikram Malhotra',
    email: 'hod.cse@northridge.edu',
    phone: '+1 (617) 555-7002',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    designation: 'Professor',
    department: 'Computer Science & Engineering',
    qualification: 'Ph.D. in Computer Science (Stanford)',
    specialization: 'Machine Learning & Neural Architectures',
    teachingLoadHours: 10,
    status: 'active',
    publicationsCount: 52,
    experienceYears: 21,
    joiningDate: '2008-07-01',
  },
  {
    id: 'fac-203',
    employeeId: 'EMP-CS-03',
    name: 'Dr. Marcus Vance',
    email: 'm.vance@northridge.edu',
    phone: '+1 (617) 555-7003',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    qualification: 'Ph.D. in Cyber Security (Carnegie Mellon)',
    specialization: 'Cryptographic Protocols & Zero-Trust Security',
    teachingLoadHours: 16,
    status: 'active',
    publicationsCount: 24,
    experienceYears: 11,
    joiningDate: '2016-09-01',
  },
  {
    id: 'fac-204',
    employeeId: 'EMP-CS-04',
    name: 'Dr. Ananya Sen',
    email: 'a.sen@northridge.edu',
    phone: '+1 (617) 555-7004',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    designation: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    qualification: 'Ph.D. in Data Systems (UC Berkeley)',
    specialization: 'Database Internals & Real-time Query Engines',
    teachingLoadHours: 18,
    status: 'active',
    publicationsCount: 15,
    experienceYears: 6,
    joiningDate: '2020-01-10',
  },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'crs-301',
    code: 'CS301',
    title: 'Operating Systems & Kernel Architecture',
    department: 'Computer Science & Engineering',
    credits: 4.0,
    type: 'Core',
    semester: 5,
    instructorName: 'Prof. Elena Rostova',
    enrolledStudents: 142,
    status: 'active',
    description: 'Comprehensive study of multiprocessor scheduling, virtual memory paging, POSIX concurrency, file system internals, and Linux kernel device drivers.',
    syllabusUnits: [
      { unit: 1, title: 'Process Management & Context Switching', hours: 10, topics: ['Processes vs Threads', 'CPU Scheduling Algorithms', 'Real-Time Extensions'] },
      { unit: 2, title: 'Synchronization & Deadlocks', hours: 12, topics: ['Mutexes & Semaphores', 'Peterson Algorithm', 'Banker Algorithm'] },
      { unit: 3, title: 'Virtual Memory & Page Replacement', hours: 12, topics: ['TLB Caches', 'Demand Paging', 'Clock Algorithm & Working Set'] },
      { unit: 4, title: 'Storage & Distributed File Systems', hours: 10, topics: ['Ext4 Inodes', 'ZFS Architecture', 'NFS & Ceph Storage'] },
    ],
    outcomes: [
      'CO1: Analyze multiprocessor concurrency and race condition mitigation strategies.',
      'CO2: Evaluate hardware memory translation and page replacement tradeoffs.',
      'CO3: Implement UNIX system calls for IPC, pipes, and shared memory segments.',
      'CO4: Design scalable virtual file system interfaces.',
    ],
  },
  {
    id: 'crs-302',
    code: 'CS302',
    title: 'Distributed Databases & Big Data Systems',
    department: 'Computer Science & Engineering',
    credits: 4.0,
    type: 'Core',
    semester: 5,
    instructorName: 'Dr. Ananya Sen',
    enrolledStudents: 138,
    status: 'active',
    description: 'Modern distributed data store principles: CAP theorem, Paxos/Raft consensus, multi-version concurrency control (MVCC), LSM trees, and Apache Kafka event streaming.',
    syllabusUnits: [
      { unit: 1, title: 'Foundations of Distributed Storage', hours: 10, topics: ['CAP & PACELC Theorems', 'Eventual Consistency', 'Vector Clocks'] },
      { unit: 2, title: 'Consensus Protocols', hours: 12, topics: ['Raft Leader Election', 'Multi-Paxos', 'Byzantine Fault Tolerance'] },
      { unit: 3, title: 'Storage Engines & Indexing', hours: 12, topics: ['B+ Trees vs LSM Trees', 'Write-Ahead Logs', 'Bloom Filters'] },
      { unit: 4, title: 'Stream Processing Pipelines', hours: 10, topics: ['Kafka Partitions', 'Exactly-Once Semantics', 'Windowed Aggregations'] },
    ],
    outcomes: [
      'CO1: Explain distributed consensus guarantees in partitioned networks.',
      'CO2: Benchmark write amplification across B-Trees and LSM Trees.',
      'CO3: Formulate high-throughput sharding and partition schemes.',
    ],
  },
  {
    id: 'crs-303',
    code: 'CS303',
    title: 'Applied Machine Learning & Deep Neural Nets',
    department: 'Computer Science & Engineering',
    credits: 3.5,
    type: 'Core',
    semester: 5,
    instructorName: 'Prof. Vikram Malhotra',
    enrolledStudents: 160,
    status: 'active',
    description: 'Mathematical foundations of gradient descent, backpropagation, convolutional networks, attention transformers, and self-supervised foundation model fine-tuning.',
    syllabusUnits: [
      { unit: 1, title: 'Optimization & Linear Algebra Foundations', hours: 8, topics: ['Stochastic Gradient Descent', 'Regularization (L1/L2)', 'Adam Optimizer'] },
      { unit: 2, title: 'Deep Feedforward & CNN Architectures', hours: 12, topics: ['ResNet Residual Connections', 'Batch Normalization', 'Feature Maps'] },
      { unit: 3, title: 'Sequence Modeling & Transformers', hours: 14, topics: ['Multi-Head Self-Attention', 'Positional Encodings', 'BERT & GPT Paradigms'] },
    ],
    outcomes: [
      'CO1: Derive backpropagation gradients for multi-layer perceptrons.',
      'CO2: Train and evaluate transformer models on domain datasets.',
      'CO3: Apply LoRA and quantization for efficient inference on edge accelerators.',
    ],
  },
  {
    id: 'crs-304',
    code: 'CS304L',
    title: 'Operating Systems & Systems Programming Lab',
    department: 'Computer Science & Engineering',
    credits: 2.0,
    type: 'Lab',
    semester: 5,
    instructorName: 'Prof. Elena Rostova',
    enrolledStudents: 142,
    status: 'active',
    description: 'Hands-on practical implementation of custom shell interpreters, kernel loadable modules (LKM), pthread barriers, and virtual page fault instrumentation in C/Rust.',
    syllabusUnits: [
      { unit: 1, title: 'POSIX Concurrency Lab', hours: 16, topics: ['Pthreads', 'Reader-Writer Locks', 'Barrier Synchronization'] },
      { unit: 2, title: 'Kernel Modules & Memory Mapping', hours: 16, topics: ['mmap() internals', 'Writing /proc entries', 'Custom Character Device Drivers'] },
    ],
    outcomes: [
      'CO1: Write bug-free concurrent programs using atomic operations and semaphores.',
      'CO2: Build a functional Linux kernel character driver.',
    ],
  },
];

export const MOCK_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 'ass-401',
    title: 'Assignment 3: Multithreaded Web Crawler & LRU Cache',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    type: 'Assignment',
    dueDate: '2026-10-28',
    maxScore: 100,
    submittedCount: 128,
    totalStudents: 142,
    gradedCount: 95,
    status: 'Grading',
    weightage: '15% of Internal',
  },
  {
    id: 'ass-402',
    title: 'Mid-Semester Quiz: Synchronization & Memory Paging',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    type: 'Quiz',
    dueDate: '2026-10-22',
    maxScore: 50,
    submittedCount: 140,
    totalStudents: 142,
    gradedCount: 140,
    status: 'Closed',
    weightage: '10% of Internal',
  },
  {
    id: 'ass-403',
    title: 'Term Project Milestone 2: Raft Consensus Cluster',
    courseCode: 'CS302',
    courseName: 'Distributed Databases',
    type: 'Project',
    dueDate: '2026-11-15',
    maxScore: 150,
    submittedCount: 32,
    totalStudents: 138,
    gradedCount: 0,
    status: 'Published',
    weightage: '25% of Total',
  },
  {
    id: 'ass-404',
    title: 'Lab Observation 4: Custom Kernel /proc Driver',
    courseCode: 'CS304L',
    courseName: 'Systems Programming Lab',
    type: 'Lab Report',
    dueDate: '2026-10-30',
    maxScore: 25,
    submittedCount: 110,
    totalStudents: 142,
    gradedCount: 40,
    status: 'Published',
    weightage: '10% of Lab Grade',
  },
];

export const MOCK_EXAMS: ExamRecord[] = [
  {
    id: 'ex-501',
    examName: 'Fall 2026 Mid-Term Examination',
    courseCode: 'CS301',
    courseName: 'Operating Systems & Kernel Architecture',
    date: '2026-11-04',
    timeSlot: '09:30 AM - 12:30 PM',
    room: 'Hall A-102 (Seating 80), Hall A-103 (Seating 70)',
    totalCandidates: 142,
    admitCardReleased: true,
    seatingPlanned: true,
    proctorName: 'Dr. Marcus Vance, Dr. Ananya Sen',
    status: 'Scheduled',
  },
  {
    id: 'ex-502',
    examName: 'Fall 2026 Mid-Term Examination',
    courseCode: 'CS302',
    courseName: 'Distributed Databases & Big Data',
    date: '2026-11-06',
    timeSlot: '02:00 PM - 05:00 PM',
    room: 'Auditorium Main (Seating 200)',
    totalCandidates: 138,
    admitCardReleased: true,
    seatingPlanned: true,
    proctorName: 'Prof. Vikram Malhotra, Prof. Daniel Sterling',
    status: 'Scheduled',
  },
  {
    id: 'ex-503',
    examName: 'Fall 2026 Mid-Term Examination',
    courseCode: 'CS303',
    courseName: 'Applied Machine Learning',
    date: '2026-11-09',
    timeSlot: '09:30 AM - 12:30 PM',
    room: 'Hall B-201, Hall B-202',
    totalCandidates: 160,
    admitCardReleased: false,
    seatingPlanned: true,
    proctorName: 'Dr. Sandra Oh, Prof. Elena Rostova',
    status: 'Scheduled',
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-601',
    date: '2026-10-15',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    batch: '2023-2027',
    section: 'CSE-A',
    facultyName: 'Prof. Elena Rostova',
    totalPresent: 68,
    totalAbsent: 4,
    totalStrength: 72,
    mode: 'Biometric + RFID',
  },
  {
    id: 'att-602',
    date: '2026-10-15',
    courseCode: 'CS302',
    courseName: 'Distributed Databases',
    batch: '2023-2027',
    section: 'CSE-A',
    facultyName: 'Dr. Ananya Sen',
    totalPresent: 65,
    totalAbsent: 7,
    totalStrength: 72,
    mode: 'Biometric + RFID',
  },
  {
    id: 'att-603',
    date: '2026-10-14',
    courseCode: 'CS304L',
    courseName: 'Systems Lab (Batch 1)',
    batch: '2023-2027',
    section: 'CSE-A1',
    facultyName: 'Prof. Elena Rostova',
    totalPresent: 36,
    totalAbsent: 0,
    totalStrength: 36,
    mode: 'Manual Register',
  },
];

export const MOCK_RESULTS: ResultGrade[] = [
  {
    id: 'res-701',
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    internalMarks: 47,
    endSemMarks: 48,
    totalMarks: 95,
    grade: 'O',
    gradePoints: 10,
    status: 'Published',
  },
  {
    id: 'res-702',
    studentRollNo: '2023CSE0102',
    studentName: 'Aarav Patel',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    internalMarks: 49,
    endSemMarks: 49,
    totalMarks: 98,
    grade: 'O',
    gradePoints: 10,
    status: 'Published',
  },
  {
    id: 'res-703',
    studentRollNo: '2023CSE0103',
    studentName: 'Chloe Tremblay',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    internalMarks: 41,
    endSemMarks: 43,
    totalMarks: 84,
    grade: 'A+',
    gradePoints: 9,
    status: 'Published',
  },
  {
    id: 'res-704',
    studentRollNo: '2023CSE0104',
    studentName: 'Mateo Rossi',
    courseCode: 'CS301',
    courseName: 'Operating Systems',
    internalMarks: 32,
    endSemMarks: 36,
    totalMarks: 68,
    grade: 'B+',
    gradePoints: 7,
    status: 'Under Review',
  },
];

export const MOCK_ADMISSIONS: AdmissionApplication[] = [
  {
    id: 'adm-801',
    applicantName: 'Samantha Wu',
    email: 'sam.wu99@gmail.com',
    phone: '+1 (617) 555-9201',
    programApplied: 'B.Tech in Artificial Intelligence',
    meritRank: 42,
    entranceScore: 98.4,
    quota: 'General',
    stage: 'Seat Allocated',
    appliedDate: '2026-06-15',
    documentsVerified: true,
    feePaid: true,
  },
  {
    id: 'adm-802',
    applicantName: 'Tariq Al-Fassi',
    email: 'tariq.fassi@yahoo.com',
    phone: '+1 (617) 555-9202',
    programApplied: 'B.Tech in Computer Science',
    meritRank: 115,
    entranceScore: 94.8,
    quota: 'General',
    stage: 'Counseling',
    appliedDate: '2026-06-18',
    documentsVerified: true,
    feePaid: false,
  },
  {
    id: 'adm-803',
    applicantName: 'Priya Sharma',
    email: 'priya.sharma@outlook.com',
    phone: '+1 (617) 555-9203',
    programApplied: 'M.Tech in Advanced Computing',
    meritRank: 18,
    entranceScore: 99.1,
    quota: 'General',
    stage: 'Enrolled',
    appliedDate: '2026-05-30',
    documentsVerified: true,
    feePaid: true,
  },
  {
    id: 'adm-804',
    applicantName: 'Liam O’Connor',
    email: 'liam.oc@gmail.com',
    phone: '+1 (617) 555-9204',
    programApplied: 'B.Tech in Computer Science',
    meritRank: 410,
    entranceScore: 82.3,
    quota: 'Sports / NRI',
    stage: 'Under Review',
    appliedDate: '2026-07-01',
    documentsVerified: false,
    feePaid: false,
  },
];

export const MOCK_FEES: FeeInvoice[] = [
  {
    id: 'fee-901',
    invoiceNo: 'INV-2026-00891',
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    program: 'B.Tech CSE',
    semester: 'Semester 5',
    amount: 8500,
    dueDate: '2026-08-15',
    paidAmount: 8500,
    status: 'Paid',
    category: 'Tuition',
  },
  {
    id: 'fee-902',
    invoiceNo: 'INV-2026-00892',
    studentRollNo: '2023CSE0103',
    studentName: 'Chloe Tremblay',
    program: 'B.Tech CSE',
    semester: 'Semester 5',
    amount: 8500,
    dueDate: '2026-08-15',
    paidAmount: 4250,
    status: 'Partially Paid',
    category: 'Tuition',
  },
  {
    id: 'fee-903',
    invoiceNo: 'INV-2026-00893',
    studentRollNo: '2023CSE0104',
    studentName: 'Mateo Rossi',
    program: 'B.Tech AIML',
    semester: 'Semester 5',
    amount: 8500,
    dueDate: '2026-08-15',
    paidAmount: 0,
    status: 'Overdue',
    category: 'Tuition',
  },
  {
    id: 'fee-904',
    invoiceNo: 'INV-2026-00894',
    studentRollNo: '2023CSE0101',
    studentName: 'Jordan Hayes',
    program: 'B.Tech CSE',
    semester: 'Semester 5',
    amount: 1200,
    dueDate: '2026-09-01',
    paidAmount: 1200,
    status: 'Paid',
    category: 'Hostel & Mess',
  },
];

export const MOCK_LIBRARY: LibraryItem[] = [
  {
    id: 'lib-1001',
    isbn: '978-0133591620',
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau',
    category: 'Computer Systems',
    shelfLocation: 'Stack CS-4 / Row 12',
    totalCopies: 25,
    availableCopies: 8,
    status: 'Available',
    type: 'Physical Book',
  },
  {
    id: 'lib-1002',
    isbn: '978-1491903070',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Distributed Systems',
    shelfLocation: 'Stack CS-2 / Row 04',
    totalCopies: 30,
    availableCopies: 14,
    status: 'Available',
    type: 'Physical Book',
  },
  {
    id: 'lib-1003',
    isbn: '978-0262035613',
    title: 'Deep Learning (Adaptive Computation and Machine Learning)',
    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    category: 'Artificial Intelligence',
    shelfLocation: 'Digital Repository (ACM DL)',
    totalCopies: 500,
    availableCopies: 492,
    status: 'Available',
    type: 'E-Book / PDF',
  },
  {
    id: 'lib-1004',
    isbn: '978-0131103627',
    title: 'The C Programming Language (2nd Edition)',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    category: 'Programming Languages',
    shelfLocation: 'Stack CS-1 / Row 02',
    totalCopies: 40,
    availableCopies: 0,
    status: 'Out of Stock',
    type: 'Physical Book',
  },
];

export const MOCK_PLACEMENTS: PlacementDrive[] = [
  {
    id: 'plc-1101',
    companyName: 'Google LLC',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80',
    role: 'Software Development Engineer I (Cloud Infrastructure)',
    packageLPA: '$165,000 / yr',
    eligiblePrograms: ['B.Tech CSE', 'B.Tech AIML', 'M.Tech CS'],
    minCGPA: 3.75,
    driveDate: '2026-11-12',
    registeredStudents: 86,
    selectedCount: 8,
    status: 'Ongoing',
  },
  {
    id: 'plc-1102',
    companyName: 'Microsoft Corporation',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    role: 'Systems Engineer & Azure Core Platform',
    packageLPA: '$158,000 / yr',
    eligiblePrograms: ['B.Tech CSE', 'B.Tech ECE'],
    minCGPA: 3.5,
    driveDate: '2026-11-18',
    registeredStudents: 112,
    selectedCount: 14,
    status: 'Upcoming',
  },
  {
    id: 'plc-1103',
    companyName: 'Stripe, Inc.',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80',
    role: 'Backend Distributed Infrastructure Engineer',
    packageLPA: '$170,000 / yr',
    eligiblePrograms: ['B.Tech CSE', 'M.Tech CS'],
    minCGPA: 3.8,
    driveDate: '2026-10-04',
    registeredStudents: 64,
    selectedCount: 5,
    status: 'Completed',
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1201',
    title: 'Final Schedule: Fall 2026 Mid-Semester Examinations Released',
    category: 'Exam',
    publishedAt: '2026-10-14 10:30 AM',
    author: 'Office of the Controller of Examinations',
    priority: 'Urgent',
    targetAudience: 'All Campus',
    content: 'The official timetable for Mid-Semester examinations across all undergraduate and postgraduate engineering programs is now live. Hall tickets will be downloadable via the LMS starting October 20th. Strict identity verification will be enforced at all hall entrances.',
  },
  {
    id: 'anc-1202',
    title: 'Google & Microsoft Campus Placement Drive Registration Deadline',
    category: 'Placement',
    publishedAt: '2026-10-12 04:15 PM',
    author: 'Career & Placement Cell',
    priority: 'High',
    targetAudience: 'Undergraduates',
    content: 'All graduating batch students meeting the minimum 3.5 CGPA threshold are required to upload their validated resume in ATS format before Friday 5:00 PM. No late submissions will be accepted by company recruitment coordinators.',
  },
  {
    id: 'anc-1203',
    title: 'ACM Distinguished Lecture: Future of Quantum Computing by Dr. Peter Shor',
    category: 'Academic',
    publishedAt: '2026-10-10 09:00 AM',
    author: 'Dept of Computer Science & Engineering',
    priority: 'Normal',
    targetAudience: 'All Campus',
    content: 'Join us at the Main University Auditorium or via live LMS stream for this semester keynote presentation on fault-tolerant quantum error correction and polynomial-time factorization.',
  },
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1301',
    ticketNo: 'HD-9842',
    subject: 'Virtual Lab Container Fails to Bind Port 8080 in OS Lab',
    category: 'LMS Access',
    priority: 'High',
    status: 'In Progress',
    creatorName: 'Jordan Hayes',
    creatorRole: 'Student',
    assignedTo: 'Systems Engineering Team',
    createdAt: '2026-10-15 09:12 AM',
    slaDue: '4 hours remaining',
  },
  {
    id: 'tkt-1302',
    ticketNo: 'HD-9839',
    subject: 'Fee Receipt Discrepancy for Fall Semester Installment #2',
    category: 'Fee Discrepancy',
    priority: 'Medium',
    status: 'Open',
    creatorName: 'Chloe Tremblay',
    creatorRole: 'Student',
    assignedTo: 'Bursar & Accounts Office',
    createdAt: '2026-10-14 02:45 PM',
    slaDue: '18 hours remaining',
  },
  {
    id: 'tkt-1303',
    ticketNo: 'HD-9820',
    subject: 'Request for Grade Moderation Review — Applied ML CS303',
    category: 'Grade Correction',
    priority: 'Low',
    status: 'Resolved',
    creatorName: 'Mateo Rossi',
    creatorRole: 'Student',
    assignedTo: 'Dr. Sarah Jenkins (Exam Controller)',
    createdAt: '2026-10-11 11:30 AM',
    slaDue: 'Resolved within SLA',
  },
];

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1401',
    timestamp: '2026-10-15 11:42:19',
    actorName: 'Dr. Elizabeth Vance',
    actorRole: 'University Admin',
    ipAddress: '192.168.10.45',
    action: 'APPROVE',
    resourceType: 'Curriculum & Syllabi',
    resourceId: 'CS301-REV-2026',
    details: 'Approved Outcome-Based Education (OBE) course outcomes CO1-CO4 mapping matrix.',
    severity: 'medium',
  },
  {
    id: 'aud-1402',
    timestamp: '2026-10-15 10:15:02',
    actorName: 'Prof. Elena Rostova',
    actorRole: 'Faculty',
    ipAddress: '192.168.14.88',
    action: 'UPDATE',
    resourceType: 'Attendance Register',
    resourceId: 'CS301-SEC-A-OCT15',
    details: 'Locked attendance register with 68 present and 4 absent records.',
    severity: 'low',
  },
  {
    id: 'aud-1403',
    timestamp: '2026-10-15 09:00:11',
    actorName: 'Dr. Alexander Wright',
    actorRole: 'Super Admin',
    ipAddress: '10.0.4.12',
    action: 'CREATE',
    resourceType: 'Tenant Subscription',
    resourceId: 't-greenfield',
    details: 'Extended enterprise license seats to 12,000 concurrent active users.',
    severity: 'high',
  },
  {
    id: 'aud-1404',
    timestamp: '2026-10-14 16:30:45',
    actorName: 'Marcus Holloway',
    actorRole: 'Registrar',
    ipAddress: '192.168.10.12',
    action: 'EXPORT',
    resourceType: 'Accreditation Metrics',
    resourceId: 'NAAC-SSR-2026',
    details: 'Generated and exported complete Criterion 1 through 7 compliance bundle to PDF/XLSX.',
    severity: 'medium',
  },
];
