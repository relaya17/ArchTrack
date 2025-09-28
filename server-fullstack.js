const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve React build (if exists)
const clientBuildPath = path.join(__dirname, "apps/client/out");
console.log("Looking for client build at:", clientBuildPath);

// Check if build exists
const fs = require("fs");
if (fs.existsSync(clientBuildPath)) {
  console.log("Serving static files from:", clientBuildPath);
  app.use(express.static(clientBuildPath));
} else {
  console.log("Client build not found, serving API only");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ArchTrack Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    frontend: fs.existsSync(clientBuildPath) ? "available" : "not_built",
  });
});

// API catch-all for non-existent routes
app.get("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Serve React app for all other routes (if build exists)
app.get("*", (req, res) => {
  if (fs.existsSync(clientBuildPath)) {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  } else {
    res.json({
      message: "ArchTrack API Server",
      status: "running",
      note: "Frontend not built - API only mode",
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  }
});

// MongoDB Connection with fallback
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/archtrack";

function startServer() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ArchTrack Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(
      `🗄️  Database: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`,
    );
  });
}

// Handle MongoDB connection
if (MONGODB_URI.includes("<username>") || MONGODB_URI.includes("<password>")) {
  console.log(
    "⚠️  MongoDB URI contains placeholders - starting without database",
  );
  startServer();
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ MongoDB connected");
      startServer();
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
      console.log("🔄 Starting server without database...");
      startServer();
    });
}
