import { NextFunction } from "express";
import { Request, Response } from "../types";

export default function recordRoutePrefix(prefix: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        const previousPrefix = req.routePrefix || "";
        req.routePrefix = previousPrefix + prefix;
        next();
    };
}
