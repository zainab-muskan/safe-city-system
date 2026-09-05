const mongoose = require("mongoose");

const registeredVehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true }, // e.g. "ABC-123"
    plateNumberNormalized: { type: String, unique: true }, // e.g. "ABC123" (auto-generated)
    model: { type: String, required: true }, // e.g. "Toyota Corolla"
    color: { type: String, required: true },
    shape: { type: String }, // sedan, hatchback, SUV, etc.
    ownerName: { type: String },
    ownerCNIC: { type: String },
    ownerContact: { type: String },
    legalStatus: {
      type: String,
      enum: ["clean", "stolen"],
      default: "clean",
    },
    reportedStolenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate normalized plate on every save
registeredVehicleSchema.pre("save", function (next) {
  this.plateNumberNormalized = this.plateNumber
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
  next();
});

module.exports = mongoose.model("RegisteredVehicle", registeredVehicleSchema);
