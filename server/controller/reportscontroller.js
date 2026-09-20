import puppeteer from 'puppeteer';
import Attendance from '../models/attendance.js';
import User from '../models/user.js';
import Overtime from '../models/overtime.js';
import {
  getStartOfDayIST,
  getEndOfDayIST
} from '../helpers/dateUtils.js';



const generateCSV = (data, headers) => {
  const headerRow = headers.join(',');
  const rows = data.map(item =>
    headers.map(h => {
      const val = item[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

export const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date, userId } = req.query;
    const currentUser = req.user;
    const currentDate = date ? new Date(date) : new Date();
    const startOfDay = getStartOfDayIST(currentDate);
    const endOfDay = getEndOfDayIST(currentDate);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    } else if (userId) {
      query.userId = userId;
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ 'punchIn.time': -1 });

    const reportData = attendances.map(a => ({
      _id: a._id,
      userId: a.userId?._id || 'N/A',
      name: a.userId?.name || 'N/A',
      email: a.userId?.email || 'N/A',
      employeeId: a.userId?.employeeId || 'N/A',
      department: a.userId?.departmentName || 'N/A',
      designation: a.userId?.designation || 'N/A',
      punchInTime: a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString() : 'Absent',
      punchOutTime: a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString() : 'Not punched out',
      workingHours: a.workingHours || 0,
      overtimeHours: a.overtime?.hours || 0,
      status: a.status,
      verification: a.verification || { status: 'pending', remarks: null },
      punchInLocation: a.punchIn?.location?.address || 'N/A',
      punchInSelfie: a.punchIn?.selfie || 'N/A',
      punchOutLocation: a.punchOut?.location?.address || 'N/A',
      punchOutSelfie: a.punchOut?.selfie || 'N/A',
      date: currentDate.toLocaleDateString()
    }));

    res.status(200).json({
      success: true,
      data: reportData,
      meta: {
        date: currentDate.toLocaleDateString(),
        totalRecords: reportData.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getDateRangeAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUser = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = getStartOfDayIST(parseDate(startDate));
    const end = getEndOfDayIST(parseDate(endDate));

    const query = {
      date: { $gte: start, $lte: end }
    };

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    } else if (userId) {
      query.userId = userId;
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 });

    const reportData = attendances.map(a => ({
      userId: a.userId?._id || 'N/A',
      name: a.userId?.name || 'N/A',
      email: a.userId?.email || 'N/A',
      employeeId: a.userId?.employeeId || 'N/A',
      department: a.userId?.departmentName || 'N/A',
      designation: a.userId?.designation || 'N/A',
      date: a.date ? new Date(a.date).toLocaleDateString() : 'N/A',
      punchInTime: a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString() : 'Absent',
      punchOutTime: a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString() : 'Not punched out',
      workingHours: a.workingHours || 0,
      overtimeHours: a.overtime?.hours || 0,
      status: a.status,
      overtimeStatus: a.overtime?.status || 'none',
      punchInLocation: a.punchIn?.location?.address || 'N/A',
      punchInSelfie: a.punchIn?.selfie || 'N/A',
      punchOutLocation: a.punchOut?.location?.address || 'N/A',
      punchOutSelfie: a.punchOut?.selfie || 'N/A'
    }));

    const summary = {
      totalDays: reportData.length,
      totalWorkingHours: parseFloat(reportData.reduce((sum, a) => sum + a.workingHours, 0).toFixed(2)),
      totalOvertimeHours: parseFloat(reportData.reduce((sum, a) => sum + a.overtimeHours, 0).toFixed(2)),
      completedDays: reportData.filter(a => a.status === 'completed').length,
      incompleteDays: reportData.filter(a => a.status === 'incomplete').length
    };

    res.status(200).json({
      success: true,
      data: reportData,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const exportAttendanceCSV = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUser = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = getStartOfDayIST(parseDate(startDate));
    const end = getEndOfDayIST(parseDate(endDate));

    const query = {
      date: { $gte: start, $lte: end }
    };

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    } else if (userId) {
      query.userId = userId;
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 });

    const csvData = attendances.map(a => ({
      name: a.userId?.name || 'N/A',
      email: a.userId?.email || 'N/A',
      employeeId: a.userId?.employeeId || 'N/A',
      department: a.userId?.departmentName || 'N/A',
      designation: a.userId?.designation || 'N/A',
      date: a.date ? new Date(a.date).toLocaleDateString() : 'N/A',
      punchInTime: a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString() : 'Absent',
      punchOutTime: a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString() : 'Not punched out',
      workingHours: a.workingHours || 0,
      overtimeHours: a.overtime?.hours || 0,
      status: a.status
    }));

    const headers = ['name', 'email', 'employeeId', 'department', 'designation', 'date', 'punchInTime', 'punchOutTime', 'workingHours', 'overtimeHours', 'status'];
    const csv = generateCSV(csvData, headers);

    const filename = `attendance_report_${startDate}_to_${endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const exportAttendanceExcel = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUser = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = getStartOfDayIST(parseDate(startDate));
    const end = getEndOfDayIST(parseDate(endDate));

    const query = {
      date: { $gte: start, $lte: end }
    };

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    } else if (userId) {
      query.userId = userId;
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 });

    const excelData = attendances.map(a => ({
      'Name': a.userId?.name || 'N/A',
      'Email': a.userId?.email || 'N/A',
      'Employee ID': a.userId?.employeeId || 'N/A',
      'Department': a.userId?.departmentName || 'N/A',
      'Designation': a.userId?.designation || 'N/A',
      'Date': a.date ? new Date(a.date).toLocaleDateString() : 'N/A',
      'Punch In Time': a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString() : 'Absent',
      'Punch Out Time': a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString() : 'Not punched out',
      'Working Hours': a.workingHours || 0,
      'Overtime Hours': a.overtime?.hours || 0,
      'Status': a.status
    }));

    const headers = ['Name', 'Email', 'Employee ID', 'Department', 'Designation', 'Date', 'Punch In Time', 'Punch Out Time', 'Working Hours', 'Overtime Hours', 'Status'];
    const csv = generateCSV(excelData, headers);

    const filename = `attendance_report_${startDate}_to_${endDate}.xls`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const exportAttendancePDF = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUser = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = getStartOfDayIST(parseDate(startDate));
    const end = getEndOfDayIST(parseDate(endDate));

    const query = {
      date: { $gte: start, $lte: end }
    };

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    } else if (userId) {
      query.userId = userId;
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 });

    const totalHours = attendances.reduce((sum, a) => sum + (a.workingHours || 0), 0).toFixed(2);
    const completedDays = attendances.filter(a => a.status === 'completed').length;
    const incompleteDays = attendances.filter(a => a.status === 'incomplete').length;

    let tableRows = attendances.map(a => `
      <tr>
        <td>${a.userId?.name || 'N/A'}</td>
        <td>${a.userId?.employeeId || 'N/A'}</td>
        <td>${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</td>
        <td>${a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString() : 'Absent'}</td>
        <td>${a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString() : '—'}</td>
        <td>${a.punchIn?.location?.address || 'N/A'}</td>
        <td>${a.workingHours || 0} hrs</td>
        <td><span style="color: ${a.status === 'completed' ? 'green' : 'orange'}">${a.status}</span></td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Attendance Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0d6efd; padding-bottom: 15px; }
        .header h1 { color: #0d6efd; margin: 0 0 5px 0; }
        .header p { color: #666; margin: 0; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { background: #f8f9fa; padding: 15px 20px; border-radius: 8px; flex: 1; text-align: center; }
        .summary-card h3 { margin: 0 0 5px 0; color: #0d6efd; }
        .summary-card p { margin: 0; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #0d6efd; color: white; padding: 10px 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e9ecef; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e9ecef; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Attendance Report</h1>
        <p>${startDate} to ${endDate}</p>
      </div>
      <div class="summary">
        <div class="summary-card"><h3>${attendances.length}</h3><p>Total Records</p></div>
        <div class="summary-card"><h3>${completedDays}</h3><p>Completed</p></div>
        <div class="summary-card"><h3>${incompleteDays}</h3><p>Incomplete</p></div>
        <div class="summary-card"><h3>${totalHours} hrs</h3><p>Total Hours</p></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Emp ID</th>
            <th>Date</th>
            <th>Punch In</th>
            <th>Punch Out</th>
            <th>Location</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()} | Attendance Management System</p>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15px', bottom: '15px' } });
    await browser.close();

    const filename = `attendance_report_${startDate}_to_${endDate}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getOvertimeReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const currentUser = req.user;

    let start, end;
    if (startDate && endDate) {
      start = getStartOfDayIST(parseDate(startDate));
      end = getEndOfDayIST(parseDate(endDate));
    }

    const query = {};

    if (currentUser.role === 'employee') {
      query.userId = currentUser._id;
    } else if (currentUser.role === 'manager') {
      const teamUsers = await User.find({ managerId: currentUser._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      teamUserIds.push(currentUser._id);
      query.userId = { $in: teamUserIds };
    }

    if (status) {
      query.status = status;
    }

    if (start && end) {
      query.date = { $gte: start, $lte: end };
    }

    const overtimeRequests = await Overtime.find(query)
      .populate('userId', 'name email employeeId departmentName')
      .populate('approvedBy', 'name email')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      data: overtimeRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};