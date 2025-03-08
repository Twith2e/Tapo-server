const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const saltround = 12;

const userSchema = mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  profilePic: {
    type: String,
    default: null,
    required: false,
  },
  lastOnline: {
    type: Date,
    default: new Date(),
  },
  status: {
    type: String,
    required: true,
    trim: true,
    default: "offline",
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordTokenExpDate: {
    type: Date,
    default: null,
  },
});

// userSchema.pre("save", async function (next) {
//   try {
//     const hashedPin = await bcrypt.hash(this.password, saltround);
//     if (hashedPin) {
//       this.password = hashedPin;
//     }
//     next();
//   } catch (error) {
//     console.log(error);
//     next();
//   }
// });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
