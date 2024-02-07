import { NextFunction } from "express";
import { addHttpRequestMetric } from "./metrics";
import { Request, Response } from "../../types";
import { logger } from "../logger";

export default function apiMetricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const startTime = Date.now();

    res.on("finish", () => {
        try {
            const responseTimeMilliseconds = Date.now() - startTime;
            const routePrefix = req.routePrefix || "";
            const route = routePrefix + req.route.path;

            addHttpRequestMetric({
                method: req.method,
                route,
                status: res.statusCode,
                responseTimeMilliseconds,
            });
        } catch (error) {
            logger.error(`Failed to record API metrics (${error})`);
        }
    });

    next();
}
