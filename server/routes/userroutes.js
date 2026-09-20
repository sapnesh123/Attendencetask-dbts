import express from 'express';
import * as userController from '../controller/usercontroller.js';
import protect from '../midleware/authmidleware.js';
import { requireRole } from '../midleware/roleMiddleware.js';

const router = express.Router();

router.get('/all', protect, requireRole('admin', 'manager'), userController.getAllUsers);
router.get('/:id', protect, userController.getUserById);
router.patch('/:id', protect, userController.updateUser);
router.patch('/:id/role', protect, requireRole('admin'), userController.updateUserRole);
router.delete('/:id', protect, requireRole('admin'), userController.deleteUser);

router.get('/team/members', protect, requireRole('manager', 'admin'), userController.getTeamMembers);

export default router;
