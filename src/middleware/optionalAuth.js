import jwt from 'jsonwebtoken';
import User from '../models/users.js';

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (_) {
    // invalid token, continue without user
  }

  next();
};

export default optionalAuth;
