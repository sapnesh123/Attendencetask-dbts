import React, { useState } from 'react';
import {
  useGetAdminDashboardQuery,
  useGetDailyAttendanceReportQuery,
  useVerifyAttendanceMutation,
} from '../../features/api/apiSlice';

const AdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('valid');
  const [remarks, setRemarks] = useState('');

  const { data: dashboardRes } = useGetAdminDashboardQuery();
  const { data: reportRes, isLoading } = useGetDailyAttendanceReportQuery(date);
  const [verifyAttendance, { isLoading: isVerifying }] = useVerifyAttendanceMutation();

  const todaySummary = dashboardRes?.data?.todaySummary || {};
  const attendances = reportRes?.data || [];

  const openVerifyModal = (attendance) => {
    setSelectedAttendance(attendance);
    setVerifyStatus(attendance.verification?.status === 'invalid' ? 'invalid' : 'valid');
    setRemarks(attendance.verification?.remarks || '');
    setShowVerifyModal(true);
  };

  const submitVerify = async () => {
    if (!selectedAttendance) return;
    try {
      await verifyAttendance({ id: selectedAttendance._id, status: verifyStatus, remarks }).unwrap();
      setShowVerifyModal(false);
    } catch (err) {
      alert(err?.data?.message || 'Failed to update verification');
    }
  };

  const getVerificationBadge = (verification) => {
    const status = verification?.status || 'pending';
    if (status === 'valid') return <span className="badge bg-success">Valid</span>;
    if (status === 'invalid') return <span className="badge bg-danger">Invalid</span>;
    return <span className="badge bg-secondary">Not Reviewed</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge bg-success">Completed</span>;
      case 'incomplete':
        return <span className="badge bg-warning">Incomplete</span>;
      case 'absent':
        return <span className="badge bg-danger">Absent</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>All Attendance</h1>
        <p className="page-subtitle">View system-wide attendance records</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="simple-card simple-card-success">
            <div className="simple-card-title">Present</div>
            <div className="simple-card-value">{todaySummary.present || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card simple-card-danger">
            <div className="simple-card-title">Absent</div>
            <div className="simple-card-value">{todaySummary.absent || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card simple-card-warning">
            <div className="simple-card-title">Completed</div>
            <div className="simple-card-value">{todaySummary.completed || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card">
            <div className="simple-card-title">Incomplete</div>
            <div className="simple-card-value">{todaySummary.incomplete || 0}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0">
          <div className="d-flex align-items-center gap-3">
            <label className="mb-0">Date:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : attendances.length === 0 ? (
            <p className="text-muted text-center py-4">No attendance records for this date</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Punch In</th>
                    <th>In Selfie</th>
                    <th>Punch Out</th>
                    <th>Out Selfie</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr key={attendance._id}>
                      <td><strong>{attendance.name || '-'}</strong><div className="small text-muted">{attendance.department || '-'}</div></td>
                      <td>{attendance.employeeId || '-'}</td>
                      <td>
                        <div>{attendance.punchInTime || '-'}</div>
                        <div className="small text-muted">{attendance.punchInLocation || '-'}</div>
                      </td>
                      <td>
                        {attendance.punchInSelfie && attendance.punchInSelfie !== 'N/A' ? (
                          <img
                            src={attendance.punchInSelfie}
                            alt="In Selfie"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => window.open(attendance.punchInSelfie, '_blank')}
                          />
                        ) : '-'}
                      </td>
                      <td>
                        <div>{attendance.punchOutTime || '-'}</div>
                        <div className="small text-muted">{attendance.punchOutLocation || '-'}</div>
                      </td>
                      <td>
                        {attendance.punchOutSelfie && attendance.punchOutSelfie !== 'N/A' ? (
                          <img
                            src={attendance.punchOutSelfie}
                            alt="Out Selfie"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => window.open(attendance.punchOutSelfie, '_blank')}
                          />
                        ) : '-'}
                      </td>
                      <td>{attendance.workingHours || 0} hrs</td>
                      <td>{getStatusBadge(attendance.status)}</td>
                      <td>
                        <div className="mb-1">{getVerificationBadge(attendance.verification)}</div>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openVerifyModal(attendance)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showVerifyModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Attendance</h5>
                <button type="button" className="btn-close" onClick={() => setShowVerifyModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Employee: <strong>{selectedAttendance?.name}</strong> ({selectedAttendance?.date})
                </p>
                <div className="d-flex gap-3 mb-3">
                  {selectedAttendance?.punchInSelfie && selectedAttendance.punchInSelfie !== 'N/A' && (
                    <div>
                      <div className="small text-muted mb-1">Punch In Selfie</div>
                      <img
                        src={selectedAttendance.punchInSelfie}
                        alt="In Selfie"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </div>
                  )}
                  {selectedAttendance?.punchOutSelfie && selectedAttendance.punchOutSelfie !== 'N/A' && (
                    <div>
                      <div className="small text-muted mb-1">Punch Out Selfie</div>
                      <img
                        src={selectedAttendance.punchOutSelfie}
                        alt="Out Selfie"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mark as</label>
                  <select
                    className="form-select"
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value)}
                  >
                    <option value="valid">Valid</option>
                    <option value="invalid">Invalid (fake/suspicious)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Optional notes for this attendance"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitVerify}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;