// check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash("error", "Please login first!");
  res.redirect("/login");
}

// check if user is admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    return next();
  }
  req.flash("error", "Access denied! Only admin can view this page.");
  res.redirect("/login");
}

// check if user is lab incharge
function isLabIncharge(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "lab-incharge") {
    return next();
  }
  req.flash("error", "Access denied! Only lab in-charge can view this page.");
  res.redirect("/login");
}

// check if user is requester
function isRequester(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "requester") {
    return next();
  }
  req.flash("error", "Access denied! Only students or staff can view this page.");
  res.redirect("/login");
}

module.exports = {
  isLoggedIn,
  isAdmin,
  isLabIncharge,
  isRequester
};
