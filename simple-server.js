var express = require("express");
var app = express();
var PORT = process.env.PORT || 10000;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get("/api/health", function (_req, res) {
  res.json({
    status: "OK",
    message: "ArchTrack Server is running",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Root endpoint
app.get("/", function (_req, res) {
  res.json({
    message: "ArchTrack API Server",
    status: "running",
    endpoints: {
      health: "/api/health",
    },
  });
});

// Start server
app.listen(PORT, "0.0.0.0", function () {
  console.log("ArchTrack Server running on port " + PORT);
  console.log("Health Check: http://localhost:" + PORT + "/api/health");
});
