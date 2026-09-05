const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// New user creation lives in authRoutes.js (POST /api/auth/register)
// since it issues a token immediately on creation.

router.get("/", protect, authorize("super_admin"), getUsers);
router.get("/:id", protect, authorize("super_admin"), getUserById);
router.put("/:id", protect, authorize("super_admin"), updateUser);
router.patch("/:id/deactivate", protect, authorize("super_admin"), deactivateUser);

module.exports = router;
