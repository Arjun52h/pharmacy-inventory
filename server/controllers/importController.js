const Batch = require("../models/Batch");

// Convert quantities like:
// 10
// "10"
// "10 units"
// "10 Units"
const parseQuantity = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const match = String(value).match(/\d+(\.\d+)?/);

  if (!match) {
    return null;
  }

  const quantity = Number(match[0]);

  return quantity > 0 ? quantity : null;
};

// Convert:
// DD/MM/YYYY
// YYYY-MM-DD
// ISO date
const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const stringValue = String(value).trim();

  // DD/MM/YYYY
  const ddmmyyyy = stringValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    // Validate impossible dates
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  // ISO / normal JavaScript date
  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const importBatches = async (req, res) => {
  try {
    const input = req.body;

    if (!Array.isArray(input)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of batches",
      });
    }

    let imported = 0;
    let deduped = 0;
    let rejected = 0;

    const seen = new Set();
    const validBatches = [];

    for (const item of input) {
      // Required fields
      if (
        !item ||
        !item.medicineName ||
        !item.batchNumber ||
        !item.expiryDate ||
        item.quantity === null ||
        item.quantity === undefined
      ) {
        rejected++;
        continue;
      }

      const medicineName = String(item.medicineName).trim();
      const batchNumber = String(item.batchNumber).trim();
      const expiryDate = parseDate(item.expiryDate);
      const quantity = parseQuantity(item.quantity);

      if (
        !medicineName ||
        !batchNumber ||
        !expiryDate ||
        quantity === null
      ) {
        rejected++;
        continue;
      }

      // Same medicine + batch + expiry is treated as duplicate.
      const duplicateKey = [
        medicineName.toLowerCase(),
        batchNumber.toLowerCase(),
        expiryDate.toISOString().split("T")[0],
      ].join("|");

      if (seen.has(duplicateKey)) {
        deduped++;
        continue;
      }

      seen.add(duplicateKey);

      validBatches.push({
        medicineName,
        batchNumber,
        expiryDate,
        quantity,
      });
    }

    // Check duplicates against existing database records
    const batchesToInsert = [];

    for (const batch of validBatches) {
      const existingBatch = await Batch.findOne({
        batchNumber: batch.batchNumber,
      });

      if (existingBatch) {
        deduped++;
        continue;
      }

      batchesToInsert.push(batch);
    }

    if (batchesToInsert.length > 0) {
      await Batch.insertMany(batchesToInsert);
      imported = batchesToInsert.length;
    }

    res.status(201).json({
      success: true,
      message: "Batch import completed",
      imported,
      deduped,
      rejected,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Batch import failed",
      error: error.message,
    });
  }
};

module.exports = {
  importBatches,
};