import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client build
const clientBuildPath = path.join(__dirname, "../apps/client/build");
console.log("Looking for client build at:", clientBuildPath);

// Check if build exists
import fs from "fs";
if (fs.existsSync(clientBuildPath)) {
  console.log("✅ Serving static files from:", clientBuildPath);
  app.use(express.static(clientBuildPath));
} else {
  console.log("⚠️  Client build not found, serving API only");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ArchTrack Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    frontend: fs.existsSync(clientBuildPath) ? "available" : "not_built",
    version: "1.0.0"
  });
});

// API Routes placeholder
app.get("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    timestamp: new Date().toISOString(),
    availableEndpoints: ["/api/health"]
  });
});

// Serve React app for all other routes
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
      endpoints: {
        health: "/api/health"
      }
    });
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/archtrack";

function startServer(): void {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 ArchTrack Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
  });
}

// Handle MongoDB connection with graceful fallback
if (MONGODB_URI.includes("<username>") || MONGODB_URI.includes("<password>")) {
  console.log("⚠️  MongoDB URI contains placeholders - starting without database");
  startServer();
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log("✅ MongoDB connected successfully");
      startServer();
    })
    .catch((err: Error) => {
      console.error("❌ MongoDB connection failed:", err.message);
      console.log("🔄 Starting server without database...");
      startServer();
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});
