import React, { useState } from 'react';
import { useGetDateRangeAttendanceReportQuery } from '../../features/api/apiSlice';
import { Link } from 'react-router-dom';

const ManagerReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searched, setSearched] = useState(false);

  const { data: reportData, isLoading, isSuccess } = useGetDateRangeAttendanceReportQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );

  const showResults = searched || isSuccess;

  const handleExport = (type) => {
    if (!startDate || !endDate) return;

    const baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/dashboard/export/${type}`;
    const token = localStorage.getItem('token');

    const url = `${baseUrl}?startDate=${startDate}&endDate=${endDate}`;

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
        a.download = `team_attendance_${startDate}_to_${endDate}.${type === 'csv' ? 'csv' : 'xls'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => { });
  };

  const attendances = reportData?.data || [];
  const summary = reportData?.summary || {};

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Team Reports</h1>
        <p className="page-subtitle">View and export team attendance reports</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-primary me-2"
                onClick={() => setSearched(true)}
                disabled={!startDate || !endDate}
              >
                Search
              </button>
              <button
                className="btn btn-success me-2"
                onClick={() => handleExport('csv')}
                disabled={!startDate || !endDate}
              >
                CSV
              </button>
              <button
                className="btn btn-info"
                onClick={() => handleExport('excel')}
                disabled={!startDate || !endDate}
              >
                Excel
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
                        <th>Date</th>
                        <th>Punch In</th>
                        <th>Punch Out</th>
                        <th>Hours</th>
                        <th>Overtime</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((attendance) => (
                        <tr key={attendance._id}>
                          <td>
                            <Link to={`/manager/team/${attendance.userId}`} className="text-decoration-none">
                              <strong>{attendance.name}</strong>
                            </Link>
                            <p className="mb-0 text-muted small">{attendance.employeeId}</p>
                          </td>
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

export default ManagerReports;