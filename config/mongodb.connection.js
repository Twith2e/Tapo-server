import mongoose from "mongoose";

export default async function (url) {
  try {
    const connection = mongoose.connect(url, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    if (connection) {
      console.log("Database connection is live");
    }
  } catch (error) {
    console.log(error.message);
  }
}
