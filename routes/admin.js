const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Protect all admin routes
router.use(isLoggedIn, isAdmin);

// GET /admin/dashboard: Real-time institutional stats
router.get('/dashboard', async (req, res) => {
  try {
    const assets = await Asset.find();
    const requests = await Request.find().populate('asset').populate('requester');

    // Calculate aggregated statistics directly from MongoDB data
    const totalAssets = assets.length;
    let totalQuantity = 0;
    let availableQuantity = 0;

    assets.forEach((asset) => {
      totalQuantity += asset.quantity || 0;
      availableQuantity += asset.availableQuantity || 0;
    });

    const issuedRequests = requests.filter((r) => r.status === 'Issued');
    const issuedQuantity = issuedRequests.reduce((sum, r) => sum + r.quantity, 0);

    const now = new Date();
    const overdueRequests = issuedRequests.filter((r) => r.expectedReturnDate && new Date(r.expectedReturnDate) < now);

    // Damaged or Lost tracking: assets with non-OK condition + requests returned damaged/lost
    const damagedAssets = assets.filter((a) => a.condition === 'Damaged' || a.condition === 'Lost');
    const damagedReturns = requests.filter((r) => r.returnCondition === 'Damaged' || r.returnCondition === 'Lost');

    const stats = {
      totalAssets,
      totalQuantity,
      availableQuantity,
      issuedQuantity,
      overdueCount: overdueRequests.length,
      damagedCount: damagedAssets.length + damagedReturns.length
    };

    // Recent requests for overview
    const recentRequests = await Request.find()
      .populate('asset')
      .populate('requester')
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats,
      recentRequests,
      overdueRequests
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    req.flash('error', 'Error loading admin dashboard.');
    res.redirect('/');
  }
});

// GET /admin/assets: List all assets
router.get('/assets', async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.render('admin/assets', {
      title: 'Manage Assets',
      assets
    });
  } catch (err) {
    console.error('Assets List Error:', err);
    req.flash('error', 'Unable to retrieve assets.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/assets/add: Show form to add asset
router.get('/assets/add', (req, res) => {
  res.render('admin/addAsset', { title: 'Add New Asset' });
});

// POST /admin/assets/add: Process asset creation
router.post('/assets/add', async (req, res) => {
  try {
    const { assetTag, name, category, location, condition, quantity } = req.body;

    // Backend validation
    if (!assetTag || !name || !category || !location || !quantity) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/admin/assets/add');
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      req.flash('error', 'Quantity must be a positive number greater than 0.');
      return res.redirect('/admin/assets/add');
    }

    // Check duplicate tag
    const existing = await Asset.findOne({ assetTag: assetTag.toUpperCase().trim() });
    if (existing) {
      req.flash('error', `Asset with Tag "${assetTag.toUpperCase().trim()}" already exists.`);
      return res.redirect('/admin/assets/add');
    }

    const newAsset = new Asset({
      assetTag: assetTag.toUpperCase().trim(),
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      condition: condition || 'OK',
      quantity: parsedQty,
      availableQuantity: parsedQty // Initially, all units are available
    });

    await newAsset.save();
    req.flash('success', `Asset "${newAsset.name}" (${newAsset.assetTag}) created successfully!`);
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Add Asset Error:', err);
    req.flash('error', 'Failed to add asset.');
    res.redirect('/admin/assets/add');
  }
});

// GET /admin/assets/edit/:id: Show edit form
router.get('/assets/edit/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }
    res.render('admin/editAsset', {
      title: `Edit ${asset.name}`,
      asset
    });
  } catch (err) {
    console.error('Edit Asset View Error:', err);
    req.flash('error', 'Invalid asset ID.');
    res.redirect('/admin/assets');
  }
});

// POST /admin/assets/edit/:id: Update asset
router.post('/assets/edit/:id', async (req, res) => {
  try {
    const { name, category, location, condition, quantity, availableQuantity } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    const totalQty = parseInt(quantity, 10);
    const availQty = parseInt(availableQuantity, 10);

    if (isNaN(totalQty) || totalQty <= 0) {
      req.flash('error', 'Total quantity must be at least 1.');
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    if (isNaN(availQty) || availQty < 0) {
      req.flash('error', 'Available quantity cannot be negative.');
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    // Business rule: availableQuantity cannot exceed total quantity
    if (availQty > totalQty) {
      req.flash('error', 'Available quantity cannot exceed total quantity.');
      return res.redirect(`/admin/assets/edit/${asset._id}`);
    }

    asset.name = name.trim();
    asset.category = category.trim();
    asset.location = location.trim();
    asset.condition = condition || 'OK';
    asset.quantity = totalQty;
    asset.availableQuantity = availQty;

    await asset.save();
    req.flash('success', `Asset "${asset.assetTag}" updated successfully.`);
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Update Asset Error:', err);
    req.flash('error', 'Failed to update asset.');
    res.redirect('/admin/assets');
  }
});

// POST /admin/assets/delete/:id: Remove asset
router.post('/assets/delete/:id', async (req, res) => {
  try {
    const assetId = req.params.id;

    // Guard: Check if asset is actively issued or approved
    const activeRequests = await Request.findOne({
      asset: assetId,
      status: { $in: ['Approved', 'Issued'] }
    });

    if (activeRequests) {
      req.flash('error', 'Cannot delete asset while active requests or issues are linked to it.');
      return res.redirect('/admin/assets');
    }

    await Asset.findByIdAndDelete(assetId);
    req.flash('success', 'Asset deleted successfully.');
    res.redirect('/admin/assets');
  } catch (err) {
    console.error('Delete Asset Error:', err);
    req.flash('error', 'Failed to delete asset.');
    res.redirect('/admin/assets');
  }
});

// Optional Stretch Goal: POST /admin/assets/:id/maintenance - Add maintenance log
router.post('/assets/:id/maintenance', async (req, res) => {
  try {
    const { serviceDate, cost, nextServiceDue, notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    asset.maintenanceLogs.push({
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      cost: parseFloat(cost) || 0,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      notes: notes ? notes.trim() : ''
    });

    await asset.save();
    req.flash('success', 'Maintenance record added successfully.');
    res.redirect(`/admin/assets/edit/${asset._id}`);
  } catch (err) {
    console.error('Maintenance Log Error:', err);
    req.flash('error', 'Failed to add maintenance log.');
    res.redirect('/admin/assets');
  }
});

module.exports = router;
