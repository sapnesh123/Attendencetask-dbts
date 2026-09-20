import React, { useState } from 'react';
import { useGetAllUsersQuery, useGetDateRangeAttendanceReportQuery } from '../../features/api/apiSlice';

const AdminReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [searched, setSearched] = useState(false);

  const { data: employeesRes } = useGetAllUsersQuery({ role: 'employee', limit: 100 });
  const employees = employeesRes?.data || [];

  const { data: reportData, isLoading, isSuccess } = useGetDateRangeAttendanceReportQuery(
    { startDate, endDate, userId },
    { skip: !startDate || !endDate }
  );

  const showResults = searched || isSuccess;

  const handleExport = (type) => {
    if (!startDate || !endDate) return;

    const baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/dashboard/export/${type}`;
    const token = localStorage.getItem('token');

    let url = `${baseUrl}?startDate=${startDate}&endDate=${endDate}`;
    if (userId) url += `&userId=${userId}`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `attendance_report_${startDate}_to_${endDate}.${type === 'csv' ? 'csv' : 'xls'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error('Export error:', err));
  };

  const attendances = reportData?.data || [];
  const summary = reportData?.summary || {};
  const users = employees || [];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>System Reports</h1>
        <p className="page-subtitle">Generate and export attendance reports</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Employee (Optional)</label>
              <select
                className="form-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">All Employees</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setSearched(true)}
                disabled={!startDate || !endDate}
              >
                Search
              </button>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-12 d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={() => handleExport('csv')}
                disabled={!startDate || !endDate}
              >
                Export CSV
              </button>
              <button
                className="btn btn-info"
                onClick={() => handleExport('excel')}
                disabled={!startDate || !endDate}
              >
                Export Excel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleExport('pdf')}
                disabled={!startDate || !endDate}
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResults && (
        <>
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="simple-card">
                <div className="simple-card-title">Total Records</div>
                <div className="simple-card-value">{summary.totalDays || 0}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="simple-card simple-card-success">
                <div className="simple-card-title">Completed</div>
                <div className="simple-card-value">{summary.completedDays || 0}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="simple-card simple-card-warning">
                <div className="simple-card-title">Incomplete</div>
                <div className="simple-card-value">{summary.incompleteDays || 0}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="simple-card simple-card-danger">
                <div className="simple-card-title">Total Hours</div>
                <div className="simple-card-value">{summary.totalWorkingHours || 0}</div>
              </div>
            </div>
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
                <p className="text-muted text-center py-4">No records found</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Punch In</th>
                        <th>Punch Out</th>
                        <th>Hours</th>
                        <th>OT</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((attendance) => (
                        <tr key={attendance._id}>
                          <td><strong>{attendance.name}</strong></td>
                          <td>{attendance.employeeId}</td>
                          <td>{attendance.department}</td>
                          <td>{attendance.date}</td>
                          <td>{attendance.punchInTime}</td>
                          <td>{attendance.punchOutTime}</td>
                          <td>{attendance.workingHours} hrs</td>
                          <td>{attendance.overtimeHours} hrs</td>
                          <td>
                            <span className={`badge ${attendance.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                              {attendance.status}
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
        </>
      )}
    </div>
  );
};

export default AdminReports;