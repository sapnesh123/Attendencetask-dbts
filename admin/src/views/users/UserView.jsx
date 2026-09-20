import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetUserByIdQuery, useGetUserAttendanceQuery } from '../../features/api/apiSlice';
import { selectCurrentRole } from '../../features/auth/authSlice';

const UserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectCurrentRole);

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: userRes, isLoading: userLoading, error: userError } = useGetUserByIdQuery(id);
  const { data: attendanceRes, isLoading: attendanceLoading } = useGetUserAttendanceQuery(id);

  const user = userRes?.data;
  const attendances = attendanceRes?.data || [];

  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendances.find(a => a.date === dateStr);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success text-white';
      case 'incomplete': return 'bg-warning text-white';
      case 'absent': return 'bg-danger text-white';
      default: return 'bg-light text-dark';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'incomplete': return '◐';
      case 'absent': return '✗';
      default: return '';
    }
  };

  if (userLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading user...</span>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="alert alert-danger m-4">
        <h4 className="alert-heading">Error</h4>
        <p>{userError?.data?.message || 'User not found'}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const calendarDays = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const attendance = getAttendanceForDay(day);
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === new Date().toDateString();

    calendarDays.push(
      <div key={day} className={`calendar-day ${attendance ? getStatusColor(attendance.status) : 'bg-light'} ${isToday ? 'border-primary border-2 shadow-sm' : ''}`}>
        <div className="day-number">{day}</div>
        {attendance && (
          <div className="attendance-info text-center">
            <div className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>
              Present
            </div>
            <div className="small opacity-75" style={{ fontSize: '0.6rem' }}>
              {attendance.punchIn?.time
                ? new Date(attendance.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                : '—'} - {attendance.punchOut?.time
                  ? new Date(attendance.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : '—'}
            </div>

            {attendance.overtime?.status === 'approved' && attendance.overtime?.hours > 0 && (
              <div className="mt-1 badge bg-info text-dark" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                OT: {attendance.overtime.hours}h
              </div>
            )}

            <div className="mt-1">
              <span className={`badge ${attendance.status === 'completed' ? 'bg-success' : attendance.status === 'incomplete' ? 'bg-warning' : 'bg-danger'}`} style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                {attendance.status}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="main-content">
      <div className="container-fluid">
        {/* Back Button */}
        <button className="btn btn-outline-secondary mb-3" onClick={() => role === 'admin' ? navigate('/admin/users') : navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>Back to {role === 'admin' ? 'Users' : 'Team'}
        </button>

        {/* User Profile Header */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-2 text-center">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                  style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="mt-2">
                  <span className={`badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'manager' ? 'bg-primary' : 'bg-success'}`} style={{ fontSize: '0.9rem' }}>
                    {user.role?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="col-md-6">
                <h2 className="mb-1">{user.name || 'N/A'}</h2>
                <p className="text-muted mb-1">{user.email}</p>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <small className="text-muted d-block">Employee ID</small>
                    <strong>{user.employeeId || 'N/A'}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Department</small>
                    <strong>{user.departmentName || 'N/A'}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Designation</small>
                    <strong>{user.designation || 'N/A'}</strong>
                  </div>
                </div>
                {user.phone && (
                  <p className="mt-2 mb-0">
                    <i className="bi bi-telephone me-2"></i>{user.phone}
                  </p>
                )}
              </div>
              {role === 'admin' && (
                <div className="col-md-4 text-end">
                  <div className="d-grid gap-2" style={{ maxWidth: '200px', marginLeft: 'auto' }}>
                    <Link to={`/admin/users/${user._id}/edit`} className="btn btn-outline-primary">
                      <i className="bi bi-pencil me-2"></i>Edit Profile
                    </Link>
                    <Link to={`/admin/users/${user._id}/leaves`} className="btn btn-outline-warning">
                      <i className="bi bi-calendar-x me-2"></i>View Leaves
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Calendar */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-calendar-week me-2 text-primary"></i>
              Attendance Calendar - {monthNames[month]} {year}
            </h5>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  if (month === 0) {
                    setMonth(11);
                    setYear(year - 1);
                  } else {
                    setMonth(month - 1);
                  }
                }}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  if (month === 11) {
                    setMonth(0);
                    setYear(year + 1);
                  } else {
                    setMonth(month + 1);
                  }
                }}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header">{day}</div>
              ))}
              {calendarDays}
            </div>
            <div className="mt-3 d-flex flex-wrap gap-4">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success text-white p-2 rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✓</div>
                <small>Completed (Present)</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-warning text-white p-2 rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>◐</div>
                <small>Incomplete (Present)</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-danger text-white p-2 rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✗</div>
                <small>Absent</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-info text-dark px-2 rounded" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>OT</div>
                <small>Approved Overtime</small>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Details Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2 text-primary"></i>
              Detailed Attendance Records
            </h5>
          </div>
          <div className="card-body">
            {attendanceLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
                <p className="mt-2">Loading attendance...</p>
              </div>
            ) : attendances.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-calendar-x fs-1 text-muted"></i>
                <p className="text-muted mt-2">No attendance records for this month</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Punch In</th>
                      <th>Punch Out</th>
                      <th>Hours</th>
                      <th>OT Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.sort((a, b) => new Date(b.date) - new Date(a.date)).map((att) => (
                      <tr key={att._id}>
                        <td>
                          <strong>{new Date(att.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                        </td>
                        <td>
                          {att.punchIn?.time
                            ? new Date(att.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : <span className="text-muted">Not punched in</span>}
                        </td>
                        <td>
                          {att.punchOut?.time
                            ? new Date(att.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : <span className="text-muted">Not punched out</span>}
                        </td>
                        <td><strong>{att.workingHours || 0} hrs</strong></td>
                        <td>
                          {att.overtime?.hours > 0 ? (
                            <span className={`badge ${att.overtime.status === 'approved' ? 'bg-info text-dark' : 'bg-light text-muted'}`}>
                              {att.overtime.hours} hrs ({att.overtime.status})
                            </span>
                          ) : (
                            '0 hrs'
                          )}
                        </td>
                        <td>
                          <span className={`badge ${att.status === 'completed' ? 'bg-success' : att.status === 'incomplete' ? 'bg-warning' : 'bg-danger'}`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserView;
