const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public: anyone can log in
router.post("/login", loginUser);

// Protected: only a logged-in Super Admin can create new accounts.
// (In a real deployment you'd seed the very first super_admin directly
// in the database rather than exposing an open registration route.)
router.post("/register", protect, authorize("super_admin"), registerUser);

// Protected: any logged-in user can view their own profile
router.get("/me", protect, getMe);

module.exports = router;
