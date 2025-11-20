// backend/middleware/roleCheck.js
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    // normalize
    const userRole = String(req.user.role || '').toLowerCase();
    const allowed = allowedRoles.map(r => String(r).toLowerCase());
    if (!allowed.includes(userRole)) return res.status(403).json({ message: 'Forbidden - insufficient role' });
    next();
  };
};
