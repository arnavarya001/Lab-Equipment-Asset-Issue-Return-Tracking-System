const mongoose = require('mongoose');

// Asset Schema defines institutional lab equipment
const assetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    required: [true, 'Asset Tag is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Asset Name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Lab/Location is required'],
    trim: true
  },
  condition: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost'],
    default: 'OK'
  },
  quantity: {
    type: Number,
    required: [true, 'Total Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: [0, 'Available quantity cannot be negative']
  },
  // Optional stretch goal: Maintenance logs per asset
  maintenanceLogs: [
    {
      serviceDate: { type: Date, default: Date.now },
      cost: { type: Number, default: 0 },
      nextServiceDue: { type: Date },
      notes: { type: String, default: '' }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Asset', assetSchema);
