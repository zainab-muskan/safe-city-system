const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "6th Road Camera"
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    direction: { type: String, required: true }, // e.g. "Towards Saddar"
    // Which checkpoint this camera feeds alerts to (spatial mapping from your architecture doc)
    linkedCheckpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkpoint",
      required: true,
    },
    streamUrl: { type: String }, // RTSP/HTTP feed URL, if applicable
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Camera", cameraSchema);
