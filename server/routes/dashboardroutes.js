import express from 'express';
import * as dashboardController from '../controller/dashboardcontroller.js';
import * as reportsController from '../controller/reportscontroller.js';
import protect from '../midleware/authmidleware.js';
import { requireRole } from '../midleware/roleMiddleware.js';

const router = express.Router();

router.get('/employee', protect, requireRole('employee'), dashboardController.getEmployeeDashboard);
router.get('/manager', protect, requireRole('manager', 'admin'), dashboardController.getManagerDashboard);
router.get('/admin', protect, requireRole('admin'), dashboardController.getAdminDashboard);

router.get('/reports/daily', protect, reportsController.getDailyAttendanceReport);
router.get('/reports/range', protect, reportsController.getDateRangeAttendanceReport);
router.get('/reports/overtime', protect, reportsController.getOvertimeReport);

router.get('/export/csv', protect, reportsController.exportAttendanceCSV);
router.get('/export/excel', protect, reportsController.exportAttendanceExcel);
router.get('/export/pdf', protect, reportsController.exportAttendancePDF);

export default router;
