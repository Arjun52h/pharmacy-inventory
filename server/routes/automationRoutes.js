const express = require("express");
const { runDailyAutomation } = require("../controllers/automationController");

const router = express.Router();

router.post("/", runDailyAutomation);

module.exports = router;