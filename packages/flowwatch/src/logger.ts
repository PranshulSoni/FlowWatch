import pino from "pino"

export const logger = pino({
    name: "flowwatch",
    level: process.env.LOG_LEVEL ?? "info",
})

export type { Logger } from "pino"
