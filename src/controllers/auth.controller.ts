import { Router } from "express";
import { inject, injectable } from "inversify";

import { Request, Response, ServiceType } from "../types";
import { Controller } from "./controller";
import { AuthService } from "../services";
import passport from "passport";
import { UserDocument } from "../models/user.model";
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
                const user = req.user as UserDocument;
                const token = await this.authService.generateTokenUsingUsername(
                    user._id,
                    user.googleId,
                    user.email,
                    user.role
                );
                if (process.env.ENV != "dev") {
                    res.redirect(`https://game.gdsc.app/login?token=${token}`);
                }
                // if (
                //     _.includes(
                //         USER_WHITE_LIST.map((e) => e.email),
                //         user.email,
                //     )
                // ) {
                //     res.redirect(
                //         `https://dev.game.gdsc.app/login?token=${token}`,
                //     );
                // } else res.redirect(`https://fessior.com/notpermission`);
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
