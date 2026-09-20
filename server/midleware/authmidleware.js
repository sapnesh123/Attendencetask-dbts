import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import logger from '../helpers/logger.js';



const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header (primary) or cookie (fallback)
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token missing',
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn(`Auth failed: User not found for ID ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // 4. Attach user to request
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      PSM: user.PSM || [],
    };

    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token invalid or expired',
    });
  }
};

export default protect;