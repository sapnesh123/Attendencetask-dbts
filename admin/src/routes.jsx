import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectCurrentRole } from './features/auth/authSlice';
import DefaultLayout from './layout/DefaultLayout';

const Loading = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Lazy load all pages
const Login = lazy(() => import('./views/pages/login/Login'));
const EmployeeDashboard = lazy(() => import('./views/dashboard/EmployeeDashboard'));
const EmployeeAttendance = lazy(() => import('./views/attendance/EmployeeAttendance'));
const EmployeePunch = lazy(() => import('./views/attendance/EmployeePunch'));
const EmployeeOvertime = lazy(() => import('./views/attendance/EmployeeOvertime'));
const EmployeeReports = lazy(() => import('./views/reports/EmployeeReports'));

const ManagerDashboard = lazy(() => import('./views/dashboard/ManagerDashboard'));
const ManagerTeamAttendance = lazy(() => import('./views/attendance/ManagerTeamAttendance'));
const ManagerOvertime = lazy(() => import('./views/attendance/ManagerOvertime'));
const ManagerReports = lazy(() => import('./views/reports/ManagerReports'));

const AdminDashboard = lazy(() => import('./views/dashboard/AdminDashboard'));
const AdminUsers = lazy(() => import('./views/users/AdminUsers'));
const AdminAttendance = lazy(() => import('./views/attendance/AdminAttendance'));
const AdminOvertime = lazy(() => import('./views/attendance/AdminOvertime'));
const AdminReports = lazy(() => import('./views/reports/AdminReports'));
const UserView = lazy(() => import('./views/users/UserView'));

// Role-based layout wrapper
const RoleLayout = ({ allowedRoles, children }) => {
  const role = useSelector(selectCurrentRole);
  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  return <DefaultLayout>{children}</DefaultLayout>;
};

const AdminRoute = ({ children }) => {
  const role = useSelector(selectCurrentRole)?.toLowerCase();
  if (role !== 'admin') {
    return <Navigate to={role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'} replace />;
  }
  return <DefaultLayout><Outlet /></DefaultLayout>;
};

const ManagerRoute = ({ children }) => {
  const role = useSelector(selectCurrentRole)?.toLowerCase();
  if (role !== 'manager' && role !== 'admin') {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }
  return <DefaultLayout><Outlet /></DefaultLayout>;
};

const AppRoutes = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Authenticated
  const getDefaultRoute = () => {
    const normalizedRole = role?.toLowerCase();
    switch (normalizedRole) {
      case 'admin': return '/admin/dashboard';
      case 'manager': return '/manager/dashboard';
      default: return '/employee/dashboard';
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Employee */}
        <Route path="/employee" element={<DefaultLayout><Outlet /></DefaultLayout>}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="punch" element={<EmployeePunch />} />
          <Route path="overtime" element={<EmployeeOvertime />} />
          <Route path="reports" element={<EmployeeReports />} />
        </Route>

        {/* Manager */}
        <Route path="/manager" element={<ManagerRoute />}>
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="team-attendance" element={<ManagerTeamAttendance />} />
          <Route path="team/:id" element={<UserView />} />
          <Route path="overtime" element={<ManagerOvertime />} />
          <Route path="reports" element={<ManagerReports />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<UserView />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="overtime" element={<AdminOvertime />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Fallback */}
        <Route path="/dashboard" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
