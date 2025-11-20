// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware: verifies JWT from Authorization header.
 * 
 * Expected header format:
 *    Authorization: Bearer <token>
 * 
 * On success: req.user = { id, role, email }
 */
module.exports = function (req, res, next) {
  try {
    const header = req.headers['authorization'];

    if (!header) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const parts = header.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    // Attach user to request for later use
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (err) {
    console.error('[auth middleware] JWT error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
