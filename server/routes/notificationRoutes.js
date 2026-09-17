const express = require("express");
const { getOutbox } = require("../services/notificationService");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    count: getOutbox().length,
    data: getOutbox(),
  });
});

module.exports = router;