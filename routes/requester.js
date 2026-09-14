const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const { isLoggedIn, isRequester } = require('../middleware/auth');

// Protect all requester routes
router.use(isLoggedIn, isRequester);

// GET /requester/dashboard: Overview of personal requests
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRequests = await Request.find({ requester: userId })
      .populate('asset')
      .sort({ createdAt: -1 });

    const totalRequests = userRequests.length;
    const pendingCount = userRequests.filter((r) => r.status === 'Pending').length;
    const issuedCount = userRequests.filter((r) => r.status === 'Issued').length;
    const returnedCount = userRequests.filter((r) => r.status === 'Returned').length;

    // Check for any overdue equipment currently in possession
    const now = new Date();
    const overdueCount = userRequests.filter(
      (r) => r.status === 'Issued' && r.expectedReturnDate && new Date(r.expectedReturnDate) < now
    ).length;

    res.render('requester/dashboard', {
      title: 'Requester Dashboard',
      stats: {
        totalRequests,
        pendingCount,
        issuedCount,
        returnedCount,
        overdueCount
      },
      recentRequests: userRequests.slice(0, 5)
    });
  } catch (err) {
    console.error('Requester Dashboard Error:', err);
    req.flash('error', 'Unable to load dashboard.');
    res.redirect('/');
  }
});

// GET /requester/equipment: Browse available equipment
router.get('/equipment', async (req, res) => {
  try {
    // Only display assets that have available units on shelf
    const availableAssets = await Asset.find({ availableQuantity: { $gt: 0 } }).sort({ name: 1 });
    res.render('requester/equipment', {
      title: 'Available Equipment',
      assets: availableAssets
    });
  } catch (err) {
    console.error('Equipment Catalog Error:', err);
    req.flash('error', 'Unable to load equipment catalog.');
    res.redirect('/requester/dashboard');
  }
});

// GET /requester/request/:id: Form to request a specific asset
router.get('/request/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/requester/equipment');
    }

    if (asset.availableQuantity <= 0) {
      req.flash('error', 'Sorry, this equipment is currently out of stock.');
      return res.redirect('/requester/equipment');
    }

    res.render('requester/newRequest', {
      title: `Request ${asset.name}`,
      asset
    });
  } catch (err) {
    console.error('New Request Page Error:', err);
    req.flash('error', 'Invalid asset selected.');
    res.redirect('/requester/equipment');
  }
});

// POST /requester/request: Submit an issue request
router.post('/request', async (req, res) => {
  try {
    const { assetId, quantity, purpose, expectedReturnDate } = req.body;
    const userId = req.session.user.id;

    if (!assetId || !quantity || !purpose || !expectedReturnDate) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/requester/equipment');
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      req.flash('error', 'Please enter a valid quantity of at least 1.');
      return res.redirect(`/requester/request/${assetId}`);
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset does not exist.');
      return res.redirect('/requester/equipment');
    }

    // MANDATORY REQUIREMENT: Server-side validation against available stock
    if (requestedQty > asset.availableQuantity) {
      req.flash(
        'error',
        `Not enough equipment available. Only ${asset.availableQuantity} unit(s) currently in stock.`
      );
      return res.redirect(`/requester/request/${assetId}`);
    }

    // Validate return date is not in the past
    const returnDate = new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (returnDate < today) {
      req.flash('error', 'Expected return date cannot be in the past.');
      return res.redirect(`/requester/request/${assetId}`);
    }

    // Create the request with initial status 'Pending'
    const newRequest = new Request({
      requester: userId,
      asset: asset._id,
      quantity: requestedQty,
      purpose: purpose.trim(),
      expectedReturnDate: returnDate,
      status: 'Pending'
    });

    await newRequest.save();
    req.flash('success', 'Your request has been submitted successfully and is awaiting Lab In-charge review.');
    res.redirect('/requester/requests');
  } catch (err) {
    console.error('Submit Request Error:', err);
    req.flash('error', 'Failed to submit request.');
    res.redirect('/requester/equipment');
  }
});

// GET /requester/requests: View all personal requests & statuses
router.get('/requests', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const requests = await Request.find({ requester: userId })
      .populate('asset')
      .sort({ createdAt: -1 });

    res.render('requester/requests', {
      title: 'My Equipment Requests',
      requests
    });
  } catch (err) {
    console.error('Requests List Error:', err);
    req.flash('error', 'Unable to retrieve requests.');
    res.redirect('/requester/dashboard');
  }
});

module.exports = router;
