import express from 'express'
import * as authcontroller from '../controller/authcontroller.js'
import { adminLoginValidation, adminvalidation } from '../midleware/adminvalidate.js'
import { validate } from '../midleware/commandvalidation.js'
import protect from '../midleware/authmidleware.js'
import { requireRole } from '../midleware/roleMiddleware.js'

const authroutes = express.Router()

authroutes.post('/signup', authcontroller.signup);
authroutes.post('/login', authcontroller.login);

authroutes.post('/admin/create', protect, requireRole('admin'), authcontroller.createByAdmin);

authroutes.get('/checkverified', protect, authcontroller.checkverified);

authroutes.post('/logout', protect, authcontroller.logout);

export default authroutes       