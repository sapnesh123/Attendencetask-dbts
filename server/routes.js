import express from 'express'
import authroutes from './routes/authroutes.js'
import attendanceroutes from './routes/attendanceroutes.js'
import overtimeroutes from './routes/overtimeroutes.js'
import dashboardroutes from './routes/dashboardroutes.js'
import userroutes from './routes/userroutes.js'
import notificationroutes from './routes/notificationroutes.js'

const router = express.Router()

router.use('/auth', authroutes)
router.use('/attendance', attendanceroutes)
router.use('/overtime', overtimeroutes)
router.use('/dashboard', dashboardroutes)
router.use('/users', userroutes)
router.use('/notifications', notificationroutes)

export default router
