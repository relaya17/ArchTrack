// Simple server starter to test basic functionality
const express = require("express");
const app = express();
const PORT = process.env.PORT || 6453;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ArchTrack Server is running",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "ArchTrack API Server",
    status: "running",
    endpoints: {
      health: "/api/health",
    },
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ArchTrack Server running on port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
