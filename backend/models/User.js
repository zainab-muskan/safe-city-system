const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // store hashed, never plain text
    role: {
      type: String,
      enum: ["super_admin", "operator", "checkpoint_officer"],
      required: true,
    },
    // Only relevant for checkpoint_officer role — which checkpoint they're assigned to
    assignedCheckpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkpoint",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Hash the password automatically before saving, but only if it was changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check a plain-text login password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
