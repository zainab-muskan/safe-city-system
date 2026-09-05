const Camera = require("../models/Camera");

// @desc  Register a new camera, linked to a checkpoint
// @route POST /api/cameras
// @access Super Admin only
exports.createCamera = async (req, res) => {
  try {
    const camera = await Camera.create(req.body);
    res.status(201).json(camera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Get all cameras
// @route GET /api/cameras
// @access Any authenticated staff
exports.getCameras = async (req, res) => {
  try {
    const cameras = await Camera.find().populate("linkedCheckpoint", "name location");
    res.status(200).json(cameras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single camera by id
// @route GET /api/cameras/:id
// @access Any authenticated staff
exports.getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id).populate(
      "linkedCheckpoint",
      "name location"
    );
    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }
    res.status(200).json(camera);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a camera (rename, re-point direction, relink checkpoint, activate/deactivate)
// @route PUT /api/cameras/:id
// @access Super Admin only
exports.updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }
    res.status(200).json(camera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Delete a camera
// @route DELETE /api/cameras/:id
// @access Super Admin only
exports.deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findByIdAndDelete(req.params.id);
    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }
    res.status(200).json({ message: "Camera deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
