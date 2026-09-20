# MERN Attendance Management System

A real-time attendance management system with location tracking and live photo verification.
r

## modules

- **Authentication & Role-Based Access**
  - Secure JWT-based authentication
  - Three roles: Employee, Manager, Admin
  - Role-based route protection

- **Attendance System**
  - Punch In with live selfie capture
  - Punch Out with live selfie capture
  - Location tracking (latitude/longitude)
  - Working hours calculation
  - Status indicators (Completed/Incomplete)

- **Overtime Workflow**
  - Employees can request overtime
  - Managers/Admins can approve/reject
  - Real-time status updates

- **Role-Based Dashboards**
  - Employee: Personal attendance, hours tracking
  - Manager: Team attendance, OT requests management
  - Admin: System-wide analytics

- **Reports & Export**
  - Daily attendance reports
  - Date range filtering
  - CSV/Excel export
  - Role-based data access

## Architecture

├── server/
│   ├── controller/       
│   │   ├── authcontroller.js
│   │   ├── attendancecontroller.js
│   │   ├── dashboardcontroller.js
│   │   ├── reportscontroller.js
│   │   └── usercontroller.js
│   ├── middleware/        
│   ├── models/           
│   ├── routes/        
│   └── helpers/          
├── admin/               
└── uploads/             



## Setup Instructions


### Backend Setup

cd server
npm install
npm run dev

# deafult  create admin 
POST /api/auth/admin/create
{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin",
  "role": "admin"
}

# important
i have aready created admin like admin@gmail.com 1234567
# important
Admin can make employee as manager then we can add employee to manager's team




# Attendencetask-dbts
