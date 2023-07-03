import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services";
import mongoose from "mongoose";
import { logger } from "../lib/logger";

@injectable()
export class QuizController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz";

    constructor(@inject(ServiceType.Auth) private authService: AuthService) {
        super();

        this.router.all("*", authService.authenticate());
    }
}
