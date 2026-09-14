const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const { isLoggedIn, isLabIncharge } = require('../middleware/auth');

// Protect all Lab In-charge routes
router.use(isLoggedIn, isLabIncharge);

// GET /lab-incharge/dashboard: Overview of pending requests, active checkouts, and overdue items
router.get('/dashboard', async (req, res) => {
  try {
    const allRequests = await Request.find().populate('asset').populate('requester').sort({ createdAt: -1 });

    const pendingRequests = allRequests.filter((r) => r.status === 'Pending');
    const approvedRequests = allRequests.filter((r) => r.status === 'Approved');
    const issuedRequests = allRequests.filter((r) => r.status === 'Issued');
    const returnedRequests = allRequests.filter((r) => r.status === 'Returned');

    const now = new Date();
    const overdueRequests = issuedRequests.filter(
      (r) => r.expectedReturnDate && new Date(r.expectedReturnDate) < now
    );

    const stats = {
      pendingCount: pendingRequests.length,
      approvedCount: approvedRequests.length,
      issuedCount: issuedRequests.length,
      returnedCount: returnedRequests.length,
      overdueCount: overdueRequests.length
    };

    res.render('labIncharge/dashboard', {
      title: 'Lab In-charge Dashboard',
      stats,
      pendingRequests: pendingRequests.slice(0, 5),
      overdueRequests
    });
  } catch (err) {
    console.error('Lab In-charge Dashboard Error:', err);
    req.flash('error', 'Unable to load dashboard.');
    res.redirect('/');
  }
});

// GET /lab-incharge/requests: View all requests queue
router.get('/requests', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const requests = await Request.find(filter)
      .populate('asset')
      .populate('requester')
      .sort({ createdAt: -1 });

    res.render('labIncharge/requests', {
      title: 'Manage Equipment Requests',
      requests,
      currentFilter: req.query.status || 'All'
    });
  } catch (err) {
    console.error('Requests Queue Error:', err);
    req.flash('error', 'Unable to load requests.');
    res.redirect('/lab-incharge/dashboard');
  }
});

// POST /lab-incharge/request/:id/approve: Approve a pending request
router.post('/request/:id/approve', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab-incharge/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', `Cannot approve a request that is currently "${request.status}".`);
      return res.redirect('/lab-incharge/requests');
    }

    request.status = 'Approved';
    await request.save();

    req.flash('success', 'Request approved. Equipment is ready to be physically handed over and issued.');
    res.redirect('/lab-incharge/requests');
  } catch (err) {
    console.error('Approve Request Error:', err);
    req.flash('error', 'Failed to approve request.');
    res.redirect('/lab-incharge/requests');
  }
});

// POST /lab-incharge/request/:id/reject: Reject a pending request
router.post('/request/:id/reject', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab-incharge/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', `Cannot reject a request that is currently "${request.status}".`);
      return res.redirect('/lab-incharge/requests');
    }

    const { remarks } = req.body;
    request.status = 'Rejected';
    if (remarks) request.remarks = remarks.trim();

    await request.save();

    req.flash('success', 'Request has been rejected.');
    res.redirect('/lab-incharge/requests');
  } catch (err) {
    console.error('Reject Request Error:', err);
    req.flash('error', 'Failed to reject request.');
    res.redirect('/lab-incharge/requests');
  }
});

// POST /lab-incharge/request/:id/issue: Record actual equipment issue
router.post('/request/:id/issue', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('asset');
    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab-incharge/requests');
    }

    if (request.status !== 'Approved') {
      req.flash('error', 'Only approved requests can be issued.');
      return res.redirect('/lab-incharge/requests');
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      req.flash('error', 'Associated asset no longer exists.');
      return res.redirect('/lab-incharge/requests');
    }

    // MANDATORY REQUIREMENT: Strict check before issue
    if (request.quantity > asset.availableQuantity) {
      req.flash(
        'error',
        `Not enough equipment available. Requested: ${request.quantity}, Available: ${asset.availableQuantity}.`
      );
      return res.redirect('/lab-incharge/requests');
    }

    // Business Logic: decrease availableQuantity
    asset.availableQuantity -= request.quantity;
    await asset.save();

    // Update Request
    request.status = 'Issued';
    request.issuedAt = new Date();
    await request.save();

    req.flash(
      'success',
      `Equipment successfully issued. Available inventory for ${asset.name} updated to ${asset.availableQuantity}.`
    );
    res.redirect('/lab-incharge/returns');
  } catch (err) {
    console.error('Issue Equipment Error:', err);
    req.flash('error', 'Failed to issue equipment.');
    res.redirect('/lab-incharge/requests');
  }
});

// GET /lab-incharge/returns: View all currently issued equipment awaiting return
router.get('/returns', async (req, res) => {
  try {
    const issuedRequests = await Request.find({ status: 'Issued' })
      .populate('asset')
      .populate('requester')
      .sort({ expectedReturnDate: 1 });

    res.render('labIncharge/returns', {
      title: 'Active Issues & Returns',
      issuedRequests
    });
  } catch (err) {
    console.error('Returns Page Error:', err);
    req.flash('error', 'Unable to load active issues.');
    res.redirect('/lab-incharge/dashboard');
  }
});

// POST /lab-incharge/request/:id/return: Record return & update condition
router.post('/request/:id/return', async (req, res) => {
  try {
    const { returnCondition, remarks } = req.body;
    const request = await Request.findById(req.params.id).populate('asset');

    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab-incharge/returns');
    }

    if (request.status !== 'Issued') {
      req.flash('error', 'Only currently issued items can be marked as returned.');
      return res.redirect('/lab-incharge/returns');
    }

    if (!returnCondition || !['OK', 'Damaged', 'Lost'].includes(returnCondition)) {
      req.flash('error', 'Please select a valid return condition (OK, Damaged, or Lost).');
      return res.redirect('/lab-incharge/returns');
    }

    const asset = await Asset.findById(request.asset._id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/lab-incharge/returns');
    }

    // Update Request details
    request.status = 'Returned';
    request.returnedAt = new Date();
    request.returnCondition = returnCondition;
    if (remarks) request.remarks = remarks.trim();
    await request.save();

    // BUSINESS LOGIC FOR RETURN CONDITIONS
    if (returnCondition === 'OK') {
      // Usable: Add back to availableQuantity, never exceed total quantity
      asset.availableQuantity = Math.min(asset.quantity, asset.availableQuantity + request.quantity);
    } else if (returnCondition === 'Damaged') {
      // Damaged: Units are NOT usable, so do NOT increase available stock
      // Flag asset condition if appropriate
      asset.condition = 'Damaged';
    } else if (returnCondition === 'Lost') {
      // Lost: Units are permanently gone. Decrease total quantity, do not increase available
      asset.quantity = Math.max(0, asset.quantity - request.quantity);
      asset.condition = 'Lost';
    }

    await asset.save();

    req.flash(
      'success',
      `Return recorded successfully with condition "${returnCondition}". Asset inventory updated.`
    );
    res.redirect('/lab-incharge/returns');
  } catch (err) {
    console.error('Return Processing Error:', err);
    req.flash('error', 'Failed to process return.');
    res.redirect('/lab-incharge/returns');
  }
});

module.exports = router;
