import { NextFunction, Request, Response } from "express";
import { addHttpRequestMetric } from "./metrics";

export default function apiMetricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const startTime = Date.now();

    res.on("finish", () => {
        const responseTimeMilliseconds = Date.now() - startTime;
        addHttpRequestMetric({
            method: req.method,
            route: req.originalUrl,
            status: res.statusCode,
            responseTimeMilliseconds,
        });
    });

    next();
}
