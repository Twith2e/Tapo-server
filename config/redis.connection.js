const { createClient } = require("redis");

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-17809.c341.af-south-1-1.ec2.redns.redis-cloud.com",
    port: 17809,
  },
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

async function redisConnection() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Connected to Redis Cloud");
    }
  } catch (error) {
    console.log("❌ Redis connection error:", error);
  }
}

// Call connection function at startup
redisConnection();

// Handle process termination
process.on("SIGINT", async () => {
  await redisClient.quit();
  console.log("🚀 Redis connection closed.");
  process.exit(0);
});

module.exports = redisClient;
