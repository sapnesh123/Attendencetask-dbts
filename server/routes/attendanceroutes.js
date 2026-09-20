import express from 'express';
import * as attendanceController from '../controller/attendancecontroller.js';
import protect from '../midleware/authmidleware.js';
import { requireRole } from '../midleware/roleMiddleware.js';

const router = express.Router();

router.post('/punch-in', protect, attendanceController.punchIn);
router.post('/punch-out', protect, attendanceController.punchOut);

router.get('/today', protect, attendanceController.getTodayAttendance);
router.get('/my', protect, attendanceController.getMyAttendance);

router.get('/user/:userId', protect, requireRole('admin', 'manager'), attendanceController.getUserAttendance);
router.patch('/verify/:id', protect, requireRole('admin', 'manager'), attendanceController.verifyAttendance);
router.get('/:id', protect, attendanceController.getAttendanceById);

export default router;
