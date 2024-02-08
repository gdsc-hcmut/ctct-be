import winston from "winston";

export const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.colorize({
            all: true,
        }),
        winston.format.label({
            label: "[LOGGER]",
        }),
        winston.format.timestamp({
            format: "YY-MM-DD HH:MM:SS",
        }),
        winston.format.printf(
            (info) =>
                ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
        ),
        winston.format.errors({ stack: true })
    ),
    transports: [new winston.transports.Console()],
});
