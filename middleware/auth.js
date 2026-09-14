// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/login');
}

// Middleware to restrict route to Admin only
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Admin privileges required.');
  return res.redirect('/login');
}

// Middleware to restrict route to Lab In-charge only
function isLabIncharge(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'lab-incharge') {
    return next();
  }
  req.flash('error', 'Access denied. Lab In-charge privileges required.');
  return res.redirect('/login');
}

// Middleware to restrict route to Requester (Student/Staff) only
function isRequester(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'requester') {
    return next();
  }
  req.flash('error', 'Access denied. Requester privileges required.');
  return res.redirect('/login');
}

module.exports = {
  isLoggedIn,
  isAdmin,
  isLabIncharge,
  isRequester
};
