const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Checkpoint = require("../models/Checkpoint"); // Import Checkpoint model

// Signs a JWT containing the user's id and role — role is embedded so
// middleware can check permissions without a DB lookup on every request
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// @desc  Register a new user (in practice, only Super Admin should call this
//        via a protected route — see userRoutes.js)
// @route POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedCheckpoint } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Password gets hashed automatically by the pre-save hook in User.js
    const user = await User.create({
      name,
      email,
      password,
      role,
      assignedCheckpoint: assignedCheckpoint || null,
    });

    // If they are assigned to a checkpoint, update the Checkpoint document
    if (assignedCheckpoint) {
      await Checkpoint.findByIdAndUpdate(assignedCheckpoint, {
        $push: { assignedOfficers: user._id },
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedCheckpoint: user.assignedCheckpoint, // Return it!
      token: generateToken(user),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Log in and receive a JWT
// @route POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedCheckpoint: user.assignedCheckpoint, // Return it!
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get the currently logged-in user's profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json(req.user);
};
