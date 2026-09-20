import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  punchIn: {
    time: {
      type: Date,
      default: null
    },
    selfie: {
      type: String,
      default: null
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null }
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'present'
    }
  },
  punchOut: {
    time: {
      type: Date,
      default: null
    },
    selfie: {
      type: String,
      default: null
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null }
    }
  },
  workingHours: {
    type: Number,
    default: 0
  },
  overtime: {
    hours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'absent', 'on_leave'],
    default: 'absent'
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending'
    },
    remarks: {
      type: String,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ userId: 1 });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;
