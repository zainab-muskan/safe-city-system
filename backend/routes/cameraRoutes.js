const express = require("express");
const router = express.Router();
const {
  createCamera,
  getCameras,
  getCameraById,
  updateCamera,
  deleteCamera,
} = require("../controllers/cameraController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("super_admin"), createCamera);
router.put("/:id", protect, authorize("super_admin"), updateCamera);
router.delete("/:id", protect, authorize("super_admin"), deleteCamera);

router.get("/", protect, getCameras);
router.get("/:id", protect, getCameraById);

module.exports = router;
