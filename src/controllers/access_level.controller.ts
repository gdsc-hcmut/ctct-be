import { Router } from "express";
import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import mongoose, { Types } from "mongoose";
import { logger } from "../lib/logger";
import { Request, Response, ServiceType } from "../types";
import { Permission } from "../models/access_level.model";
import {
    AccessLevelService,
    AuthService,
    UserService,
    MaterialService,
    PreviousExamService,
    QuizTemplateService,
} from "../services/index";
import _ from "lodash";

@injectable()
export class AccessLevelController extends Controller {
    public readonly router = Router();
    public readonly path = "/access_levels";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService
    ) {
        super();

        this.router.all("*", authService.authenticate());
        this.router.get("/", this.getAllAccessLevels.bind(this));
        this.router.post("/", this.create.bind(this));
        this.router.delete("/:accessLevelId", this.delete.bind(this));
        this.router.patch("/:accessLevelId", this.editAccessLevel.bind(this));
        this.router.patch(
            "/edituser/:userId",
            this.setUserAccessLevel.bind(this)
        );
    }

    async getAllAccessLevels(req: Request, res: Response) {
        try {
            const result = await this.accessLevelService.getAllAccessLevels();
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const userId = req.tokenMeta.userId;
            const { name } = req.body;
            const { description = "" } = req.body;
            if (!name) throw new Error(`Missing 'name' field`);
            const permissions: Permission[] = req.body.permissions
                ? (req.body.permissions as Permission[])
                : [];

            const result = await this.accessLevelService.create(
                userId,
                name,
                description,
                permissions
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async delete(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const accessLevelId = new Types.ObjectId(req.params.accessLevelId);
            const level = await this.accessLevelService.getAccessLevelById(
                accessLevelId,
                { session: session }
            );

            if (!level || level.predefinedId) {
                throw new Error(
                    `Access level does not exist, or cannot be deleted`
                );
            }

            const result = await this.accessLevelService.markAsDeleted(
                accessLevelId
            );
            await this.userService.removeAccessLevelFromAllUsers(
                accessLevelId,
                {
                    session: session,
                }
            ),
                await this.accessLevelService.invalidateCache(accessLevelId);

            res.composer.success(result);
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

    async editAccessLevel(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const accessLevelId = new Types.ObjectId(req.params.accessLevelId);
            const accessLevel =
                await this.accessLevelService.getAccessLevelById(accessLevelId);

            if (!accessLevel) {
                throw new Error(`Access level doesn't exist`);
            }

            const editableFields = accessLevel.predefinedId
                ? ["permissions"]
                : ["name", "description", "permissions"];
            const info = _.pick(req.body, editableFields);
            if (
                (info.permissions as Permission[]).some(
                    (p) => !Object.values(Permission).includes(p)
                )
            ) {
                throw new Error(`One or more unknown permissions received`);
            }

            const result = await this.accessLevelService.editOneAccessLevel(
                accessLevelId,
                info
            );

            await this.accessLevelService.invalidateCache(accessLevelId);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async setUserAccessLevel(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const userId = new Types.ObjectId(req.params.userId);
            const accessLevelsIds = (req.body.accessLevelsIds as string[]).map(
                (x) => new Types.ObjectId(x)
            );
            const verify =
                await this.accessLevelService.checkCanAssignAccessLevels(
                    accessLevelsIds
                );
            if (!verify) {
                throw new Error(
                    `One or more access levels does not exist, or are predefined ones`
                );
            }

            const result = await this.userService.setUserAccessLevel(
                userId,
                accessLevelsIds
            );
            if (!result) {
                throw new Error(`User not found`);
            }
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
