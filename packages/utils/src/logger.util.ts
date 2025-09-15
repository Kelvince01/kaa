import chalk from "chalk";
import winston from "winston";
import "winston-daily-rotate-file";
import config from "@kaa/config/api";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = config.env || "development";
  return env === "development" ? "debug" : "warn";
};

type LogLevel = "info" | "warn" | "error" | "debug";

const colorizeStatusCode = (statusCode: number): string => {
  if (statusCode >= 500) return chalk.red(statusCode.toString());
  if (statusCode >= 400) return chalk.yellow(statusCode.toString());
  if (statusCode >= 300) return chalk.cyan(statusCode.toString());
  if (statusCode >= 200) return chalk.green(statusCode.toString());
  return chalk.gray(statusCode.toString());
};

/**
 * format extra metadata
 */
export function formatExtra(extra: any): string {
  if (!extra) return "";
  try {
    if (typeof extra === "object") return `${JSON.stringify(extra, null, 2)}`;

    return `${extra}`;
  } catch (e) {
    return "[Complex Data]";
  }
}

// Winston transports configuration
const logDir = process.env.LOG_DIR || "logs";
const logLevel = process.env.LOG_LEVEL || "info";

// Define colors for each level
const colors: {
  [key: string]: string;
} = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

const logger = winston.createLogger({
  level: logLevel,
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          // Handle HTTP request logs
          if (info.type === "request") {
            const status = info.status as number;
            let statusColor = chalk.green;
            if (status >= 500) statusColor = chalk.red;
            if (status >= 400) statusColor = chalk.yellow;
            if (status >= 300) statusColor = chalk.cyan;
            if (status >= 200) statusColor = chalk.green;

            return `[${info.timestamp}] [${info.level}] - ${statusColor(info.method)} ${info.url} ${colorizeStatusCode(status)} ${info.duration}ms - ${formatExtra(info.extra)}`;
          }
          return `[${info.timestamp}] [${info.level}] - ${info.message} ${info.extra ? `- ${formatExtra(info.extra)}` : ""}`;
        })
      ),
    }),

    // File transport with daily rotation
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),

    // Error-specific log file
    new winston.transports.DailyRotateFile({
      level: "error",
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),
  ],
  exitOnError: false,
});

/**
 * Returns the duration message.
 *
 * @param {bigint} beforeTime The time before the request.
 * @returns {string}
 */
export function durationString(beforeTime: bigint): string {
  const now = process.hrtime.bigint();
  const timeDifference = now - beforeTime;
  const nanoseconds = Number(timeDifference);

  let timeMessage = "";

  if (nanoseconds >= 1e9) {
    const seconds = (nanoseconds / 1e9).toFixed(2);
    timeMessage = `| ${seconds}s`;
  } else if (nanoseconds >= 1e6) {
    const durationInMilliseconds = (nanoseconds / 1e6).toFixed(0);

    timeMessage = `| ${durationInMilliseconds}ms`;
  } else if (nanoseconds >= 1e3) {
    const durationInMicroseconds = (nanoseconds / 1e3).toFixed(0);

    timeMessage = `| ${durationInMicroseconds}µs`;
  } else {
    timeMessage = `| ${nanoseconds}ns`;
  }

  return timeMessage;
}

/**
 * Returns the duration message.
 * @param {string} method The method.
 * @returns {string}
 */
export function methodString(method: string): string {
  switch (method) {
    case "GET":
      return chalk.white("GET");

    case "POST":
      return chalk.yellow("POST");

    case "PUT":
      return chalk.blue("PUT");

    case "DELETE":
      return chalk.red("DELETE");

    case "PATCH":
      return chalk.green("PATCH");

    case "OPTIONS":
      return chalk.gray("OPTIONS");

    case "HEAD":
      return chalk.magenta("HEAD");

    default:
      return method;
  }
}

export { logger };
