const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

   name:{
    type:String,
    required:true,
    trim:true,
    minlength:3,
    maxlength:50
},

    rollNo: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
     enum:[
"MCA",
"CSE",
"IT",
"ECE",
"EEE",
"ME",
"CE"
],
      required: true,
    },

    year: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    cgpa:{
    type:Number,
    min:0,
    max:10,
    required:true
}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);