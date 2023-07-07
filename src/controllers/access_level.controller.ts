import { Router } from "express";
import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import mongoose, { Types } from "mongoose";
import { logger } from "../lib/logger";
import { Request, Response, ServiceType } from "../types";
import { AccessLevelDocument, Permission } from "../models/access_level.model";
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
        this.router.get("/all", this.viewAllAccessLevels.bind(this));
        this.router.post("/", this.createAccessLevel.bind(this));
        this.router.delete(
            "/delete/:accessLevelId",
            this.deleteAccessLevel.bind(this)
        );
        this.router.patch(
            "/edit/:accessLevelId",
            this.editAccessLevel.bind(this)
        );
        this.router.patch("/edituser", this.setUserAccessLevel.bind(this));
    }

    async viewAllAccessLevels(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const result = await this.accessLevelService.findAccessLevels({});
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

    async createAccessLevel(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const userId = req.tokenMeta.userId;
            const { name } = req.body;
            let { description } = req.body;
            if (!name) throw new Error(`Missing 'name' field`);
            if (!description) description = "";
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

    async deleteAccessLevel(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const accessLevelId = new Types.ObjectId(req.params.accessLevelId);
            const deletedAccessLevel =
                await this.accessLevelService.findOneAndDelete({
                    _id: accessLevelId,
                    predefinedId: { $exists: false },
                });
            if (!deletedAccessLevel) {
                throw new Error(
                    `Requested access level does not exist, or the level itself cannot be deleted`
                );
            }

            await Promise.all([
                this.userService.updateMany(
                    {},
                    { $pull: { accessLevels: accessLevelId } }
                ),
                this.materialService.updateMany(
                    {},
                    { $pull: { visibleTo: accessLevelId } }
                ),
                this.previousExamService.updateMany(
                    {},
                    { $pull: { visibleTo: accessLevelId } }
                ),
                this.quizTemplateService.updateMany(
                    {},
                    { $pull: { visibleTo: accessLevelId } }
                ),
            ]);
            await this.accessLevelService.invalidateCache(
                accessLevelId.toString()
            );

            res.composer.success(deletedAccessLevel);
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
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const accessLevelId = new Types.ObjectId(req.params.accessLevelId);
            const accessLevel = await this.accessLevelService.findById(
                accessLevelId
            );
            if (!accessLevel) {
                throw new Error(`The requested access level does not exist`);
            }

            let result: AccessLevelDocument;
            if (accessLevel.predefinedId) {
                const info = _.pick(req.body, ["permissions"]);
                if (
                    (info.permissions as Permission[]).some(
                        (p) => !Object.values(Permission).includes(p)
                    )
                ) {
                    throw new Error(`One or more unknown permissions received`);
                }
                result = await this.accessLevelService.findOneAndUpdate(
                    { _id: accessLevelId },
                    { ...info },
                    { new: true }
                );
            } else {
                const info = _.pick(req.body, [
                    "name",
                    "description",
                    "permissions",
                ]);
                if (
                    (info.permissions as Permission[]).some(
                        (p) => !Object.values(Permission).includes(p)
                    )
                ) {
                    throw new Error(`One or more unknown permissions received`);
                }
                result = await this.accessLevelService.findOneAndUpdate(
                    { _id: accessLevelId },
                    { ...info },
                    { new: true }
                );
            }

            await this.accessLevelService.invalidateCache(
                accessLevelId.toString()
            );

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

    async setUserAccessLevel(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const userId = new Types.ObjectId(req.body.userId);
            const accessLevelsIds = (req.body.accessLevelsIds as string[]).map(
                (x) => new Types.ObjectId(x)
            );
            const verify =
                await this.accessLevelService.verifyAssignAccessLevel(
                    accessLevelsIds
                );
            if (!verify) {
                throw new Error(
                    `One or more roles does not exist, or are predefined ones`
                );
            }

            const result = await this.userService.findOneAndUpdate(
                { _id: userId },
                { $set: { accessLevels: accessLevelsIds } },
                { new: true }
            );
            if (!result) {
                throw new Error(`User not found`);
            }
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
}
