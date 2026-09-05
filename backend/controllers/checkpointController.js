const Checkpoint = require("../models/Checkpoint");

// @desc  Create a new checkpoint
// @route POST /api/checkpoints
// @access Super Admin only
exports.createCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.create(req.body);
    res.status(201).json(checkpoint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Get all checkpoints
// @route GET /api/checkpoints
// @access Any authenticated staff
exports.getCheckpoints = async (req, res) => {
  try {
    const checkpoints = await Checkpoint.find().populate(
      "assignedOfficers",
      "name email role"
    );
    res.status(200).json(checkpoints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single checkpoint by id
// @route GET /api/checkpoints/:id
// @access Any authenticated staff
exports.getCheckpointById = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id).populate(
      "assignedOfficers",
      "name email role"
    );
    if (!checkpoint) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }
    res.status(200).json(checkpoint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a checkpoint (e.g. rename, move location, activate/deactivate)
// @route PUT /api/checkpoints/:id
// @access Super Admin only
exports.updateCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!checkpoint) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }
    res.status(200).json(checkpoint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Update officers assigned to a checkpoint
// @route PUT /api/checkpoints/:id/officers
// @access Super Admin only
exports.assignOfficers = async (req, res) => {
  try {
    const { officerIds } = req.body;
    const User = require("../models/User");
    
    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }

    // Unassign old officers
    if (checkpoint.assignedOfficers && checkpoint.assignedOfficers.length > 0) {
      await User.updateMany(
        { _id: { $in: checkpoint.assignedOfficers } },
        { $unset: { assignedCheckpoint: 1 } }
      );
    }

    // Assign new officers
    checkpoint.assignedOfficers = officerIds;
    await checkpoint.save();

    if (officerIds && officerIds.length > 0) {
      await User.updateMany(
        { _id: { $in: officerIds } },
        { $set: { assignedCheckpoint: checkpoint._id } }
      );

      // Simulate sending SMS/Email alerts to the newly assigned officers
      const newlyAssigned = await User.find({ _id: { $in: officerIds } });
      newlyAssigned.forEach(officer => {
        console.log(`\n[TWILIO SMS SENT] To: ${officer.phone || officer.email}`);
        console.log(`Message: "ALERT: You have been newly assigned to duty at ${checkpoint.name}. Please report immediately."\n`);
      });
    }

    const updatedCheckpoint = await Checkpoint.findById(req.params.id).populate(
      "assignedOfficers",
      "name email role"
    );

    res.status(200).json({ message: "Officers updated and alerted", checkpoint: updatedCheckpoint });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Delete a checkpoint
// @route DELETE /api/checkpoints/:id
// @access Super Admin only
exports.deleteCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findByIdAndDelete(req.params.id);
    if (!checkpoint) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }
    res.status(200).json({ message: "Checkpoint deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
