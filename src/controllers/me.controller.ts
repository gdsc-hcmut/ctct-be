import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services/index";
import { ErrorNotFound } from "../lib/errors";
import mongoose from "mongoose";
import { logger } from "../lib/logger";

@injectable()
export class MeController extends Controller {
    public readonly router = Router();
    public readonly path = "/me";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        // My profile
        this.router.get("/", this.getMyProfile.bind(this));
    }

    async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;
            const user = await this.userService.getUserById(userId);

            if (!user) {
                throw new ErrorNotFound(`Requested user is not found`);
            }

            res.composer.success(user);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
