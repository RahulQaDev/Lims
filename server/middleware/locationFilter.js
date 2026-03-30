// Middleware that extracts location context from the authenticated user
// and makes it available for controllers to filter queries
const locationFilter = (req, res, next) => {
  if (req.user) {
    req.locationId = req.user.locationId;
    req.isHQ = req.user.role === 'ADMIN' || req.user.role === 'LAB_DIRECTOR';
    if (req.isHQ) {
      const override = req.query.locationId || req.headers['x-location-id'];
      if (override && override !== 'all') {
        req.locationId = parseInt(override);
        req.locationFilter = { locationId: parseInt(override) };
      } else if (override === 'all') {
        req.locationId = null;
        req.locationFilter = {};
      } else {
        req.locationFilter = req.user.locationId ? { locationId: req.user.locationId } : {};
      }
    } else {
      req.locationFilter = req.user.locationId ? { locationId: req.user.locationId } : {};
    }
  }
  next();
};

module.exports = { locationFilter };
