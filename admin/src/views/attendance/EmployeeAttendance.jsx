import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyAttendanceQuery } from '../../features/api/apiSlice';

const EmployeeAttendance = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyAttendanceQuery({ page, limit: 30 });
  const attendances = data?.data || [];
  const pagination = data?.pagination || {};

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
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>My Attendance</h1>
          <p className="page-subtitle">View your attendance history</p>
        </div>
        <Link to="/employee/punch" className="btn btn-primary">
          Punch In/Out
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No attendance records found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Punch In</th>
                      <th>In Selfie</th>
                      <th>Punch Out</th>
                      <th>Out Selfie</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((attendance) => (
                      <tr key={attendance._id}>
                        <td>
                          {attendance.date
                            ? new Date(attendance.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            : '-'}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <span className="text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;