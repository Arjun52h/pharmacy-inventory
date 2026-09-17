const express = require("express");

const {
  createBatch,
  getBatches,
  getMedicineBatches,
  getExpiringBatches,
  dispenseMedicine,
  getMedicineStock,
} = require("../controllers/batchController");

const router = express.Router();

router.post("/", createBatch);

router.get("/", getBatches);

router.get("/expiring", getExpiringBatches);

router.get("/stock/summary", getMedicineStock);

router.get("/medicine/:name", getMedicineBatches);

router.post("/dispense", dispenseMedicine);

module.exports = router;