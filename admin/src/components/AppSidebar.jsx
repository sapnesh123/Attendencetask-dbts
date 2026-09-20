import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getNavByRole } from '../_nav';
import { logout as logoutAction } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/api/apiSlice';

const AppSidebar = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = getNavByRole(user?.role);
  const [logoutRequest] = useLogoutMutation();

  const isActive = (path) => location.pathname === path;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return '#212529';
      case 'manager': return '#495057';
      default: return '#6c757d';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
        );
      case 'manager':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        );
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch (err) {
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user?.email || 'U').charAt(0).toUpperCase();
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to={`/${user?.role}/dashboard`} className="logo">
          <svg viewBox="0 0 24 24" fill={getRoleColor()} width="32" height="32">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div className="ms-2">
            <span className="logo-text" style={{ color: getRoleColor() }}>
              Attendance
            </span>
            <div style={{ fontSize: '0.65rem', color: '#6c757d', textTransform: 'uppercase' }}>
              Management
            </div>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div style={{ padding: '10px 20px', marginBottom: '10px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '15px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: '#f8f9fa',
                color: '#212529',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1rem',
                border: '1px solid #dee2e6'
              }}>
                {getInitials()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  color: '#212529',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.name || 'User'}
                </div>
                <div className="d-flex align-items-center gap-1" style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul>
          {navigation.map((item, index) => (
            <li key={index}>
              <Link
                to={item.to}
                className={isActive(item.to) ? 'active' : ''}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <span className="icon">{item.icon}</span>
                <span className="title">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            color: '#dc3545',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            marginBottom: '10px'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#fff5f5';
            e.target.style.borderColor = '#ffc9c9';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#ffffff';
            e.target.style.borderColor = '#e9ecef';
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
          Sign Out
        </button>
        <p className="version mb-0">Attendance System v1.0</p>
      </div>
    </div>
  );
};

export default React.memo(AppSidebar);