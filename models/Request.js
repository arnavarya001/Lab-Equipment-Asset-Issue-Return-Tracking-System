const mongoose = require("mongoose");

// request schema to track issue and return of equipment
const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: "Pending"
  },
  issuedAt: {
    type: Date
  },
  returnedAt: {
    type: Date
  },
  returnCondition: {
    type: String
  },
  remarks: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// virtual field to check if equipment is overdue
requestSchema.virtual("isOverdue").get(function () {
  if (this.status === "Issued" && this.expectedReturnDate) {
    return new Date() > new Date(this.expectedReturnDate);
  }
  return false;
});

requestSchema.set("toObject", { virtuals: true });
requestSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Request", requestSchema);
