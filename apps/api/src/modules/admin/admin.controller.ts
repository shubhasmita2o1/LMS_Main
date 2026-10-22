import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../tenants/tenant.model';
import { User } from '../users/user.model';
import { Student } from '../students/student.model';
import { Faculty } from '../faculty/faculty.model';
import { Course } from '../courses/course.model';
import { Department, Program } from '../academic/academic.models';

export async function overviewStats(req: Request, res: Response, next: NextFunction) {
  try {
    const isSuperAdmin = req.user?.roles.includes('super_admin');
    const tenantIdStr = req.tenantId || (req.user?.tenantId ? String(req.user.tenantId) : null);

    if (isSuperAdmin && !tenantIdStr) {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        pendingUsers,
        totalCourses,
        totalStudents,
        totalFaculty,
      ] = await Promise.all([
        Tenant.countDocuments({ isDeleted: false }),
        Tenant.countDocuments({ isDeleted: false, status: 'active' }),
        User.countDocuments({ isDeleted: false }),
        User.countDocuments({ isDeleted: false, approvalStatus: 'pending' }),
        Course.countDocuments({ isDeleted: false }),
        Student.countDocuments({ isDeleted: false }),
        Faculty.countDocuments({ isDeleted: false }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          scope: 'platform',
          totalTenants,
          activeTenants,
          totalUsers,
          pendingUsers,
          totalCourses,
          totalStudents,
          totalFaculty,
        },
      });
    }

    if (!tenantIdStr) {
      return res.status(200).json({
        success: true,
        data: {
          scope: 'tenant',
          totalStudents: 0,
          totalFaculty: 0,
          totalCourses: 0,
          pendingUsers: 0,
          totalUsers: 0,
          totalDepartments: 0,
          totalPrograms: 0,
        },
      });
    }

    const tOid = new mongoose.Types.ObjectId(tenantIdStr);
    const filter = { tenantId: tOid, isDeleted: false };

    const [
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      totalCourses,
      activeCourses,
      pendingUsers,
      totalUsers,
      totalDepartments,
      totalPrograms,
    ] = await Promise.all([
      Student.countDocuments(filter),
      Student.countDocuments({ ...filter, status: 'active' }),
      Faculty.countDocuments(filter),
      Faculty.countDocuments({ ...filter, status: 'active' }),
      Course.countDocuments(filter),
      Course.countDocuments({ ...filter, status: 'active' }),
      User.countDocuments({ tenantId: tOid, isDeleted: false, approvalStatus: 'pending' }),
      User.countDocuments({ tenantId: tOid, isDeleted: false }),
      Department.countDocuments(filter),
      Program.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        scope: 'tenant',
        tenantId: tenantIdStr,
        totalStudents,
        activeStudents,
        totalFaculty,
        activeFaculty,
        totalCourses,
        activeCourses,
        pendingUsers,
        totalUsers,
        totalDepartments,
        totalPrograms,
      },
    });
  } catch (err) {
    next(err);
  }
}
