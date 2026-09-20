import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const AppHeaderDropdown = () => {
  const { user } = useSelector((state) => state.auth);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user?.email || 'U').charAt(0).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin': return '#dc3545';
      case 'manager': return '#fd7e14';
      case 'employee': return '#198754';
      default: return '#6c757d';
    }
  };

  return (
    <div className="user-menu position-relative">
      <div className="user-dropdown-container">
        <button
          className="user-button d-flex align-items-center gap-2 px-3 py-2 rounded"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        >
          <div className="user-avatar d-flex align-items-center justify-content-center">
            {getInitials()}
          </div>

          <span className="user-name fw-medium text-truncate me-1">
            {user?.name || user?.email}
          </span>

          <svg
            className="dropdown-arrow"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {userDropdownOpen && (
          <>
            <div
              className="dropdown-backdrop position-fixed top-0 start-0 w-100 h-100"
              onClick={() => setUserDropdownOpen(false)}
            />

            <div className="user-dropdown position-absolute end-0 mt-2 shadow rounded bg-white">
              <div className="dropdown-header px-3 py-3">
                <div className="user-info">
                  <strong className="d-block">{user?.name || 'User'}</strong>
                  <small className="text-muted d-block">{user?.email}</small>
                  <span 
                    className="badge mt-2" 
                    style={{ 
                      background: getRoleBadgeColor(), 
                      textTransform: 'capitalize' 
                    }}
                  >
                    {user?.role || 'Employee'}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider my-1" />

              <button
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                style={{
                  background: getRoleBadgeColor(),
                  color: 'white',
                  border: 'none'
                }}
                onClick={() => setUserDropdownOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" style={{ color: 'white' }}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                My Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppHeaderDropdown;