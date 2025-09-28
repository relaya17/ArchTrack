const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ArchTrack Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Catch-all route
app.get("*", (req, res) => {
  res.json({
    status: "running",
    url: req.url,
    timestamp: new Date().toISOString(),
  });
});

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/archtrack";

if (MONGODB_URI.includes("<username>")) {
  console.log("Warning: MongoDB URI contains placeholder values");
  // Use local fallback
  mongoose
    .connect("mongodb://localhost:27017/archtrack")
    .then(() => {
      console.log("MongoDB connected (local fallback)");
      startServer();
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err);
      console.log("Starting server without database...");
      startServer();
    });
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
      startServer();
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err);
      console.log("Starting server without database...");
      startServer();
    });
}

function startServer() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Environment:", process.env.NODE_ENV || "development");
  });
}
