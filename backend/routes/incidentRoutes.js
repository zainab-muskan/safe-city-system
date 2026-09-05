const express = require("express");
const router = express.Router();
const {
  createIncident,
  processAiDetection,
  createPublicReport,
  createManualAlert,
  updatePlate,
  getIncidents,
  getIncidentsByCheckpoint,
  getIncidentById,
  reviewIncident,
  resolveIncident,
} = require("../controllers/incidentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// AI processing route
router.post("/ai-detect", protect, authorize("super_admin", "operator"), processAiDetection);

// Public reporting route (no auth required)
router.post("/public-report", createPublicReport);

// Checkpoint Officer manual alert route
router.post("/manual-alert", protect, authorize("super_admin", "checkpoint_officer"), createManualAlert);

// Created by the detection pipeline (Node backend, after calling FastAPI +
// validating against the registry) — Operator/Admin also covers manual entry
router.post("/", protect, authorize("super_admin", "operator"), createIncident);

// Operator dashboard: live feed of all incidents, filterable by status
router.get("/", protect, authorize("super_admin", "operator"), getIncidents);

// Checkpoint Officer's mobile view: only alerts routed to their post
router.get(
  "/checkpoint/:checkpointId",
  protect,
  authorize("super_admin", "operator", "checkpoint_officer"),
  getIncidentsByCheckpoint
);

router.get(
  "/:id",
  protect,
  authorize("super_admin", "operator", "checkpoint_officer"),
  getIncidentById
);

// Operator updates plate text before dispatching
router.patch(
  "/:id/plate",
  protect,
  authorize("super_admin", "operator"),
  updatePlate
);

// Operator confirms or dismisses an alert — triggers automated routing
router.patch(
  "/:id/review",
  protect,
  authorize("super_admin", "operator"),
  reviewIncident
);

// Checkpoint Officer marks resolved after physical intercept
router.patch(
  "/:id/resolve",
  protect,
  authorize("super_admin", "checkpoint_officer"),
  resolveIncident
);

module.exports = router;
