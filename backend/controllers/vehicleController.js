const RegisteredVehicle = require("../models/RegisteredVehicle");

// @desc  Add a new vehicle to the mock registry
// @route POST /api/vehicles
exports.addVehicle = async (req, res) => {
  try {
    const vehicle = await RegisteredVehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Get all registered vehicles
// @route GET /api/vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await RegisteredVehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Lookup a single vehicle by plate number (used by the detection pipeline)
// @route GET /api/vehicles/:plateNumber
exports.getVehicleByPlate = async (req, res) => {
  try {
    const normalizedPlate = req.params.plateNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const vehicle = await RegisteredVehicle.findOne({
      plateNumberNormalized: normalizedPlate,
    });
    if (!vehicle) {
      return res.status(404).json({ message: "Plate not found in registry" });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a registered vehicle
// @route PUT /api/vehicles/:id
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await RegisteredVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    Object.assign(vehicle, req.body);
    await vehicle.save(); // triggers pre-save hook to update plateNumberNormalized
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Delete a registered vehicle
// @route DELETE /api/vehicles/:id
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await RegisteredVehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json({ message: "Vehicle removed from registry" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
