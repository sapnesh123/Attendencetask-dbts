import React, { useState } from 'react';
import {
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserMutation,
} from '../../features/api/apiSlice';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  const { data, isLoading } = useGetAllUsersQuery({ page, limit: 10, search, role: roleFilter });
  const { data: managersRes } = useGetAllUsersQuery({ role: 'manager', limit: 100 });
  const [updateUserRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  const [updateUser] = useUpdateUserMutation();

  const users = data?.data || [];
  const pagination = data?.pagination || {};
  const managers = managersRes?.data || [];

  const handleRoleUpdate = async (id, role, managerId) => {
    try {
      // Only update role if it changed
      if (role !== selectedUser.role) {
        await updateUserRole({ id, role }).unwrap();
      }

      // Update manager if it changed
      const currentManagerId = selectedUser.managerId?._id || selectedUser.managerId || '';
      if (managerId !== currentManagerId) {
        await updateUser({ id, managerId: managerId || null }).unwrap();
      }

      alert('Staff details updated successfully!');
    } catch (err) {
      alert('Failed to update staff details');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge bg-danger">Admin</span>;
      case 'manager': return <span className="badge bg-primary">Manager</span>;
      case 'employee': return <span className="badge bg-success">Employee</span>;
      default: return <span className="badge bg-secondary">{role}</span>;
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setSelectedManager(user.managerId?._id || user.managerId || '');
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    await handleRoleUpdate(selectedUser._id, newRole, selectedManager);
    setShowRoleModal(false);
  };

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header mb-4">
          <h1 className="text-primary">
            <i className="bi bi-people-fill me-2"></i>
            User Management
          </h1>
          <p className="text-muted mb-0">Manage all users and their roles</p>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email or employee ID"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="col-md-5 d-flex align-items-center justify-content-end">
                <span className="text-muted me-3">Total Staff: {pagination.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="mt-2">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-person-x fs-1 text-muted"></i>
                <p className="text-muted mt-2">No users found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>User Info</th>
                      <th>Employee ID</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user._id}>
                        <td>{(page - 1) * 10 + idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px', fontSize: '0.875rem' }}>
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <strong>{user.name || 'N/A'}</strong>
                              <br />
                              <small className="text-muted">{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td><code>{user.employeeId || '—'}</code></td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{user.departmentName || '—'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/admin/users/${user._id}`}
                              className="btn btn-outline-info"
                              title="View Profile & Attendance"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => openRoleModal(user)}
                              title="Change Role"
                            >
                              <i className="bi bi-person-gear"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="text-muted">
              Page {pagination.page} of {pagination.pages} (Total: {pagination.total} users)
            </span>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Staff Role & Assignment</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-3">
                    Edit details for: <strong>{selectedUser?.name}</strong>
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Current Role</label>
                    <div>{getRoleBadge(selectedUser?.role)}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Role</label>
                    <select
                      className="form-select"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {(newRole === 'employee' || newRole === 'manager') && (
                    <div className="mb-3">
                      <label className="form-label">Assign Reporting Manager</label>
                      <select
                        className="form-select"
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                      >
                        <option value="">No Manager (None)</option>
                        {managers.filter(m => m._id !== selectedUser?._id).map(m => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.employeeId})
                          </option>
                        ))}
                      </select>
                      <div className="form-text text-muted small">
                        Assign this user to a manager for dashboard visibility.
                      </div>
                    </div>
                  )}
                  <div className="alert alert-warning small">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Changing role will affect user's permissions and accessible features.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={confirmRoleChange}
                    disabled={updatingRole || (newRole === selectedUser?.role && selectedManager === (selectedUser?.managerId?._id || selectedUser?.managerId || ''))}
                  >
                    {updatingRole ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
