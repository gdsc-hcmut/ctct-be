import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../../types";
import mongoose, { FilterQuery, Types } from "mongoose";
import {
    AccessLevelDocument,
    Permission,
} from "../../models/access_level.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";
import {
    AccessLevelService,
    AuthService,
    UserService,
} from "../../services/index";
import { logger } from "../../lib/logger";
import _ from "lodash";

@injectable()
export class AdminAccessLevelController extends Controller {
    public readonly router = Router();
    public readonly path = "/access_level";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.User) private userService: UserService
    ) {
        super();

        this.router.all("*", authService.authenticate());
        this.router.get("/", this.getAll.bind(this));
        this.router.get("/:accessLevelId", this.getById.bind(this));
        this.router.post("/", this.create.bind(this));
        this.router.delete("/:accessLevelId", this.delete.bind(this));
        this.router.patch("/:accessLevelId", this.edit.bind(this));
        this.router.patch("/user/:userId", this.setUserAccessLevel.bind(this));
    }

    async getById(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const accessLevelId = new Types.ObjectId(req.params.accessLevelId);
            const accessLevel = await this.accessLevelService.getByIdPopulated(
                accessLevelId,
                {
                    __v: 0,
                },
                []
            );

            if (!accessLevel) {
                throw new Error(`Access level does not exist`);
            }

            res.composer.success(accessLevel);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing administrative permissions`);
            }

            const query: FilterQuery<AccessLevelDocument> = {};
            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = await this.accessLevelService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    []
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] =
                    await this.accessLevelService.getPaginated(
                        query,
                        {
                            __v: 0,
                        },
                        [],
                        pageSize,
                        pageNumber
                    );
                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            }
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
            const { name, description = "" } = req.body;
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }
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
                accessLevelId,
                { session: session }
            );
            await this.userService.removeAccessLevelFromAllUsers(
                accessLevelId,
                {
                    session: session,
                }
            );

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

    async edit(req: Request, res: Response) {
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
                (accessLevelId) => new Types.ObjectId(accessLevelId)
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
