import { Router } from "express";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { Request, Response, ServiceType } from "../types";
import { Controller } from "./controller";

import { UserService, AuthService } from "../services";
import { ErrorInvalidData } from "../lib/errors";
import mongoose, { Types } from "mongoose";

@injectable()
export class UserController extends Controller {
    public readonly router = Router();
    public readonly path = "/users";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));

        // Sign up
        this.router.post("/register_device", this.registerDevice.bind(this));

        this.router.all("*", this.authService.authenticate());
        this.router.post("/device_token", this.matchUserWithDevice.bind(this));
    }

    public async shouldFilterData(req: Request) {
        const { userid } = req.params;
        const { userId: tokenUserId } = req.tokenMeta;
        const user = await this.userService.findOne({
            _id: mongoose.Types.ObjectId.createFromHexString(userid),
        });

        return !(tokenUserId && userid == tokenUserId.toHexString());
    }

    async createUser(req: Request, res: Response) {
        try {
            let { username, name } = req.body;
            const { password } = req.body;
            if (!username) {
                throw new ErrorInvalidData(
                    `Please provide a username to continue`
                );
            }
            if (!password) {
                throw new ErrorInvalidData(
                    `Please provide a password to continue`
                );
            }
            if (!name) {
                throw new ErrorInvalidData(`Please provide a name to continue`);
            }
            username = username.trim();
            name = name.trim();

            // const createdUser = await this.userService.createUser(
            //     username,
            //     password,
            //     name
            // );
            // await this.userService.verifyAccountRequest(createdUser.email);

            res.composer.success({});
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async registerDevice(req: Request, res: Response) {
        try {
            const createdUser = await this.userService.registerNewDevice(
                req.body.token
            );
            // await this.userService.verifyAccountRequest(createdUser.email);

            res.composer.success(createdUser._id);
        } catch (error) {
            res.composer.badRequest(error.message);
        }
    }

    async matchUserWithDevice(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const tokenId = req.body.tokenId;
            console.log("Test match", req.body.tokenId);
            const createdUser =
                await this.userService.registerNewUserToDeviceToken(
                    new mongoose.Types.ObjectId(tokenId),
                    userId
                );
            // await this.userService.verifyAccountRequest(createdUser.email);

            res.composer.success(createdUser);
        } catch (error) {
            res.composer.badRequest(error.message);
        }
    }

    async verifyAccountRequest(req: Request, res: Response) {
        const { email: rawEmail } = req.body;
        const email = _.trim(rawEmail).toLowerCase().toString();

        try {
            res.composer.success(
                await this.userService.verifyAccountRequest(email)
            );
        } catch (error) {
            res.composer.badRequest(error.message);
        }
    }

    async verifyAccount(req: Request, res: Response) {
        const { verifyAccountCode } = req.body;

        try {
            res.composer.success(
                await this.userService.verifyAccount(verifyAccountCode)
            );
        } catch (error) {
            res.composer.badRequest(error.message);
        }
    }
}
