const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const Request = require("../models/Request");
const { isLoggedIn, isLabIncharge } = require("../middleware/auth");

// protect all lab incharge routes
router.use(isLoggedIn, isLabIncharge);

// GET /lab-incharge/dashboard - view requests and overdue equipment
router.get("/dashboard", async (req, res) => {
  try {
    const allRequests = await Request.find()
      .populate("asset")
      .populate("requester")
      .sort({ createdAt: -1 });

    const pendingRequests = [];
    const approvedRequests = [];
    const issuedRequests = [];
    const returnedRequests = [];
    const overdueRequests = [];
    const now = new Date();

    for (let i = 0; i < allRequests.length; i++) {
      const r = allRequests[i];
      if (r.status === "Pending") {
        pendingRequests.push(r);
      } else if (r.status === "Approved") {
        approvedRequests.push(r);
      } else if (r.status === "Issued") {
        issuedRequests.push(r);
        if (r.expectedReturnDate && new Date(r.expectedReturnDate) < now) {
          overdueRequests.push(r);
        }
      } else if (r.status === "Returned") {
        returnedRequests.push(r);
      }
    }

    const stats = {
      pendingCount: pendingRequests.length,
      approvedCount: approvedRequests.length,
      issuedCount: issuedRequests.length,
      returnedCount: returnedRequests.length,
      overdueCount: overdueRequests.length
    };

    res.render("labIncharge/dashboard", {
      title: "Lab In-charge Dashboard",
      stats: stats,
      pendingRequests: pendingRequests.slice(0, 5),
      overdueRequests: overdueRequests
    });
  } catch (err) {
    console.log("Error loading lab incharge dashboard:", err);
    req.flash("error", "Failed to load dashboard.");
    res.redirect("/");
  }
});

// GET /lab-incharge/requests - view all requests queue
router.get("/requests", async (req, res) => {
  try {
    let filter = {};
    if (req.query.status) {
      filter = { status: req.query.status };
    }

    const requests = await Request.find(filter)
      .populate("asset")
      .populate("requester")
      .sort({ createdAt: -1 });

    res.render("labIncharge/requests", {
      title: "Manage Requests",
      requests: requests,
      currentFilter: req.query.status || "All"
    });
  } catch (err) {
    console.log("Error loading requests:", err);
    req.flash("error", "Could not load requests.");
    res.redirect("/lab-incharge/dashboard");
  }
});

// POST /lab-incharge/request/:id/approve - approve a request
router.post("/request/:id/approve", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      req.flash("error", "Request not found!");
      return res.redirect("/lab-incharge/requests");
    }

    if (request.status !== "Pending") {
      req.flash("error", `Cannot approve a request with status "${request.status}".`);
      return res.redirect("/lab-incharge/requests");
    }

    request.status = "Approved";
    await request.save();

    req.flash("success", "Request approved! Equipment can now be physically handed over.");
    res.redirect("/lab-incharge/requests");
  } catch (err) {
    console.log("Error approving request:", err);
    req.flash("error", "Failed to approve request.");
    res.redirect("/lab-incharge/requests");
  }
});

// POST /lab-incharge/request/:id/reject - reject a request
router.post("/request/:id/reject", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      req.flash("error", "Request not found!");
      return res.redirect("/lab-incharge/requests");
    }

    if (request.status !== "Pending") {
      req.flash("error", `Cannot reject a request with status "${request.status}".`);
      return res.redirect("/lab-incharge/requests");
    }

    const { remarks } = req.body;
    request.status = "Rejected";
    if (remarks) {
      request.remarks = remarks.trim();
    }

    await request.save();

    req.flash("success", "Request rejected.");
    res.redirect("/lab-incharge/requests");
  } catch (err) {
    console.log("Error rejecting request:", err);
    req.flash("error", "Failed to reject request.");
    res.redirect("/lab-incharge/requests");
  }
});

// POST /lab-incharge/request/:id/issue - physically hand over and issue equipment
router.post("/request/:id/issue", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("asset");
    if (!request) {
      req.flash("error", "Request not found!");
      return res.redirect("/lab-incharge/requests");
    }

    if (request.status !== "Approved") {
      req.flash("error", "Only approved requests can be issued!");
      return res.redirect("/lab-incharge/requests");
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      req.flash("error", "Asset not found in database.");
      return res.redirect("/lab-incharge/requests");
    }

    // prevent issuing more than available stock
    if (request.quantity > asset.availableQuantity) {
      req.flash("error", `Cannot issue! Only ${asset.availableQuantity} unit(s) available.`);
      return res.redirect("/lab-incharge/requests");
    }

    // decrement available quantity
    asset.availableQuantity = asset.availableQuantity - request.quantity;
    await asset.save();

    // mark request as Issued
    request.status = "Issued";
    request.issuedAt = new Date();
    await request.save();

    req.flash("success", "Equipment issued successfully!");
    res.redirect("/lab-incharge/returns");
  } catch (err) {
    console.log("Error issuing equipment:", err);
    req.flash("error", "Failed to issue equipment.");
    res.redirect("/lab-incharge/requests");
  }
});

// GET /lab-incharge/returns - view active checkouts awaiting return
router.get("/returns", async (req, res) => {
  try {
    const issuedRequests = await Request.find({ status: "Issued" })
      .populate("asset")
      .populate("requester")
      .sort({ expectedReturnDate: 1 });

    res.render("labIncharge/returns", {
      title: "Active Issues & Returns",
      issuedRequests: issuedRequests
    });
  } catch (err) {
    console.log("Error loading active returns:", err);
    req.flash("error", "Could not load returns.");
    res.redirect("/lab-incharge/dashboard");
  }
});

// POST /lab-incharge/request/:id/return - mark equipment as returned and grade condition
router.post("/request/:id/return", async (req, res) => {
  try {
    const { returnCondition, remarks } = req.body;
    const request = await Request.findById(req.params.id).populate("asset");

    if (!request) {
      req.flash("error", "Request not found!");
      return res.redirect("/lab-incharge/returns");
    }

    if (request.status !== "Issued") {
      req.flash("error", "Only issued equipment can be returned!");
      return res.redirect("/lab-incharge/returns");
    }

    if (!returnCondition) {
      req.flash("error", "Please select the return condition (OK, Damaged, or Lost).");
      return res.redirect("/lab-incharge/returns");
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      req.flash("error", "Asset not found!");
      return res.redirect("/lab-incharge/returns");
    }

    // update request status
    request.status = "Returned";
    request.returnedAt = new Date();
    request.returnCondition = returnCondition;
    if (remarks) {
      request.remarks = remarks.trim();
    }
    await request.save();

    // update asset inventory based on return condition
    if (returnCondition === "OK") {
      // restore available stock
      asset.availableQuantity = asset.availableQuantity + request.quantity;
      if (asset.availableQuantity > asset.quantity) {
        asset.availableQuantity = asset.quantity;
      }
    } else if (returnCondition === "Damaged") {
      // damaged equipment is not added back to available stock
      asset.condition = "Damaged";
    } else if (returnCondition === "Lost") {
      // lost equipment reduces total inventory count
      asset.quantity = asset.quantity - request.quantity;
      if (asset.quantity < 0) {
        asset.quantity = 0;
      }
      asset.condition = "Lost";
    }

    await asset.save();

    req.flash("success", `Return recorded with condition: ${returnCondition}.`);
    res.redirect("/lab-incharge/returns");
  } catch (err) {
    console.log("Error processing return:", err);
    req.flash("error", "Failed to record return.");
    res.redirect("/lab-incharge/returns");
  }
});

module.exports = router;
