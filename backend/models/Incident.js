const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    // What the AI actually saw at the camera
    detectedPlateText: { type: String, required: true },
    detectedModel: { type: String }, // from YOLOv8
    detectedColor: { type: String },
    detectedShape: { type: String },
    snapshotUrl: { type: String }, // captured frame for operator review

    // Where it happened
    camera: { type: mongoose.Schema.Types.ObjectId, ref: "Camera", required: false },
    detectedAt: { type: Date, default: Date.now },

    // Citizen Report info
    citizenReportDetails: {
      reporterName: { type: String },
      reporterCnic: { type: String },
      locationDetails: { type: String },
      coordinates: { type: [Number] }, // [lng, lat]
      description: { type: String },
    },

    // What the registry says (nullable if plate isn't even in the system)
    matchedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegisteredVehicle",
      default: null,
    },

    // The three threat categories from your architecture doc
    threatType: {
      type: String,
      enum: ["unregistered_plate", "plate_vehicle_mismatch", "stolen_flag", "citizen_report", "manual_officer_alert"],
      required: true,
    },

    // Incident lifecycle
    status: {
      type: String,
      enum: ["pending_review", "confirmed", "false_positive", "dispatched", "resolved"],
      default: "pending_review",
    },

    // Audit trail: who reviewed/actioned it
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    routedToCheckpoint: { type: mongoose.Schema.Types.ObjectId, ref: "Checkpoint", default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);
