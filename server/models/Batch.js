const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },

    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // T2 Automation
    flagged: {
      type: Boolean,
      default: false,
    },

    quarantined: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ medicineName: 1, expiryDate: 1 });

module.exports = mongoose.model("Batch", batchSchema);