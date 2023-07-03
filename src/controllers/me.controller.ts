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
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.tokenMeta.userId;
            const user = await this.userService.findUserById(userId);

            if (!user) {
                throw new ErrorNotFound(`Requested user is not found`);
            }

            res.composer.success(user);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }
}
