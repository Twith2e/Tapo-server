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

await redisClient.connect();
console.log("Connected to Redis Cloud");

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

await pubClient.connect();
await subClient.connect();
console.log("Connected to Redis Cloud Pub/Sub");

export { redisClient, pubClient, subClient };
