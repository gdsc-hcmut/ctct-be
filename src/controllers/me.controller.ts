import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services";
import { ErrorNotFound } from "../lib/errors";

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
        console.log("hello1");
        try {
            const userId = req.tokenMeta.userId;
            console.log(userId);
            const user = await this.userService.findUserById(userId);

            if (!user) {
                throw new ErrorNotFound(`Requested user is not found`);
            }

            res.composer.success(user);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
