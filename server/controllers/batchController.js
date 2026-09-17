const Batch = require("../models/Batch");
const {
  createReorderAlert,
} = require("../services/notificationService");

// Add a new batch
const createBatch = async (req, res) => {
  try {
    const { medicineName, batchNumber, expiryDate, quantity } = req.body;

    if (!medicineName || !batchNumber || !expiryDate || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const existingBatch = await Batch.findOne({ batchNumber });

    if (existingBatch) {
      return res.status(409).json({
        success: false,
        message: "Batch number already exists",
      });
    }

    const batch = await Batch.create({
      medicineName,
      batchNumber,
      expiryDate,
      quantity,
    });

    res.status(201).json({
      success: true,
      message: "Batch added successfully",
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message,
    });
  }
};


// Get all batches
const getBatches = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.medicineName = {
        $regex: search,
        $options: "i",
      };
    }

    const batches = await Batch.find(filter).sort({
      expiryDate: 1,
    });

    res.json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
      error: error.message,
    });
  }
};


// Get batches for one medicine
const getMedicineBatches = async (req, res) => {
  try {
    const { name } = req.params;

    const batches = await Batch.find({
      medicineName: {
        $regex: `^${name}$`,
        $options: "i",
      },
    }).sort({
      expiryDate: 1,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sellableStock = batches
      .filter((batch) => new Date(batch.expiryDate) >= today)
      .reduce((total, batch) => total + batch.quantity, 0);

    res.json({
      success: true,
      medicineName: name,
      sellableStock,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine batches",
      error: error.message,
    });
  }
};


// Get expiring batches
const getExpiringBatches = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    const batches = await Batch.find({
      expiryDate: {
        $gte: today,
        $lte: futureDate,
      },
      quantity: {
        $gt: 0,
      },
    }).sort({
      expiryDate: 1,
    });

    res.json({
      success: true,
      days,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring batches",
      error: error.message,
    });
  }
};


// FEFO DISPENSING
const dispenseMedicine = async (req, res) => {
  try {
    const { medicineName, quantity } = req.body;

    const requestedQuantity = Number(quantity);

    if (!medicineName || !requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Medicine name and valid quantity are required",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only IN-DATE batches with available stock
    // sorted by earliest expiry first.
    const batches = await Batch.find({
      medicineName: {
        $regex: `^${medicineName}$`,
        $options: "i",
      },
      expiryDate: {
        $gte: today,
      },
      quantity: {
        $gt: 0,
      },
    }).sort({
      expiryDate: 1,
    });

    const availableStock = batches.reduce(
      (total, batch) => total + batch.quantity,
      0
    );

    // IMPORTANT:
    // Do not partially dispense if there isn't enough
    // sellable stock.
    if (availableStock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient in-date stock",
        requested: requestedQuantity,
        available: availableStock,
      });
    }

    let remaining = requestedQuantity;
    const dispensedFrom = [];

    // FEFO:
    // batches are already sorted by expiryDate ASC.
    for (const batch of batches) {
      if (remaining <= 0) break;

      const quantityTaken = Math.min(batch.quantity, remaining);

      batch.quantity -= quantityTaken;

      await batch.save();

      remaining -= quantityTaken;

      dispensedFrom.push({
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: quantityTaken,
      });
    }

    // Check remaining in-date stock after dispensing
const remainingBatches = await Batch.find({
  medicineName: {
    $regex: `^${medicineName}$`,
    $options: "i",
  },
  expiryDate: {
    $gte: today,
  },
  quantity: {
    $gt: 0,
  },
});

const remainingStock = remainingBatches.reduce(
  (total, batch) => total + batch.quantity,
  0
);

const REORDER_THRESHOLD = 10;

if (remainingStock < REORDER_THRESHOLD) {
  createReorderAlert({
    medicineName,
    currentStock: remainingStock,
    threshold: REORDER_THRESHOLD,
  });
}

    res.json({
      success: true,
      message: "Medicine dispensed successfully using FEFO",
      medicineName,
      requested: requestedQuantity,
      dispensed: requestedQuantity,
      dispensedFrom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to dispense medicine",
      error: error.message,
    });
  }
};

// Get medicine-level sellable stock
const getMedicineStock = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batches = await Batch.find({
      expiryDate: {
        $gte: today,
      },
      quantity: {
        $gt: 0,
      },
    }).sort({
      medicineName: 1,
      expiryDate: 1,
    });

    const medicineMap = {};

    batches.forEach((batch) => {
      const key = batch.medicineName.toLowerCase();

      if (!medicineMap[key]) {
        medicineMap[key] = {
          medicineName: batch.medicineName,
          sellableStock: 0,
          batches: 0,
        };
      }

      medicineMap[key].sellableStock += batch.quantity;
      medicineMap[key].batches += 1;
    });

    res.json({
      success: true,
      count: Object.keys(medicineMap).length,
      data: Object.values(medicineMap),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine stock",
      error: error.message,
    });
  }
};
module.exports = {
  createBatch,
  getBatches,
  getMedicineBatches,
  getExpiringBatches,
  dispenseMedicine,
  getMedicineStock,
};