import Attendance from '../models/attendance.js';
import User from '../models/user.js';
import Overtime from '../models/overtime.js';
import Notification from '../models/notification.js';
import {
  getStartOfDayIST,
  getEndOfDayIST
} from '../helpers/dateUtils.js';

const STANDARD_WORKING_HOURS = 8;

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const punchIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude, address, selfie, lateThreshold = 9 } = req.body;

    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: 'Selfie is required for punch in'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for punch in'
      });
    }

    // Geofencing validation (optional - only if env vars are set)
    const geofenceLat = parseFloat(process.env.GEOFENCE_LAT);
    const geofenceLng = parseFloat(process.env.GEOFENCE_LNG);
    const geofenceRadius = parseFloat(process.env.GEOFENCE_RADIUS); // in meters

    if (geofenceLat && geofenceLng && geofenceRadius) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const R = 6371000; // Earth's radius in meters
      const dLat = toRad(latitude - geofenceLat);
      const dLon = toRad(longitude - geofenceLng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(geofenceLat)) * Math.cos(toRad(latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance > geofenceRadius) {
        return res.status(403).json({
          success: false,
          message: `You are ${Math.round(distance)}m away from the office. Attendance is only allowed within ${geofenceRadius}m radius.`
        });
      }
    }

    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance && existingAttendance.punchIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'Already punched in for today'
      });
    }

    // Missed punch check - if yesterday has a punch-in but no punch-out, notify once
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const missedPunch = await Attendance.findOne({
      userId,
      date: { $gte: getStartOfDayIST(yesterday), $lte: getEndOfDayIST(yesterday) },
      'punchIn.time': { $ne: null },
      'punchOut.time': null
    });

    if (missedPunch) {
      const alreadyNotified = await Notification.findOne({
        userId,
        type: 'missed_punch',
        message: { $regex: missedPunch.date.toDateString() }
      });

      if (!alreadyNotified) {
        await Notification.create({
          userId,
          type: 'missed_punch',
          message: `You forgot to punch out on ${missedPunch.date.toDateString()}`
        });
      }
    }

    const punchInTime = new Date();
    const hour = punchInTime.getHours();
    const isLate = hour >= lateThreshold;

    let attendance;

    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          punchIn: {
            time: punchInTime,
            selfie,
            location: { latitude, longitude, address },
            status: isLate ? 'late' : 'present'
          },
          status: 'incomplete'
        },
        { new: true }
      ).populate('userId', 'name email employeeId');
    } else {
      attendance = await Attendance.create({
        userId,
        date: startOfDay,
        punchIn: {
          time: punchInTime,
          selfie,
          location: { latitude, longitude, address },
          status: isLate ? 'late' : 'present'
        },
        status: 'incomplete'
      });
      await attendance.populate('userId', 'name email employeeId');
    }

    res.status(201).json({
      success: true,
      message: isLate ? 'Punched in late' : 'Punched in successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Punch In Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during punch in',
      error: error.message
    });
  }
};

export const punchOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude, address, selfie } = req.body;

    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: 'Selfie is required for punch out'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for punch out'
      });
    }

    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendance || !attendance.punchIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'Please punch in first before punching out'
      });
    }

    if (attendance.punchOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'Already punched out for today'
      });
    }

    const punchOutTime = new Date();
    const punchInTime = new Date(attendance.punchIn.time);

    const diffMs = punchOutTime - punchInTime;
    const hoursWorked = diffMs / (1000 * 60 * 60);

    let status = 'completed';
    if (hoursWorked < STANDARD_WORKING_HOURS) {
      status = 'incomplete';
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        punchOut: {
          time: punchOutTime,
          selfie,
          location: { latitude, longitude, address }
        },
        workingHours: parseFloat(hoursWorked.toFixed(2)),
        status
      },
      { new: true }
    ).populate('userId', 'name email employeeId');

    res.status(200).json({
      success: true,
      message: 'Punched out successfully',
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Punch Out Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during punch out',
      error: error.message
    });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name email employeeId');

    res.status(200).json({
      success: true,
      data: attendance || null
    });
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: getStartOfDayIST(new Date(startDate)),
        $lte: getEndOfDayIST(new Date(endDate))
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get My Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id).populate('userId', 'name email employeeId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get Attendance By Id Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 30, status } = req.query;

    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: getStartOfDayIST(new Date(startDate)),
        $lte: getEndOfDayIST(new Date(endDate))
      };
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email employeeId departmentName designation')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get User Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const verifyAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const verifierId = req.user._id;

    if (!['valid', 'invalid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either valid or invalid'
      });
    }

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      {
        verification: {
          status,
          remarks: remarks || null,
          verifiedBy: verifierId,
          verifiedAt: new Date()
        }
      },
      { new: true }
    ).populate('userId', 'name email employeeId')
     .populate('verification.verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}`,
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Verify Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const requestOvertime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { hours, reason } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid overtime hours are required'
      });
    }

    const today = new Date();
    const startOfDay = getStartOfDayIST(today);
    const endOfDay = getEndOfDayIST(today);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today. Please punch in first.'
      });
    }

    if (!attendance.punchOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'Please punch out first before requesting overtime'
      });
    }

    const existingOvertime = await Overtime.findOne({
      userId,
      attendanceId: attendance._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingOvertime) {
      return res.status(400).json({
        success: false,
        message: 'Overtime request already exists for today'
      });
    }

    const overtime = await Overtime.create({
      userId,
      attendanceId: attendance._id,
      date: startOfDay,
      hours,
      reason,
      status: 'pending',
      requestedAt: new Date()
    });

    await Attendance.findByIdAndUpdate(attendance._id, {
      overtime: {
        hours,
        status: 'pending',
        requestedAt: new Date()
      }
    });

    await overtime.populate('userId', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Overtime request submitted successfully',
      data: overtime
    });
  } catch (error) {
    console.error('Request Overtime Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const approveOvertime = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user._id;

    const overtime = await Overtime.findById(id);

    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    if (overtime.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Overtime request is not pending'
      });
    }

    overtime.status = 'approved';
    overtime.approvedBy = approverId;
    overtime.approvedAt = new Date();
    await overtime.save();

    await Attendance.findByIdAndUpdate(overtime.attendanceId, {
      overtime: {
        hours: overtime.hours,
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date()
      }
    });

    await overtime.populate('userId', 'name email employeeId');
    await overtime.populate('approvedBy', 'name email');

    await Notification.create({
      userId: overtime.userId._id,
      type: 'overtime_approved',
      message: `Your overtime request for ${overtime.hours} hour(s) on ${overtime.date.toDateString()} was approved`
    });

    res.status(200).json({
      success: true,
      message: 'Overtime approved successfully',
      data: overtime
    });
  } catch (error) {
    console.error('Approve Overtime Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const rejectOvertime = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user._id;

    const overtime = await Overtime.findById(id);

    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found'
      });
    }

    if (overtime.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Overtime request is not pending'
      });
    }

    overtime.status = 'rejected';
    overtime.approvedBy = approverId;
    overtime.approvedAt = new Date();
    overtime.rejectionReason = rejectionReason;
    await overtime.save();

    await Attendance.findByIdAndUpdate(overtime.attendanceId, {
      overtime: {
        hours: overtime.hours,
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date()
      }
    });

    await overtime.populate('userId', 'name email employeeId');
    await overtime.populate('approvedBy', 'name email');

    await Notification.create({
      userId: overtime.userId._id,
      type: 'overtime_rejected',
      message: `Your overtime request for ${overtime.date.toDateString()} was rejected${rejectionReason ? ': ' + rejectionReason : ''}`
    });

    res.status(200).json({
      success: true,
      message: 'Overtime rejected',
      data: overtime
    });
  } catch (error) {
    console.error('Reject Overtime Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getMyOvertimeRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 30 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const overtimeRequests = await Overtime.find(query)
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Overtime.countDocuments(query);

    res.status(200).json({
      success: true,
      data: overtimeRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get My Overtime Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
