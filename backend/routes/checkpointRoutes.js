const express = require("express");
const router = express.Router();
const {
  createCheckpoint,
  getCheckpoints,
  getCheckpointById,
  updateCheckpoint,
  deleteCheckpoint,
  assignOfficers,
} = require("../controllers/checkpointController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Infrastructure setup is Super Admin territory only
router.post("/", protect, authorize("super_admin"), createCheckpoint);
router.put("/:id", protect, authorize("super_admin"), updateCheckpoint);
router.put("/:id/officers", protect, authorize("super_admin"), assignOfficers);
router.delete("/:id", protect, authorize("super_admin"), deleteCheckpoint);

// Any logged-in staff can view checkpoints (Operators need this for dispatch context)
router.get("/", protect, getCheckpoints);
router.get("/:id", protect, getCheckpointById);

module.exports = router;
