import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { ServiceType } from "../types";
import { AuthService } from "../services";

@injectable()
export class QuizController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz";

    constructor(@inject(ServiceType.Auth) private authService: AuthService) {
        super();

        this.router.all("*", authService.authenticate());
    }
}
