import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetManagerDashboardQuery,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation,
} from '../../features/api/apiSlice';

const ManagerDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading } = useGetManagerDashboardQuery();
  const dashboardData = data?.data || {};
  const [approveOvertime] = useApproveOvertimeMutation();
  const [rejectOvertime] = useRejectOvertimeMutation();

  const pendingOtRequests = dashboardData.pendingOtRequests || [];
  const recentAttendance = dashboardData.recentlyPunchedIn || [];

  const handleApprove = async (id) => {
    try {
      await approveOvertime(id).unwrap();
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleReject = async (id) => {
    const rejectionReason = prompt('Enter rejection reason:');
    if (!rejectionReason) return;
    try {
      await rejectOvertime({ id, rejectionReason }).unwrap();
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p>Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header mb-4">
          <h1 className="text-warning">
            <i className="bi bi-person-badge me-2"></i>
            Manager Dashboard
          </h1>
          <p className="text-muted mb-0">
            Overview of your team's attendance and performance
          </p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Team Size</span>
                <div className="simple-card-icon"><i className="bi bi-people"></i></div>
              </div>
              <div className="simple-card-value text-primary">{dashboardData.teamSize || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card simple-card-success">
              <div className="simple-card-header">
                <span className="simple-card-title">Present Now</span>
                <div className="simple-card-icon"><i className="bi bi-person-check"></i></div>
              </div>
              <div className="simple-card-value">{dashboardData.presentNow || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card simple-card-warning">
              <div className="simple-card-header">
                <span className="simple-card-title">Completed Today</span>
                <div className="simple-card-icon"><i className="bi bi-trophy"></i></div>
              </div>
              <div className="simple-card-value">{dashboardData.completedToday || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card simple-card-danger">
              <div className="simple-card-header">
                <span className="simple-card-title">Pending OT</span>
                <div className="simple-card-icon"><i className="bi bi-exclamation-triangle"></i></div>
              </div>
              <div className="simple-card-value">{pendingOtRequests.length}</div>
            </div>
          </div>
        </div>

        {/* Present Employees & Pending OT */}
        <div className="row g-3 mb-4">
          {/* Present Employees */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-person-check me-2 text-success"></i>
                  Present Employees ({dashboardData.presentNow || 0})
                </h5>
                <Link to="/manager/team-attendance" className="btn btn-sm btn-outline-primary">View All</Link>
              </div>
              <div className="card-body">
                {(!dashboardData.presentEmployees || dashboardData.presentEmployees.length === 0) ? (
                  <div className="text-center py-4">
                    <i className="bi bi-person-slash fs-1 text-muted"></i>
                    <p className="text-muted mb-0">No employees are currently punched in</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {dashboardData.presentEmployees.map((att) => (
                      <div key={att._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-light text-success border d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {att.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/manager/team/${att.userId?._id}`} className="text-decoration-none">
                              <strong className="text-dark small">{att.userId?.name || 'Unknown'}</strong>
                            </Link>
                            <br />
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              In: {new Date(att.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </div>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: '0.65rem' }}>Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Overtime */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-clock-history me-2 text-warning"></i>
                  Pending Overtime
                </h5>
                <Link to="/manager/overtime" className="btn btn-sm btn-outline-primary">Manage</Link>
              </div>
              <div className="card-body">
                {pendingOtRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-check-circle fs-1 text-success"></i>
                    <p className="text-muted mb-0">No pending requests</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {pendingOtRequests.map((req) => (
                      <div key={req._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="small">{req.userId?.name || 'Unknown'}</strong>
                          <br />
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {req.hours} hrs - {new Date(req.date).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleApprove(req._id)}>✓</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(req._id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2 text-primary"></i>
                  Team Directory
                </h5>
              </div>
              <div className="card-body">
                {(!dashboardData.teamMembers || dashboardData.teamMembers.length === 0) ? (
                  <p className="text-muted text-center py-4">No team members found</p>
                ) : (
                  <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
                    {dashboardData.teamMembers.map((member) => {
                      const isPresent = recentAttendance.some(a => a.userId?._id === member._id && a.punchIn?.time && !a.punchOut?.time);
                      return (
                        <div key={member._id} className="col">
                          <div className="card h-100 border border-light shadow-sm transition-all" style={{ backgroundColor: '#ffffff' }}>
                            <div className="card-body p-3">
                              <div className="d-flex align-items-center mb-3">
                                <div className="position-relative">
                                  <div className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center border"
                                    style={{ width: '45px', height: '45px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className={`position-absolute bottom-0 end-0 border border-white rounded-circle ${isPresent ? 'bg-success' : 'bg-secondary'}`}
                                    style={{ width: '12px', height: '12px' }}>
                                  </span>
                                </div>
                                <div className="ms-3 overflow-hidden">
                                  <Link to={`/manager/team/${member._id}`} className="text-decoration-none">
                                    <h6 className="mb-0 text-truncate text-dark fw-bold">{member.name}</h6>
                                  </Link>
                                  <small className="text-muted text-truncate d-block">{member.designation || 'Staff'}</small>
                                </div>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                <small className="text-muted font-monospace">{member.employeeId}</small>
                                <span className={`badge rounded-pill ${isPresent ? 'bg-success bg-opacity-10 text-success' : 'bg-light text-muted'}`} style={{ fontSize: '0.7rem' }}>
                                  {isPresent ? 'Active' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="row g-3">
          <div className="col-md-12">
            <div className="simple-card simple-card-danger">
              <div className="simple-card-header">
                <span className="simple-card-title">Incomplete Shifts Today</span>
                <div className="simple-card-icon text-danger"><i className="bi bi-emoji-frown"></i></div>
              </div>
              <div className="simple-card-value">{dashboardData.incompleteToday || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
