const Incident = require("../models/Incident");
const RegisteredVehicle = require("../models/RegisteredVehicle");
const Camera = require("../models/Camera");
const Checkpoint = require("../models/Checkpoint");
const User = require("../models/User");

// @desc  Get dashboard statistics
// @route GET /api/stats
// @access Super Admin, Operator
exports.getDashboardStats = async (req, res) => {
  try {
    // --- Counts ---
    const [
      totalIncidents,
      pendingIncidents,
      confirmedIncidents,
      dispatchedIncidents,
      resolvedIncidents,
      falsePositives,
      totalVehicles,
      stolenVehicles,
      totalCameras,
      totalCheckpoints,
      totalOfficers,
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: "pending_review" }),
      Incident.countDocuments({ status: "confirmed" }),
      Incident.countDocuments({ status: "dispatched" }),
      Incident.countDocuments({ status: "resolved" }),
      Incident.countDocuments({ status: "false_positive" }),
      RegisteredVehicle.countDocuments(),
      RegisteredVehicle.countDocuments({ legalStatus: "stolen" }),
      Camera.countDocuments(),
      Checkpoint.countDocuments(),
      User.countDocuments({ role: "checkpoint_officer" }),
    ]);

    // --- Threat breakdown ---
    const threatBreakdown = await Incident.aggregate([
      { $group: { _id: "$threatType", count: { $sum: 1 } } },
    ]);

    // --- Recent incidents (last 10) ---
    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("camera", "name")
      .populate("matchedVehicle", "plateNumber model ownerName")
      .lean();

    res.status(200).json({
      incidents: {
        total: totalIncidents,
        pending: pendingIncidents,
        confirmed: confirmedIncidents,
        dispatched: dispatchedIncidents,
        resolved: resolvedIncidents,
        falsePositives,
      },
      vehicles: {
        total: totalVehicles,
        stolen: stolenVehicles,
        clean: totalVehicles - stolenVehicles,
      },
      infrastructure: {
        cameras: totalCameras,
        checkpoints: totalCheckpoints,
        officers: totalOfficers,
      },
      threatBreakdown,
      recentIncidents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get map data: cameras, checkpoints with locations, and active threat incidents
// @route GET /api/stats/map
// @access Super Admin, Operator
exports.getMapData = async (req, res) => {
  try {
    const [cameras, checkpoints, activeIncidents] = await Promise.all([
      Camera.find({ isActive: true })
        .populate("linkedCheckpoint", "name")
        .lean(),
      Checkpoint.find({ isActive: true }).lean(),
      Incident.find({ status: { $in: ["pending_review", "dispatched"] } })
        .populate("camera", "name location direction")
        .populate("matchedVehicle", "plateNumber model color ownerName legalStatus")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    res.status(200).json({ cameras, checkpoints, activeIncidents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
