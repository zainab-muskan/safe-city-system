require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const path = require("path");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.send("Safe City backend is running.");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/incidents", require("./routes/incidentRoutes"));
app.use("/api/cameras", require("./routes/cameraRoutes"));
app.use("/api/checkpoints", require("./routes/checkpointRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
