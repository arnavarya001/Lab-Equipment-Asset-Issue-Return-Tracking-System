const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const Request = require("../models/Request");
const { isLoggedIn, isAdmin } = require("../middleware/auth");

// protect all admin routes
router.use(isLoggedIn, isAdmin);

// GET /admin/dashboard - show metrics and recent activity
router.get("/dashboard", async (req, res) => {
  try {
    const assets = await Asset.find();
    const requests = await Request.find().populate("asset").populate("requester");

    // calculate totals using simple loops
    let totalQuantity = 0;
    let availableQuantity = 0;
    for (let i = 0; i < assets.length; i++) {
      totalQuantity += assets[i].quantity || 0;
      availableQuantity += assets[i].availableQuantity || 0;
    }

    let issuedQuantity = 0;
    let overdueRequests = [];
    const now = new Date();

    for (let i = 0; i < requests.length; i++) {
      const r = requests[i];
      if (r.status === "Issued") {
        issuedQuantity += r.quantity || 0;
        if (r.expectedReturnDate && new Date(r.expectedReturnDate) < now) {
          overdueRequests.push(r);
        }
      }
    }

    let damagedCount = 0;
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].condition === "Damaged" || assets[i].condition === "Lost") {
        damagedCount++;
      }
    }
    for (let i = 0; i < requests.length; i++) {
      if (requests[i].returnCondition === "Damaged" || requests[i].returnCondition === "Lost") {
        damagedCount++;
      }
    }

    const stats = {
      totalAssets: assets.length,
      totalQuantity: totalQuantity,
      availableQuantity: availableQuantity,
      issuedQuantity: issuedQuantity,
      overdueCount: overdueRequests.length,
      damagedCount: damagedCount
    };

    // get latest 5 requests
    const recentRequests = await Request.find()
      .populate("asset")
      .populate("requester")
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      stats: stats,
      recentRequests: recentRequests,
      overdueRequests: overdueRequests
    });
  } catch (err) {
    console.log("Error loading admin dashboard:", err);
    req.flash("error", "Could not load dashboard.");
    res.redirect("/");
  }
});

// GET /admin/assets - view all assets
router.get("/assets", async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.render("admin/assets", {
      title: "All Assets",
      assets: assets
    });
  } catch (err) {
    console.log("Error fetching assets:", err);
    req.flash("error", "Could not load assets.");
    res.redirect("/admin/dashboard");
  }
});

// GET /admin/assets/add - show form to add new asset
router.get("/assets/add", (req, res) => {
  res.render("admin/addAsset", { title: "Add New Asset" });
});

// POST /admin/assets/add - save new asset
router.post("/assets/add", async (req, res) => {
  try {
    const { assetTag, name, category, location, condition, quantity } = req.body;

    if (!assetTag || !name || !category || !location || !quantity) {
      req.flash("error", "Please fill all required fields!");
      return res.redirect("/admin/assets/add");
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      req.flash("error", "Quantity must be a positive number!");
      return res.redirect("/admin/assets/add");
    }

    // check if asset tag already exists
    const cleanTag = assetTag.toUpperCase().trim();
    const existing = await Asset.findOne({ assetTag: cleanTag });
    if (existing) {
      req.flash("error", "Asset tag already exists! Please use a unique tag.");
      return res.redirect("/admin/assets/add");
    }

    const newAsset = new Asset({
      assetTag: cleanTag,
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      condition: condition || "OK",
      quantity: qty,
      availableQuantity: qty
    });

    await newAsset.save();
    req.flash("success", "Equipment added successfully!");
    res.redirect("/admin/assets");
  } catch (err) {
    console.log("Error adding asset:", err);
    req.flash("error", "Failed to add asset.");
    res.redirect("/admin/assets/add");
  }
});

// GET /admin/assets/edit/:id - show edit form
router.get("/assets/edit/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash("error", "Asset not found!");
      return res.redirect("/admin/assets");
    }
    res.render("admin/editAsset", {
      title: "Edit Asset",
      asset: asset
    });
  } catch (err) {
    console.log("Error fetching asset for edit:", err);
    req.flash("error", "Invalid asset ID.");
    res.redirect("/admin/assets");
  }
});

// POST /admin/assets/edit/:id - update asset
router.post("/assets/edit/:id", async (req, res) => {
  try {
    const { name, category, location, condition, quantity, availableQuantity } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      req.flash("error", "Asset not found!");
      return res.redirect("/admin/assets");
    }

    const totalQty = parseInt(quantity, 10);
    const availQty = parseInt(availableQuantity, 10);

    if (isNaN(totalQty) || totalQty <= 0) {
      req.flash("error", "Total quantity must be at least 1.");
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    if (isNaN(availQty) || availQty < 0) {
      req.flash("error", "Available quantity cannot be negative.");
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    if (availQty > totalQty) {
      req.flash("error", "Available quantity cannot be greater than total quantity!");
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    asset.name = name.trim();
    asset.category = category.trim();
    asset.location = location.trim();
    asset.condition = condition || "OK";
    asset.quantity = totalQty;
    asset.availableQuantity = availQty;

    await asset.save();
    req.flash("success", "Asset updated successfully!");
    res.redirect("/admin/assets");
  } catch (err) {
    console.log("Error updating asset:", err);
    req.flash("error", "Failed to update asset.");
    res.redirect("/admin/assets");
  }
});

// POST /admin/assets/delete/:id - delete asset
router.post("/assets/delete/:id", async (req, res) => {
  try {
    const assetId = req.params.id;

    // do not delete if asset is currently issued or approved
    const activeRequest = await Request.findOne({
      asset: assetId,
      status: { $in: ["Approved", "Issued"] }
    });

    if (activeRequest) {
      req.flash("error", "Cannot delete equipment that is currently approved or issued!");
      return res.redirect("/admin/assets");
    }

    await Asset.findByIdAndDelete(assetId);
    req.flash("success", "Asset deleted successfully!");
    res.redirect("/admin/assets");
  } catch (err) {
    console.log("Error deleting asset:", err);
    req.flash("error", "Failed to delete asset.");
    res.redirect("/admin/assets");
  }
});

// POST /admin/assets/:id/maintenance - add maintenance log (stretch goal)
router.post("/assets/:id/maintenance", async (req, res) => {
  try {
    const { serviceDate, cost, nextServiceDue, notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      req.flash("error", "Asset not found!");
      return res.redirect("/admin/assets");
    }

    asset.maintenanceLogs.push({
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      cost: parseFloat(cost) || 0,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      notes: notes ? notes.trim() : ""
    });

    await asset.save();
    req.flash("success", "Maintenance log recorded successfully!");
    res.redirect(`/admin/assets/edit/${asset._id}`);
  } catch (err) {
    console.log("Error saving maintenance log:", err);
    req.flash("error", "Failed to add maintenance log.");
    res.redirect("/admin/assets");
  }
});

module.exports = router;
