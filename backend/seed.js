// Run this once to create your first collections + initial data:
//   node seed.js
//
// Safe to re-run — it clears these collections first so you don't get duplicates.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Checkpoint = require("./models/Checkpoint");
const Camera = require("./models/Camera");
const RegisteredVehicle = require("./models/RegisteredVehicle");
const Incident = require("./models/Incident");

const seed = async () => {
  await connectDB();

  console.log("Clearing seed collections (preserving incidents & vehicles)...");
  await Promise.all([
    User.deleteMany({}),
    Checkpoint.deleteMany({}),
    Camera.deleteMany({}),
    // NOTE: We do NOT delete Incidents or RegisteredVehicles here.
    // Incidents come from real AI detections and should be preserved.
    // Vehicles are upserted below to preserve their MongoDB IDs (so incident references stay valid).
  ]);

  // --- 1. Super Admin (password gets hashed automatically via the User model hook) ---
  const admin = await User.create({
    name: "System Admin",
    email: "admin@safecity.pk",
    password: "Admin@123", // change this after first login
    role: "super_admin",
  });
  console.log("Created Super Admin:", admin.email);

  // --- 2. Checkpoint ---
  const saddarCheckpoint = await Checkpoint.create({
    name: "Saddar Checkpoint",
    location: { type: "Point", coordinates: [73.0479, 33.6007] }, // [lng, lat] - Saddar, Rawalpindi
  });
  console.log("Created Checkpoint:", saddarCheckpoint.name);

  // --- 3. Checkpoint Officer, now that the checkpoint exists to assign them to ---
  const officer = await User.create({
    name: "Officer Ahmed",
    email: "officer1@safecity.pk",
    password: "Officer@123",
    role: "checkpoint_officer",
    assignedCheckpoint: saddarCheckpoint._id,
  });
  console.log("Created Checkpoint Officer:", officer.email);

  // Link the officer back onto the checkpoint's assignedOfficers array
  saddarCheckpoint.assignedOfficers.push(officer._id);
  await saddarCheckpoint.save();

  // --- 4. Operator ---
  const operator = await User.create({
    name: "Control Room Operator",
    email: "operator1@safecity.pk",
    password: "Operator@123",
    role: "operator",
  });
  console.log("Created Operator:", operator.email);

  // --- 5. Camera, linked to the checkpoint ---
  const camera = await Camera.create({
    name: "6th Road Camera",
    location: { type: "Point", coordinates: [73.0551, 33.6076] },
    direction: "Towards Saddar",
    linkedCheckpoint: saddarCheckpoint._id,
  });
  console.log("Created Camera:", camera.name);

  // --- 6. Registered vehicles (mock registry) ---
  const vehiclesData = [
    {
      plateNumber: "ABC-123",
      model: "Toyota Corolla",
      color: "White",
      shape: "Sedan",
      ownerName: "Bilal Khan",
      ownerCNIC: "12345-6789012-3",
      ownerContact: "0300-1234567",
      legalStatus: "clean",
    },
    {
      plateNumber: "XYZ-789",
      model: "Honda Civic",
      color: "Black",
      shape: "Sedan",
      ownerName: "Sara Ahmed",
      ownerCNIC: "98765-4321098-7",
      ownerContact: "0321-9876543",
      legalStatus: "stolen",
      reportedStolenAt: new Date(),
    },
    {
      plateNumber: "LMN-456",
      model: "Suzuki Alto",
      color: "Silver",
      shape: "Hatchback",
      ownerName: "Usman Tariq",
      ownerCNIC: "11111-2222222-3",
      ownerContact: "0333-1112233",
      legalStatus: "clean",
    },
    {
      plateNumber: "PQR-999",
      model: "Kia Sportage",
      color: "Red",
      shape: "SUV",
      ownerName: "Ayesha Malik",
      ownerCNIC: "44444-5555555-6",
      ownerContact: "0345-4445566",
      legalStatus: "stolen",
      reportedStolenAt: new Date(),
    },
    {
      plateNumber: "DEF-111",
      model: "Honda CD70",
      color: "Red",
      shape: "Motorcycle",
      ownerName: "Ali Raza",
      ownerCNIC: "77777-8888888-9",
      ownerContact: "0312-7778899",
      legalStatus: "clean",
    }
  ];

  const createdVehicles = await Promise.all(
    vehiclesData.map(v => RegisteredVehicle.findOneAndUpdate(
      { plateNumber: v.plateNumber },  // find by plate
      v,                                // update with full data
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ))
  );
  // Trigger the pre-save hook for normalization on any new ones
  for (const v of createdVehicles) {
    v.plateNumberNormalized = v.plateNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    await v.save();
  }
  console.log(`Created ${createdVehicles.length} RegisteredVehicles.`);

  console.log("\nSeeding complete. Collections created: users, checkpoints, cameras, registeredvehicles");
  console.log("(Incidents are preserved — they come from real AI detections)");
  console.log("\nLogin credentials:");
  console.log("  Super Admin        -> admin@safecity.pk / Admin@123");
  console.log("  Operator           -> operator1@safecity.pk / Operator@123");
  console.log("  Checkpoint Officer -> officer1@safecity.pk / Officer@123");

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
