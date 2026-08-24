import { createClient } from "redis";
import IORedis from "ioredis";
import { createLogger } from "./logger";

const logger = createLogger("redis");

// BullMQ requires an ioredis connection
export const redisConnection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null, // required for BullMQ
    enableReadyCheck: false,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
  }
);

redisConnection.on("connect", () => {
  logger.info("Redis connected");
});

redisConnection.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});
