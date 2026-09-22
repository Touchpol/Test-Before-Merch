const jwt = require('jsonwebtoken');

const authUser = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied, no token' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decodedToken.userId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next();
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decodedToken.userId };
  } catch (err) {
    // invalid/expired token — continue as guest
  }
  next();
};

module.exports = { authUser, optionalAuth };