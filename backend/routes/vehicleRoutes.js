const express = require("express");
const router = express.Router();
const {
  addVehicle,
  getVehicles,
  getVehicleByPlate,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Only Super Admin manages the registry directly
router.post("/", protect, authorize("super_admin"), addVehicle);
router.put("/:id", protect, authorize("super_admin"), updateVehicle);
router.delete("/:id", protect, authorize("super_admin"), deleteVehicle);

// Any logged-in staff can look up vehicles
router.get("/", protect, getVehicles);
router.get("/:plateNumber", protect, getVehicleByPlate);

module.exports = router;
