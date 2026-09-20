import Attendance from '../models/attendance.js';
import User from '../models/user.js';
import Overtime from '../models/overtime.js';
import {
  getStartOfDayIST,
  getEndOfDayIST,
  getStartOfMonthIST,
  getEndOfMonthIST
} from '../helpers/dateUtils.js';

export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);
    const startOfMonth = getStartOfMonthIST(today);
    const endOfMonth = getEndOfMonthIST(today);

    const todayAttendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name email employeeId');

    const monthAttendance = await Attendance.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalDaysWorked = monthAttendance.filter(a => a.punchIn?.time).length;
    const completedDays = monthAttendance.filter(a => a.status === 'completed').length;
    const incompleteDays = monthAttendance.filter(a => a.status === 'incomplete').length;

    const totalHoursThisMonth = monthAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const overtimeHours = monthAttendance.reduce((sum, a) => sum + (a.overtime?.hours || 0), 0);

    const pendingOtRequests = await Overtime.countDocuments({
      userId,
      status: 'pending'
    });

    const overtimeStatus = await Overtime.find({
      userId,
      status: { $in: ['pending', 'approved'] },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ requestedAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        today: todayAttendance || null,
        monthlySummary: {
          totalDaysWorked,
          completedDays,
          incompleteDays,
          totalHours: parseFloat(totalHoursThisMonth.toFixed(2)),
          overtimeHours: parseFloat(overtimeHours.toFixed(2))
        },
        pendingOtRequests,
        recentOvertimeRequests: overtimeStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { startDate, endDate } = req.query;

    let start = getStartOfDayIST(new Date());
    let end = getEndOfDayIST(new Date());

    if (startDate && endDate) {
      start = getStartOfDayIST(new Date(startDate));
      end = getEndOfDayIST(new Date(endDate));
    }

    const teamUsers = await User.find({
      managerId: managerId,
      role: 'employee'
    }).select('name email employeeId departmentName designation');

    const teamUserIds = teamUsers.map(u => u._id);

    const teamAttendance = await Attendance.find({
      userId: { $in: teamUserIds },
      date: { $gte: start, $lte: end }
    }).populate('userId', 'name email employeeId departmentName designation');

    const presentToday = teamAttendance.filter(a => a.punchIn?.time && !a.punchOut?.time);
    const completedToday = teamAttendance.filter(a => a.status === 'completed');
    const incompleteToday = teamAttendance.filter(a => a.status === 'incomplete');

    const totalHours = teamAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const totalOvertime = teamAttendance.reduce((sum, a) => sum + (a.overtime?.hours || 0), 0);

    const pendingOtRequests = await Overtime.find({
      userId: { $in: teamUserIds },
      status: 'pending'
    })
      .populate('userId', 'name email employeeId')
      .sort({ requestedAt: -1 })
      .limit(10);

    const recentlyPunchedIn = await Attendance.find({
      userId: { $in: teamUserIds },
      date: { $gte: start, $lte: end },
      'punchIn.time': { $exists: true }
    })
      .populate('userId', 'name email employeeId')
      .sort({ 'punchIn.time': -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        teamSize: teamUsers.length,
        presentNow: presentToday.length,
        presentEmployees: presentToday,
        completedToday: completedToday.length,
        incompleteToday: incompleteToday.length,
        pendingOtRequests,
        recentlyPunchedIn,
        recentAttendance: teamAttendance.slice(0, 20),
        teamMembers: teamUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);
    const startOfMonth = getStartOfMonthIST(today);
    const endOfMonth = getEndOfMonthIST(today);
    const userId = req.user._id;

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const todayAttendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name email employeeId role');

    const presentToday = todayAttendance.filter(a => a.punchIn?.time);
    const absentToday = todayAttendance.filter(a => !a.punchIn?.time);
    const completedToday = todayAttendance.filter(a => a.status === 'completed');
    const incompleteToday = todayAttendance.filter(a => a.status === 'incomplete');

    const monthAttendance = await Attendance.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalHoursThisMonth = monthAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const totalOvertimeMonth = monthAttendance.reduce((sum, a) => sum + (a.overtime?.hours || 0), 0);

    const pendingOtRequests = await Overtime.find({ status: 'pending' })
      .populate('userId', 'name email employeeId')
      .sort({ requestedAt: -1 })
      .limit(10);

    const recentAttendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('userId', 'name email employeeId role')
      .sort({ 'punchIn.time': -1 })
      .limit(20);

    const lateArrivals = todayAttendance.filter(a => a.punchIn?.status === 'late');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          totalManagers,
          totalAdmins,
          totalUsers: totalEmployees + totalManagers + totalAdmins
        },
        todaySummary: {
          present: presentToday.length,
          absent: Math.max(0, totalEmployees - presentToday.length),
          completed: completedToday.length,
          incomplete: incompleteToday.length,
          lateArrivals: lateArrivals.length
        },
        monthlySummary: {
          totalHours: parseFloat(totalHoursThisMonth.toFixed(2)),
          totalOvertime: parseFloat(totalOvertimeMonth.toFixed(2))
        },
        pendingOtRequests,
        recentAttendance,
        presentEmployees: presentToday
      }
    });
  } catch (error) {
    console.error('Get Admin Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};