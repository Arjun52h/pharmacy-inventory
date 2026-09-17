const Batch = require("../models/Batch");

// Simulates one daily pharmacy automation cycle
const runDailyAutomation = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Quarantine expired batches
    const quarantineResult = await Batch.updateMany(
      {
        expiryDate: { $lt: today },
        quarantined: false,
      },
      {
        $set: {
          quarantined: true,
          flagged: false,
        },
      }
    );

    // 2. Calculate 7-day alert window
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // 3. Flag batches expiring within 7 days
    const flagResult = await Batch.updateMany(
      {
        expiryDate: {
          $gte: today,
          $lte: sevenDaysLater,
        },
        quantity: { $gt: 0 },
        quarantined: false,
      },
      {
        $set: {
          flagged: true,
        },
      }
    );

    res.json({
      success: true,
      message: "Daily automation completed",
      flagged: flagResult.modifiedCount,
      quarantined: quarantineResult.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Daily automation failed",
      error: error.message,
    });
  }
};

module.exports = {
  runDailyAutomation,
};