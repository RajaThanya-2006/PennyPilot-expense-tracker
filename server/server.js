
require("node:dns/promises").setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const transactionRoutes = require("./routes/transactions");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "PennyPilot API is running",
    status: "success"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

app.use("/api/transactions", transactionRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error"
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`PennyPilot API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
