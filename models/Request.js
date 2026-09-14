const mongoose = require('mongoose');

// Request Schema tracks the full issue-return lifecycle for equipment
const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Requested quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Issued', 'Returned'],
    default: 'Pending'
  },
  issuedAt: {
    type: Date
  },
  returnedAt: {
    type: Date
  },
  returnCondition: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost']
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field to dynamically check if the issued equipment is overdue
requestSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Issued' && this.expectedReturnDate) {
    return new Date() > new Date(this.expectedReturnDate);
  }
  return false;
});

// Configure schema to include virtuals when converting documents to JSON or Objects
requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Request', requestSchema);
