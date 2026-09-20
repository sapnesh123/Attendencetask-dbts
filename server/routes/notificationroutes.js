import express from 'express';
import * as notificationController from '../controller/notificationcontroller.js';
import protect from '../midleware/authmidleware.js';

const router = express.Router();

router.get('/my', protect, notificationController.getMyNotifications);
router.patch('/:id/read', protect, notificationController.markAsRead);
router.patch('/read-all', protect, notificationController.markAllAsRead);

export default router;
