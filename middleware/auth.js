const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.body.token;
    if (!token) {
      return res.status(401).json({ success: false, code: 'TOKEN_MISSING', message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      message: isExpired ? 'Session expired' : 'Authentication required',
    });
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Role verification failed' });
  }
};

exports.isStudent = (req, res, next) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ success: false, message: 'Student access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Role verification failed' });
  }
};
