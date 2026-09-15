const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const Request = require("../models/Request");
const { isLoggedIn, isRequester } = require("../middleware/auth");

// protect all requester routes
router.use(isLoggedIn, isRequester);

// GET /requester/dashboard - overview of user requests
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRequests = await Request.find({ requester: userId })
      .populate("asset")
      .sort({ createdAt: -1 });

    let pendingCount = 0;
    let issuedCount = 0;
    let returnedCount = 0;
    let overdueCount = 0;
    const now = new Date();

    for (let i = 0; i < userRequests.length; i++) {
      const r = userRequests[i];
      if (r.status === "Pending") {
        pendingCount++;
      } else if (r.status === "Issued") {
        issuedCount++;
        if (r.expectedReturnDate && new Date(r.expectedReturnDate) < now) {
          overdueCount++;
        }
      } else if (r.status === "Returned") {
        returnedCount++;
      }
    }

    const stats = {
      totalRequests: userRequests.length,
      pendingCount: pendingCount,
      issuedCount: issuedCount,
      returnedCount: returnedCount,
      overdueCount: overdueCount
    };

    res.render("requester/dashboard", {
      title: "Student Dashboard",
      stats: stats,
      recentRequests: userRequests.slice(0, 5)
    });
  } catch (err) {
    console.log("Error loading requester dashboard:", err);
    req.flash("error", "Could not load dashboard.");
    res.redirect("/");
  }
});

// GET /requester/equipment - browse available equipment
router.get("/equipment", async (req, res) => {
  try {
    // only show items that have at least 1 unit available on shelf
    const availableAssets = await Asset.find({ availableQuantity: { $gt: 0 } }).sort({ name: 1 });

    res.render("requester/equipment", {
      title: "Available Equipment",
      assets: availableAssets
    });
  } catch (err) {
    console.log("Error loading equipment catalog:", err);
    req.flash("error", "Could not load equipment.");
    res.redirect("/requester/dashboard");
  }
});

// GET /requester/request/:id - show form to request equipment
router.get("/request/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash("error", "Equipment not found!");
      return res.redirect("/requester/equipment");
    }

    if (asset.availableQuantity <= 0) {
      req.flash("error", "This equipment is currently out of stock.");
      return res.redirect("/requester/equipment");
    }

    res.render("requester/newRequest", {
      title: "Request Equipment",
      asset: asset
    });
  } catch (err) {
    console.log("Error opening request form:", err);
    req.flash("error", "Invalid equipment selected.");
    res.redirect("/requester/equipment");
  }
});

// POST /requester/request - submit borrow request
router.post("/request", async (req, res) => {
  try {
    const { assetId, quantity, purpose, expectedReturnDate } = req.body;
    const userId = req.session.user.id;

    if (!assetId || !quantity || !purpose || !expectedReturnDate) {
      req.flash("error", "Please fill all fields!");
      return res.redirect("/requester/equipment");
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      req.flash("error", "Please enter a valid quantity of at least 1.");
      return res.redirect(`/requester/request/${assetId}`);
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash("error", "Equipment does not exist!");
      return res.redirect("/requester/equipment");
    }

    // prevent requesting more units than currently available
    if (requestedQty > asset.availableQuantity) {
      req.flash(
        "error",
        `Cannot request ${requestedQty} units. Only ${asset.availableQuantity} available!`
      );
      return res.redirect(`/requester/request/${assetId}`);
    }

    // check that return date is not in the past
    const returnDate = new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (returnDate < today) {
      req.flash("error", "Return date cannot be in the past!");
      return res.redirect(`/requester/request/${assetId}`);
    }

    // create new request with status Pending
    const newRequest = new Request({
      requester: userId,
      asset: asset._id,
      quantity: requestedQty,
      purpose: purpose.trim(),
      expectedReturnDate: returnDate,
      status: "Pending"
    });

    await newRequest.save();

    req.flash("success", "Request submitted successfully! Waiting for in-charge approval.");
    res.redirect("/requester/requests");
  } catch (err) {
    console.log("Error submitting request:", err);
    req.flash("error", "Failed to submit request.");
    res.redirect("/requester/equipment");
  }
});

// GET /requester/requests - list all requests made by the user
router.get("/requests", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRequests = await Request.find({ requester: userId })
      .populate("asset")
      .sort({ createdAt: -1 });

    res.render("requester/requests", {
      title: "My Requests",
      requests: userRequests
    });
  } catch (err) {
    console.log("Error loading requests list:", err);
    req.flash("error", "Could not load requests.");
    res.redirect("/requester/dashboard");
  }
});

module.exports = router;
