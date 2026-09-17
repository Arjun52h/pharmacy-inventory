const express = require("express");
const { importBatches } = require("../controllers/importController");

const router = express.Router();

router.post("/", importBatches);

module.exports = router;