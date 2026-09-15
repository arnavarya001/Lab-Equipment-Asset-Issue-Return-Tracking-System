const mongoose = require("mongoose");

// asset schema for lab equipment
const assetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    default: "OK"
  },
  quantity: {
    type: Number,
    required: true
  },
  availableQuantity: {
    type: Number,
    required: true
  },
  // maintenance logs stretch feature
  maintenanceLogs: [
    {
      serviceDate: {
        type: Date,
        default: Date.now
      },
      cost: {
        type: Number,
        default: 0
      },
      nextServiceDue: {
        type: Date
      },
      notes: {
        type: String,
        default: ""
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Asset", assetSchema);
