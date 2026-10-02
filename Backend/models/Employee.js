import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    role: {
      type: String,
      enum: ["EMPLOYEE"],
      default: "EMPLOYEE",
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
employeeSchema.pre("save", async function () {
  // Don't hash password again when updating other fields
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password during employee login
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
