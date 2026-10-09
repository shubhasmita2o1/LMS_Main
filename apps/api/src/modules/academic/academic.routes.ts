import { Router } from 'express';
import * as ctrl from './academic.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

/**
 * Academic hierarchy routes — all tenant-scoped.
 * Mounted under multiple prefixes from app.ts.
 */
export const academicRouter = Router();

academicRouter.use(authenticate, resolveTenant);

// Hierarchy tree + config
academicRouter.get('/tree', requirePermission('university', 'read'), ctrl.getTree);
academicRouter.get('/config', requirePermission('university', 'read'), ctrl.getConfig);
academicRouter.patch('/config', requirePermission('university', 'manage'), ctrl.updateConfig);

// Universities
academicRouter.get('/universities', requirePermission('university', 'read'), ctrl.listUniversities);
academicRouter.post(
  '/universities',
  requirePermission('university', 'create'),
  ctrl.createUniversity
);
academicRouter.get(
  '/universities/:id',
  requirePermission('university', 'read'),
  ctrl.getUniversity
);
academicRouter.patch(
  '/universities/:id',
  requirePermission('university', 'update'),
  ctrl.updateUniversity
);
academicRouter.delete(
  '/universities/:id',
  requirePermission('university', 'delete'),
  ctrl.deleteUniversity
);

// Campuses
academicRouter.get('/campuses', requirePermission('campus', 'read'), ctrl.listCampuses);
academicRouter.post('/campuses', requirePermission('campus', 'create'), ctrl.createCampus);
academicRouter.get('/campuses/:id', requirePermission('campus', 'read'), ctrl.getCampus);
academicRouter.patch('/campuses/:id', requirePermission('campus', 'update'), ctrl.updateCampus);
academicRouter.delete('/campuses/:id', requirePermission('campus', 'delete'), ctrl.deleteCampus);

// Schools
academicRouter.get('/schools', requirePermission('school', 'read'), ctrl.listSchools);
academicRouter.post('/schools', requirePermission('school', 'create'), ctrl.createSchool);
academicRouter.get('/schools/:id', requirePermission('school', 'read'), ctrl.getSchool);
academicRouter.patch('/schools/:id', requirePermission('school', 'update'), ctrl.updateSchool);
academicRouter.delete('/schools/:id', requirePermission('school', 'delete'), ctrl.deleteSchool);

// Departments
academicRouter.get('/departments', requirePermission('department', 'read'), ctrl.listDepartments);
academicRouter.post(
  '/departments',
  requirePermission('department', 'create'),
  ctrl.createDepartment
);
academicRouter.get(
  '/departments/:id',
  requirePermission('department', 'read'),
  ctrl.getDepartment
);
academicRouter.patch(
  '/departments/:id',
  requirePermission('department', 'update'),
  ctrl.updateDepartment
);
academicRouter.delete(
  '/departments/:id',
  requirePermission('department', 'delete'),
  ctrl.deleteDepartment
);
academicRouter.post(
  '/departments/:id/assign-hod',
  requirePermission('department', 'manage'),
  ctrl.assignHod
);

// Programs
academicRouter.get('/programs', requirePermission('program', 'read'), ctrl.listPrograms);
academicRouter.post('/programs', requirePermission('program', 'create'), ctrl.createProgram);
academicRouter.get('/programs/:id', requirePermission('program', 'read'), ctrl.getProgram);
academicRouter.patch('/programs/:id', requirePermission('program', 'update'), ctrl.updateProgram);
academicRouter.delete('/programs/:id', requirePermission('program', 'delete'), ctrl.deleteProgram);
academicRouter.post(
  '/programs/:id/assign-coordinator',
  requirePermission('program', 'manage'),
  ctrl.assignCoordinator
);

// Academic years
academicRouter.get(
  '/academic-years',
  requirePermission('university', 'read'),
  ctrl.listAcademicYears
);
academicRouter.post(
  '/academic-years',
  requirePermission('university', 'create'),
  ctrl.createAcademicYear
);
academicRouter.get(
  '/academic-years/:id',
  requirePermission('university', 'read'),
  ctrl.getAcademicYear
);
academicRouter.patch(
  '/academic-years/:id',
  requirePermission('university', 'update'),
  ctrl.updateAcademicYear
);
academicRouter.post(
  '/academic-years/:id/set-current',
  requirePermission('university', 'manage'),
  ctrl.setCurrentAcademicYear
);
academicRouter.delete(
  '/academic-years/:id',
  requirePermission('university', 'delete'),
  ctrl.deleteAcademicYear
);

// Semesters
academicRouter.get('/semesters', requirePermission('university', 'read'), ctrl.listSemesters);
academicRouter.post('/semesters', requirePermission('university', 'create'), ctrl.createSemester);
academicRouter.get('/semesters/:id', requirePermission('university', 'read'), ctrl.getSemester);
academicRouter.patch(
  '/semesters/:id',
  requirePermission('university', 'update'),
  ctrl.updateSemester
);
academicRouter.post(
  '/semesters/:id/set-current',
  requirePermission('university', 'manage'),
  ctrl.setCurrentSemester
);
academicRouter.delete(
  '/semesters/:id',
  requirePermission('university', 'delete'),
  ctrl.deleteSemester
);

// Batches
academicRouter.get('/batches', requirePermission('batch', 'read'), ctrl.listBatches);
academicRouter.post('/batches', requirePermission('batch', 'create'), ctrl.createBatch);
academicRouter.get('/batches/:id', requirePermission('batch', 'read'), ctrl.getBatch);
academicRouter.patch('/batches/:id', requirePermission('batch', 'update'), ctrl.updateBatch);
academicRouter.delete('/batches/:id', requirePermission('batch', 'delete'), ctrl.deleteBatch);

// Sections
academicRouter.get('/sections', requirePermission('section', 'read'), ctrl.listSections);
academicRouter.post('/sections', requirePermission('section', 'create'), ctrl.createSection);
academicRouter.get('/sections/:id', requirePermission('section', 'read'), ctrl.getSection);
academicRouter.patch('/sections/:id', requirePermission('section', 'update'), ctrl.updateSection);
academicRouter.delete('/sections/:id', requirePermission('section', 'delete'), ctrl.deleteSection);
academicRouter.post(
  '/sections/:id/assign-advisor',
  requirePermission('section', 'manage'),
  ctrl.assignAdvisor
);
