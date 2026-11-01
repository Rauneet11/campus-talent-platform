const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    department: {
      type: String,
      enum: ["MCA", "CSE", "IT", "ECE", "EEE", "ME", "CE"],
      required: true,
    },

    designation: {
      type: String,
      required: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);