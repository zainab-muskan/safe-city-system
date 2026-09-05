const Incident = require("../models/Incident");
const Checkpoint = require("../models/Checkpoint");

// @desc  Create a new incident (called by the detection pipeline once FastAPI
//        returns AI results and Node validates against the registry — see
//        note in incidentRoutes.js about where this fits in the pipeline)
// @route POST /api/incidents
// @access Super Admin, Operator (system-triggered creation will use a
//         service-level account with one of these roles)
exports.createIncident = async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const RegisteredVehicle = require("../models/RegisteredVehicle");

// @desc  Process a raw AI detection from the Python FastAPI core
// @route POST /api/incidents/ai-detect
// @access Operator, Super Admin (used by AI service account)
exports.processAiDetection = async (req, res) => {
  try {
    const { detectedPlateText, detectedModel, detectedColor, cameraId, snapshotB64 } = req.body;

    if (!detectedPlateText || !cameraId) {
      return res.status(400).json({ message: "Plate text and camera ID are required." });
    }

    // 1. Normalize AI text: strip hyphens, spaces, special chars
    const normalizedPlate = detectedPlateText.replace(/[^A-Z0-9]/gi, "").toUpperCase();

    // 2. Cross-reference with registry using the normalized field
    const vehicle = await RegisteredVehicle.findOne({ plateNumberNormalized: normalizedPlate });

    let threatType = null;
    let status = "pending_review";

    if (!vehicle) {
      threatType = "unregistered_plate";
    } else if (vehicle.legalStatus === "stolen") {
      threatType = "stolen_flag";
    } else if (
      vehicle.model.toLowerCase() !== (detectedModel || "").toLowerCase() &&
      detectedModel !== "Unknown"
    ) {
      threatType = "plate_vehicle_mismatch";
    }

    // 2. If no threat found, we just return (or log it elsewhere)
    if (!threatType) {
      return res.status(200).json({ message: "Vehicle clear, no incident created." });
    }

    // 3. Anti-Spam / Debounce Logic
    // Prevent the system from creating hundreds of alerts for the same car sitting at a red light.
    // We check if an alert for this exact plate at this camera was created in the last 5 minutes, 
    // OR if there is an active unresolved alert.
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingIncident = await Incident.findOne({
      detectedPlateText,
      camera: cameraId,
      $or: [
        { status: { $in: ["pending_review", "confirmed", "dispatched"] } },
        { createdAt: { $gte: fiveMinsAgo } }
      ]
    });

    if (existingIncident) {
      // Update the "last seen" time so we know the car is still there, but don't create a duplicate
      existingIncident.detectedAt = new Date();
      await existingIncident.save();
      return res.status(200).json({ 
        message: "Duplicate threat detected. Ignored to prevent spam.", 
        incident: existingIncident 
      });
    }

    let snapshotUrl = null;
    
    // Save the image to disk only if it's a threat
    if (snapshotB64) {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(__dirname, '../uploads/snapshots');
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }
      const filename = `snapshot_${Date.now()}.jpg`;
      fs.writeFileSync(path.join(dir, filename), Buffer.from(snapshotB64, 'base64'));
      snapshotUrl = `/uploads/snapshots/${filename}`;
    }

    // 3. Create incident for Operator review
    const incident = await Incident.create({
      detectedPlateText,
      detectedModel: detectedModel || "Unknown",
      detectedColor: detectedColor || "Unknown",
      camera: cameraId,
      matchedVehicle: vehicle ? vehicle._id : null,
      threatType,
      status,
      snapshotUrl,
    });

    res.status(201).json({ message: "Threat detected and incident created", incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a citizen report from the public portal
// @route POST /api/incidents/public-report
// @access Public
exports.createPublicReport = async (req, res) => {
  try {
    const { plateText, vehicleModel, vehicleColor, locationDetails, coordinates, description, reporterName, reporterCnic, snapshotB64 } = req.body;
    
    let snapshotUrl = null;
    
    // Save the image to disk if provided
    if (snapshotB64) {
      const fs = require("fs");
      const path = require("path");
      const base64Data = snapshotB64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileName = `citizen_${Date.now()}.jpg`;
      const uploadDir = path.join(__dirname, "../uploads/snapshots");
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      snapshotUrl = `/uploads/snapshots/${fileName}`;
    }

    const incident = await Incident.create({
      threatType: "citizen_report",
      detectedPlateText: plateText || "UNKNOWN",
      detectedModel: vehicleModel || "Unknown",
      detectedColor: vehicleColor || "Unknown",
      status: "pending_review",
      snapshotUrl,
      citizenReportDetails: {
        reporterName,
        reporterCnic,
        locationDetails,
        coordinates, // [lng, lat]
        description,
      },
    });

    res.status(201).json({ message: "Report submitted successfully", incident });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Checkpoint Officer manually creates an alert
// @route POST /api/incidents/manual-alert
// @access Checkpoint Officer
exports.createManualAlert = async (req, res) => {
  try {
    const { plateText, threatType, notes } = req.body;

    const incident = await Incident.create({
      threatType: threatType || "manual_officer_alert",
      detectedPlateText: plateText || "UNKNOWN",
      status: "pending_review",
      resolutionNotes: notes,
    });

    res.status(201).json({ message: "Manual alert created", incident });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Operator corrects the OCR plate text
// @route PATCH /api/incidents/:id/plate
// @access Operator, Super Admin
exports.updatePlate = async (req, res) => {
  try {
    const { correctedPlateText } = req.body;
    if (!correctedPlateText) {
      return res.status(400).json({ message: "correctedPlateText is required" });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    incident.detectedPlateText = correctedPlateText;
    const normalizedPlate = correctedPlateText.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    
    // Re-check the registry with the new plate
    const vehicle = await RegisteredVehicle.findOne({ plateNumberNormalized: normalizedPlate });
    
    if (vehicle) {
      incident.matchedVehicle = vehicle._id;
      if (vehicle.legalStatus === "stolen") {
        incident.threatType = "stolen_flag";
      } else {
        // If it's a valid vehicle, the threat might just be a mismatch or clear.
        // We'll leave threatType alone or set it to mismatch if model differs.
        incident.threatType = "plate_vehicle_mismatch"; 
      }
    } else {
      incident.matchedVehicle = null;
      incident.threatType = "unregistered_plate";
    }

    await incident.save();
    res.status(200).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Get all incidents, most recent first. Supports ?status= filtering
//        for the Operator dashboard's live feed.
// @route GET /api/incidents?status=pending_review
// @access Super Admin, Operator
exports.getIncidents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const incidents = await Incident.find(filter)
      .populate("camera", "name direction")
      .populate("matchedVehicle", "plateNumber model color legalStatus ownerName ownerCNIC ownerContact")
      .populate("routedToCheckpoint", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get incidents routed to a specific checkpoint (for the Checkpoint
//        Officer's mobile view — they only see alerts relevant to their post)
// @route GET /api/incidents/checkpoint/:checkpointId
// @access Checkpoint Officer, Operator, Super Admin
exports.getIncidentsByCheckpoint = async (req, res) => {
  try {
    const incidents = await Incident.find({
      routedToCheckpoint: req.params.checkpointId,
      status: { $in: ["dispatched", "resolved"] },
    })
      .populate("camera", "name direction")
      .populate("matchedVehicle", "plateNumber model color legalStatus ownerName ownerCNIC ownerContact")
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single incident with full detail (used for the operator's
//        side-by-side verification card)
// @route GET /api/incidents/:id
// @access Super Admin, Operator, Checkpoint Officer
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("camera")
      .populate("matchedVehicle")
      .populate("reviewedBy", "name role")
      .populate("routedToCheckpoint")
      .populate("resolvedBy", "name role");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }
    res.status(200).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Operator reviews an incident: confirm as real threat, or mark false positive.
//        On confirmation, this is also where the spatial routing happens —
//        the incident gets auto-assigned to its camera's linked checkpoint.
//        Operator can also correct the plate text before dispatching.
// @route PATCH /api/incidents/:id/review
// @access Operator, Super Admin
exports.reviewIncident = async (req, res) => {
  try {
    const { decision, correctedPlateText } = req.body;

    if (!["confirmed", "false_positive"].includes(decision)) {
      return res.status(400).json({
        message: "decision must be 'confirmed' or 'false_positive'",
      });
    }

    const incident = await Incident.findById(req.params.id).populate("camera");
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    incident.reviewedBy = req.user._id;

    // If the Operator corrected the plate text, update it and re-check registry
    if (correctedPlateText && correctedPlateText !== incident.detectedPlateText) {
      incident.detectedPlateText = correctedPlateText;

      const normalizedPlate = correctedPlateText.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      const vehicle = await RegisteredVehicle.findOne({ plateNumberNormalized: normalizedPlate });

      if (vehicle) {
        incident.matchedVehicle = vehicle._id;
        if (vehicle.legalStatus === "stolen") {
          incident.threatType = "stolen_flag";
        }
      } else {
        incident.matchedVehicle = null;
        incident.threatType = "unregistered_plate";
      }
    }

    if (decision === "false_positive") {
      incident.status = "false_positive";
      await incident.save();
      return res.status(200).json(incident);
    }

    // Confirmed: route to the camera's linked checkpoint automatically
    let checkpointId = req.body.checkpointId;

    if (!checkpointId) {
      if (!incident.camera || !incident.camera.linkedCheckpoint) {
        return res.status(400).json({
          message: "No camera linked checkpoint found. Please select a checkpoint manually.",
        });
      }
      checkpointId = incident.camera.linkedCheckpoint;
    }

    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint) {
      return res.status(400).json({
        message: "Invalid checkpoint specified — cannot route alert",
      });
    }

    incident.status = "dispatched";
    incident.routedToCheckpoint = checkpoint._id;
    await incident.save();

    res.status(200).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Checkpoint Officer marks an incident resolved after physically
//        intercepting and verifying the vehicle
// @route PATCH /api/incidents/:id/resolve
// @access Checkpoint Officer, Super Admin
exports.resolveIncident = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (incident.status !== "dispatched") {
      return res.status(400).json({
        message: `Cannot resolve an incident with status '${incident.status}'`,
      });
    }

    incident.status = "resolved";
    incident.resolvedBy = req.user._id;
    incident.resolutionNotes = resolutionNotes || "";
    await incident.save();

    res.status(200).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
