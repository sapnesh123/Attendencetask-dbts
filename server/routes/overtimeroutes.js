import express from 'express';
import * as attendanceController from '../controller/attendancecontroller.js';
import protect from '../midleware/authmidleware.js';
import { requireRole } from '../midleware/roleMiddleware.js';

const router = express.Router();

router.post('/request', protect, attendanceController.requestOvertime);
router.get('/my-requests', protect, attendanceController.getMyOvertimeRequests);

router.patch('/approve/:id', protect, requireRole('admin', 'manager'), attendanceController.approveOvertime);
router.patch('/reject/:id', protect, requireRole('admin', 'manager'), attendanceController.rejectOvertime);

export default router;
