import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-13180.c323.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 13180,
  },
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

async function redisConnection() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Connected to Redis Cloud");
    }
  } catch (error) {
    console.log("Redis connection error:", error);
  }
}

// Call connection function at startup
redisConnection();

// Handle process termination
process.on("SIGINT", async () => {
  await redisClient.quit();
  console.log("Redis connection closed.");
  process.exit(0);
});

export default redisClient;
