import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import User from './models/user.js'

dotenv.config()

const PASSWORD = 'Test@1234'
const managers = ['Rahul Sharma', 'Priya Verma', 'Amit Patil']
const employees = ['Neha Joshi', 'Rohan Deshmukh', 'Sneha Kulkarni', 'Vikas Pawar', 'Anjali More', 'Karan Shinde']

await mongoose.connect(process.env.DBPATH)
const hash = await bcrypt.hash(PASSWORD, 10)
const slug = (n) => n.toLowerCase().replace(/\s+/g, '.')

const last = await User.findOne().sort({ employeeId: -1 }).select('employeeId')
let nextId = last?.employeeId ? Number(last.employeeId) + 1 : 1001

const make = async (name, role, managerId = null) => {
    const email = `${slug(name)}@test.com`
    let u = await User.findOne({ email })
    if (u) { console.log('exists', email); return u }
    u = await User.create({ name, email, password: hash, role, managerId, employeeId: String(nextId++) })
    console.log('created', role, email)
    return u
}

const mgrs = []
for (const n of managers) mgrs.push(await make(n, 'manager'))
for (const [i, n] of employees.entries()) await make(n, 'employee', mgrs[i % mgrs.length]._id)

await mongoose.disconnect()
