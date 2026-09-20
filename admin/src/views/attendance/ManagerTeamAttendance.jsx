import React, { useState } from 'react';
import { useGetManagerDashboardQuery, useVerifyAttendanceMutation } from '../../features/api/apiSlice';
import { Link } from 'react-router-dom';

const ManagerTeamAttendance = () => {
  const [filter, setFilter] = useState('all');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('valid');
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useGetManagerDashboardQuery();
  const [verifyAttendance, { isLoading: isVerifying }] = useVerifyAttendanceMutation();

  const dashboardData = data?.data || {};
  const attendances = dashboardData.recentAttendance || [];

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

  const filteredAttendances = attendances.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

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
        <h1>Team Attendance</h1>
        <p className="page-subtitle">View your team's attendance</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="simple-card">
            <div className="simple-card-title">Team Size</div>
            <div className="simple-card-value">{dashboardData.teamSize || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card simple-card-success">
            <div className="simple-card-title">Present</div>
            <div className="simple-card-value">{dashboardData.presentNow || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card simple-card-warning">
            <div className="simple-card-title">Completed</div>
            <div className="simple-card-value">{dashboardData.completedToday || 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="simple-card simple-card-danger">
            <div className="simple-card-title">Incomplete</div>
            <div className="simple-card-value">{dashboardData.incompleteToday || 0}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Team Members</h5>
            <div>
              <button
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'} me-1`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`btn btn-sm ${filter === 'completed' ? 'btn-success' : 'btn-outline-success'} me-1`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button
                className={`btn btn-sm ${filter === 'incomplete' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter('incomplete')}
              >
                Incomplete
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredAttendances.length === 0 ? (
            <p className="text-muted text-center py-4">No attendance records found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
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
                  {filteredAttendances.map((attendance) => (
                    <tr key={attendance._id}>
                      <td>
                        <Link to={`/manager/team/${attendance.userId?._id}`} className="text-decoration-none">
                          <strong>{attendance.userId?.name || 'Unknown'}</strong>
                        </Link>
                        <p className="mb-0 text-muted small">{attendance.userId?.employeeId} | {attendance.userId?.departmentName || '-'}</p>
                      </td>
                      <td>
                        <div>{attendance.punchIn?.time ? new Date(attendance.punchIn.time).toLocaleTimeString() : '-'}</div>
                        <div className="small text-muted">{attendance.punchIn?.location?.address || '-'}</div>
                      </td>
                      <td>
                        {attendance.punchIn?.selfie ? (
                          <img
                            src={attendance.punchIn.selfie}
                            alt="In Selfie"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => window.open(attendance.punchIn.selfie, '_blank')}
                          />
                        ) : '-'}
                      </td>
                      <td>
                        <div>{attendance.punchOut?.time ? new Date(attendance.punchOut.time).toLocaleTimeString() : '-'}</div>
                        <div className="small text-muted">{attendance.punchOut?.location?.address || '-'}</div>
                      </td>
                      <td>
                        {attendance.punchOut?.selfie ? (
                          <img
                            src={attendance.punchOut.selfie}
                            alt="Out Selfie"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => window.open(attendance.punchOut.selfie, '_blank')}
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
                  Employee: <strong>{selectedAttendance?.userId?.name}</strong>
                </p>
                <div className="d-flex gap-3 mb-3">
                  {selectedAttendance?.punchIn?.selfie && (
                    <div>
                      <div className="small text-muted mb-1">Punch In Selfie</div>
                      <img
                        src={selectedAttendance.punchIn.selfie}
                        alt="In Selfie"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </div>
                  )}
                  {selectedAttendance?.punchOut?.selfie && (
                    <div>
                      <div className="small text-muted mb-1">Punch Out Selfie</div>
                      <img
                        src={selectedAttendance.punchOut.selfie}
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

export default ManagerTeamAttendance;