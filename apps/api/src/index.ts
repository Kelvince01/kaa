import config from "@kaa/config/api";
import { logger } from "@kaa/utils";
import chalk from "chalk";
import mongoose from "mongoose";
import ascii from "~/shared/utils/ascii.util";
import app from "./app";

// Function to find available port
// const findAvailablePort = (startPort: number): Promise<number> => {
//   return new Promise((resolve) => {
//     const server = app
//       .listen(startPort, () => {
//         const port = (server.address() as any)?.port || startPort;
//         server.close(() => resolve(port));
//       })
//       .on("error", () => {
//         resolve(findAvailablePort(startPort + 1));
//       });
//   });
// };

// const port = await findAvailablePort(config.port);

const server = app.listen(config.port, () => {
  ascii();
  console.log("🔥 App Initialized...");
  console.info(" ");
  console.info(
    `🚀 ${chalk.greenBright.bold("Kaa")}
		(Client) runs on: ${chalk.cyanBright.bold(config.clientUrl)}
		(API): ${chalk.cyanBright.bold(`${config.app.url}`)}
		(Docs): ${chalk.cyanBright(`${config.app.url}/api/docs`)}`
  );
  console.info(" ");
});

// Add graceful shutdown handler for queues
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled rejections
process.on(
  "unhandledRejection",
  (err: Error, promise: Promise<any>, reason: any) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name, err.message);
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    server.stop();
    process.exit(1);
  }
);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");

  server.stop();
  logger.info("💥 Process terminated!");

  mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");

  process.exit(0);
});
