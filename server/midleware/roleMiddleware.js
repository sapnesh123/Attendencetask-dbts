export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userRole = req.user.role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

export const isManager = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'manager' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Manager access required'
    });
  }
  next();
};

export const isEmployee = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'employee' && role !== 'manager' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Employee access required'
    });
  }
  next();
};
