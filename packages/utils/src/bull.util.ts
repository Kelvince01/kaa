import { type DefaultJobOptions, Queue } from "bullmq";
import { redisConfig } from "./cache.util";

export const sleep = (t: number) =>
  new Promise((resolve) => setTimeout(resolve, t * 1000));

export const redisOptions = {
  host: redisConfig.host,
  port: Number.parseInt(redisConfig.port, 10),
  password: redisConfig.password,
};

export const createQueue = (name: string, options?: DefaultJobOptions) =>
  new Queue(name, {
    connection: redisOptions,
    defaultJobOptions: options
      ? options
      : {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
  });
