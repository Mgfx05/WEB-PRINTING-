import { createLogger as winstonCreateLogger, format, transports } from "winston";

export function createLogger(service: string) {
  return winstonCreateLogger({
    level: process.env.LOG_LEVEL ?? "info",
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: { service: `erb-worker/${service}` },
    transports: [
      new transports.Console({
        format:
          process.env.NODE_ENV === "development"
            ? format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, service, ...meta }) => {
                  const metaStr =
                    Object.keys(meta).length
                      ? " " + JSON.stringify(meta, null, 0)
                      : "";
                  return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
                })
              )
            : format.json(),
      }),
    ],
  });
}
