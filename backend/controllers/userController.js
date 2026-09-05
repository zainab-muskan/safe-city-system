const User = require("../models/User");

// @desc  Get all users (staff directory)
// @route GET /api/users
// @access Super Admin only
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("assignedCheckpoint", "name");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get a single user by id
// @route GET /api/users/:id
// @access Super Admin only
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("assignedCheckpoint", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a user (role, assigned checkpoint, active status).
//        Password changes should go through a dedicated flow, not this route.
// @route PUT /api/users/:id
// @access Super Admin only
exports.updateUser = async (req, res) => {
  try {
    const { password, ...safeUpdates } = req.body; // strip password out on purpose

    const user = await User.findByIdAndUpdate(req.params.id, safeUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Deactivate a user (soft delete — preserves audit history, so we
//        never hard-delete accounts tied to incident records)
// @route PATCH /api/users/:id/deactivate
// @access Super Admin only
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
