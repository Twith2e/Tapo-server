const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const saltround = 12;

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  userID: {
    type: Number,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  pin: {
    type: String,
    require: true,
    trim: true,
  },
  profilePic: {
    type: String,
    required: false,
  },
  lastOnline: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    required: true,
    trim: true,
  },
});

userSchema.pre("save", async function (next) {
  try {
    const hashedPin = await bcrypt.hash(this.pin, saltround);
    if (hashedPin) {
      this.pin = hashedPin;
    }
    next();
  } catch (error) {
    console.log(error);
    next();
  }
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
