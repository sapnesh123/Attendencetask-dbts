import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetAdminDashboardQuery } from '../../features/api/apiSlice';

const AdminDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, error } = useGetAdminDashboardQuery();
  const dashboardData = data?.data || {};

  const stats = dashboardData.stats || {};
  const todaySummary = dashboardData.todaySummary || {};
  const monthlySummary = dashboardData.monthlySummary || {};
  const recentAttendance = dashboardData.recentAttendance || [];
  const pendingOtRequests = dashboardData.pendingOtRequests || [];

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error Loading Dashboard</h4>
        <p>{JSON.stringify(error)}</p>
        <hr />
        <p className="mb-0">Please check if backend server is running on port 3000</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        {/* Header */}
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-primary mb-1">
                <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
              </h1>
              <p className="text-muted mb-0">
                Welcome back, <strong>{user?.name || 'Admin'}</strong>! Here's what's happening today.
              </p>
            </div>
            <div className="text-end">
              <div className="badge bg-light text-primary border fs-6 px-3 py-2" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user?.role}
              </div>
              <div className="text-muted small mt-1">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Total Employees</span>
                <div className="simple-card-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
              </div>
              <div className="simple-card-value">{stats.totalEmployees || 0}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Managers</span>
                <div className="simple-card-icon">
                  <i className="bi bi-person-badge-fill"></i>
                </div>
              </div>
              <div className="simple-card-value">{stats.totalManagers || 0}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Admins</span>
                <div className="simple-card-icon">
                  <i className="bi bi-shield-fill-check"></i>
                </div>
              </div>
              <div className="simple-card-value">{stats.totalAdmins || 0}</div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-day me-2 text-primary"></i>
                  Today's Attendance Summary
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-3">
                    <h3 className="text-success">{todaySummary.present || 0}</h3>
                    <p className="text-muted mb-0">Present</p>
                  </div>
                  <div className="col-3">
                    <h3 className="text-danger">{todaySummary.absent || 0}</h3>
                    <p className="text-muted mb-0">Absent</p>
                  </div>
                  <div className="col-3">
                    <h3 className="text-info">{todaySummary.completed || 0}</h3>
                    <p className="text-muted mb-0">Completed</p>
                  </div>
                  <div className="col-3">
                    <h3 className="text-warning">{todaySummary.incomplete || 0}</h3>
                    <p className="text-muted mb-0">Incomplete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2 text-primary"></i>
                  Monthly Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6">
                    <h3 className="text-primary">{monthlySummary.totalHours || 0} <small>hrs</small></h3>
                    <p className="text-muted mb-0">Total Hours</p>
                  </div>
                  <div className="col-6">
                    <h3 className="text-warning">{monthlySummary.totalOvertime || 0} <small>hrs</small></h3>
                    <p className="text-muted mb-0">Overtime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-lightning-charge me-2 text-warning"></i>
                  Pending Overtime ({pendingOtRequests.length})
                </h5>
              </div>
              <div className="card-body">
                {pendingOtRequests.length === 0 ? (
                  <p className="text-muted text-center mb-0">No pending requests</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {pendingOtRequests.slice(0, 5).map((req) => (
                      <div key={req._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{req.userId?.name || 'Unknown'}</strong>
                          <br />
                          <small className="text-muted">{req.hours} hrs</small>
                        </div>
                        <span className="badge bg-warning">Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-person-check me-2 text-success"></i>
                Recent Attendance
              </h5>
              <Link to="/admin/attendance" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Punch In</th>
                      <th>Punch Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.slice(0, 10).map((att) => (
                      <tr key={att._id}>
                        <td>
                          <strong>{att.userId?.name || 'Unknown'}</strong>
                          <br />
                          <small className="text-muted">{att.userId?.employeeId}</small>
                        </td>
                        <td>
                          {att.punchIn?.time
                            ? new Date(att.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td>
                          {att.punchOut?.time
                            ? new Date(att.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : 'Not punched out'}
                        </td>
                        <td><strong>{att.workingHours || 0} hrs</strong></td>
                        <td>
                          <span className={`badge ${att.status === 'completed' ? 'bg-success' : att.status === 'incomplete' ? 'bg-warning' : 'bg-secondary'}`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
