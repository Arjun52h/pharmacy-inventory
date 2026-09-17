const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const batchRoutes = require("./routes/batchRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/batches", batchRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Pharmacy Inventory API is running",
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Database + Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);
  });