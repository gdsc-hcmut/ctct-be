import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services/index";
import { ErrorNotFound } from "../lib/errors";
import { logger } from "../lib/logger";
import { EditProfileDto } from "../lib/dto/edit_profile.dto";
import { Gender } from "../models/user.model";

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
        this.router.patch("/", this.editProfile.bind(this));
    }

    async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;
            const user = await this.userService.getByIdPopulated(userId, [
                "accessLevels",
            ]);

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

    async editProfile(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const user = await this.userService.getById(userId);

            const info: EditProfileDto = {
                familyAndMiddleName:
                    req.body.familyAndMiddleName ?? user.familyAndMiddleName,
                givenName: req.body.givenName ?? user.givenName,
                studentId: req.body.studentId ?? user.studentId,
                major: req.body.major ?? user.major,
                dateOfBirth: req.body.dateOfBirth ?? user.dateOfBirth,
                gender: (req.body.gender as Gender) ?? user.gender,
                phoneNumber: req.body.phoneNumber ?? user.phoneNumber,
            };

            const invalidDob =
                info.dateOfBirth !== undefined && info.dateOfBirth > Date.now();
            if (invalidDob) {
                throw new Error("Invalid date of birth");
            }

            const invalidGender =
                info.gender !== undefined &&
                !Object.values(Gender).includes(info.gender);
            if (invalidGender) {
                throw new Error(`Gender ${info.gender} is invalid`);
            }

            const validPhoneNumber =
                info.phoneNumber !== undefined &&
                /^[0-9]*$/.test(info.phoneNumber);
            if (!validPhoneNumber) {
                throw new Error("Invalid phone number");
            }

            const result = await this.userService.edit(userId, info);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
