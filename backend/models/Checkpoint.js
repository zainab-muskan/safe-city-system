const mongoose = require("mongoose");

const checkpointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Saddar Checkpoint"
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    assignedOfficers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Enables geospatial queries later (e.g. "nearest checkpoint")
checkpointSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Checkpoint", checkpointSchema);
