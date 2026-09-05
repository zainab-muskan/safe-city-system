const express = require("express");
const router = express.Router();
const { getDashboardStats, getMapData } = require("../controllers/statsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("super_admin", "operator"), getDashboardStats);
router.get("/map", protect, authorize("super_admin", "operator"), getMapData);

module.exports = router;
