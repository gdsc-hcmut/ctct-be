import { Router } from "express";
import { inject, injectable } from "inversify";

import { Request, Response, ServiceType } from "../types";
import { Controller } from "./controller";
import { AuthService } from "../services";
import passport from "passport";
import { UserDocument } from "../models/user.model";
import { logger } from "../lib/logger";
@injectable()
export class AuthController extends Controller {
    public readonly router = Router();
    public readonly path = "/auth";

    constructor(@inject(ServiceType.Auth) private authService: AuthService) {
        super();
        this.router.get(
            "/google",
            passport.authenticate("google", {
                scope: ["email", "profile"],
            })
        );
        this.router.get(
            "/google/redirect",
            passport.authenticate("google", {
                scope: ["email", "profile"],
            }),
            async (req, res) => {
                const errorRedirectUrl = req.session.errorRedirectUrl;
                if (errorRedirectUrl) {
                    logger.error(`Redirecting to ${errorRedirectUrl}`);
                    delete req.session.errorRedirectUrl;
                    return res.redirect(errorRedirectUrl);
                }

                const user = req.user as UserDocument;
                const token = await this.authService.generateTokenUsingUsername(
                    user._id,
                    user.googleId,
                    user.email,
                    user.accessLevels,
                    user.isManager
                );
                console.log(token);
                if (process.env.ENV != "dev") {
                    res.redirect(
                        `${process.env.REDIRECT_URI}/login?token=${token}`
                    );
                }
            }
        );
        this.router.all("*", this.authService.authenticate());
        this.router.post("/login", this.login.bind(this));
        this.router.get("/ping", (req, res) => {
            res.send("Success");
        });
        // this.router.post('/logout', AuthService.authenticate, this.logout);
    }

    async login(req: Request, res: Response) {
        try {
            res.composer.success({});
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
