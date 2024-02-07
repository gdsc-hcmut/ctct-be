import { Express, Request, Response } from "express";
import client from "prom-client";

import { HttpRequestMetricDto } from "./metrics.dto";
import apiMetricsMiddleware from "./api-metrics.middleware";

const totalHttpRequestsCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});

const httpRequestResponseTimeQuantile = new client.Summary({
    name: "http_request_response_time_quantile",
    help: "Response time quantiles",
    percentiles: [0.1, 0.5, 0.9, 0.99],
});

const httpRequestResponseTimeByApiQuantile = new client.Summary({
    name: "http_request_response_time_by_api_quantile",
    help: "Response time in quantiles, grouped by API",
    labelNames: ["method", "route"],
    percentiles: [0.1, 0.5, 0.9, 0.99],
});

const httpRequestResponseTimeByApiStatusCodeQuantile = new client.Summary({
    name: "http_request_response_time_by_api_status_code_quantile",
    help: "Response time in quantiles, grouped by API and status code",
    labelNames: ["method", "route", "status"],
    percentiles: [0.1, 0.5, 0.9, 0.99],
});

const httpRequestResponseTimeHistogram = new client.Histogram({
    name: "http_request_response_time_histogram",
    help: "Response time histogram",
    buckets: [100, 200, 500, 1000, 2000, 5000],
});

const httpRequestResponseTimeByApiHistogram = new client.Histogram({
    name: "http_request_response_time_by_api_histogram",
    help: "Response time histogram, grouped by API",
    labelNames: ["method", "route"],
    buckets: [100, 200, 500, 1000, 2000, 5000],
});

const httpRequestResponseTimeByApiStatusCodeHistogram = new client.Histogram({
    name: "http_request_response_time_by_api_status_code_histogram",
    help: "Response time histogram, grouped by API and status code",
    labelNames: ["method", "route", "status"],
    buckets: [100, 200, 500, 1000, 2000, 5000],
});

export function addHttpRequestMetric(metric: HttpRequestMetricDto): void {
    totalHttpRequestsCounter
        .labels({
            method: metric.method,
            route: metric.route,
            status: metric.status.toString(),
        })
        .inc();

    httpRequestResponseTimeQuantile.observe(metric.responseTimeMilliseconds);
    httpRequestResponseTimeByApiQuantile
        .labels({ method: metric.method, route: metric.route })
        .observe(metric.responseTimeMilliseconds);
    httpRequestResponseTimeByApiStatusCodeQuantile
        .labels({
            method: metric.method,
            route: metric.route,
            status: metric.status.toString(),
        })
        .observe(metric.responseTimeMilliseconds);

    httpRequestResponseTimeHistogram.observe(metric.responseTimeMilliseconds);
    httpRequestResponseTimeByApiHistogram
        .labels({ method: metric.method, route: metric.route })
        .observe(metric.responseTimeMilliseconds);
    httpRequestResponseTimeByApiStatusCodeHistogram
        .labels({
            method: metric.method,
            route: metric.route,
            status: metric.status.toString(),
        })
        .observe(metric.responseTimeMilliseconds);
}

export function setupMetrics(app: Express): Express {
    client.collectDefaultMetrics();

    app.use("*", apiMetricsMiddleware);

    app.get("/metrics", async (_req: Request, res: Response) => {
        try {
            res.set("Content-Type", client.register.contentType);

            const metrics = await client.register.metrics();
            return res.send(metrics);
        } catch (error) {
            return res.status(400).send(error.message);
        }
    });

    return app;
}
