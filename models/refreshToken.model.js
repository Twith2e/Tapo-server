import mongoose from "mongoose";

const tokenSchema = mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
    trim: true,
  },
});

const tokenModel = mongoose.model("token", tokenSchema);

export default tokenModel;
