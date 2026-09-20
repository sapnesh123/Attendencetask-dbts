import React, { useState } from 'react';
import { useGetMyOvertimeRequestsQuery, useRequestOvertimeMutation } from '../../features/api/apiSlice';

const EmployeeOvertime = () => {
  const { data, isLoading } = useGetMyOvertimeRequestsQuery();
  const overtimeRequests = data?.data || [];
  const [requestOvertime, { isLoading: loading }] = useRequestOvertimeMutation();

  const [showModal, setShowModal] = useState(false);
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await requestOvertime({
        hours: parseFloat(hours),
        reason
      }).unwrap();

      setSuccess('Overtime request submitted successfully');
      setShowModal(false);
      setHours('');
      setReason('');
    } catch (err) {
      setError(err?.data?.message || 'Failed to submit overtime request');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Overtime Requests</h1>
          <p className="page-subtitle">Manage your overtime requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Request Overtime
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4" role="alert">
          {success}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : overtimeRequests.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No overtime requests found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Requested At</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeRequests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        {request.date 
                          ? new Date(request.date).toLocaleDateString('en-IN')
                          : '-'}
                      </td>
                      <td>{request.hours} hrs</td>
                      <td>{request.reason || '-'}</td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>
                        {request.requestedAt 
                          ? new Date(request.requestedAt).toLocaleString('en-IN')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Overtime</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter overtime hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      min="0.5"
                      step="0.5"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason (Optional)</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter reason for overtime"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeOvertime;