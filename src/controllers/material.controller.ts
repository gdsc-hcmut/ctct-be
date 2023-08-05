import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    SubjectService,
    MaterialService,
    FileUploadService,
    AccessLevelService,
    ChapterService,
    UserActivityService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import { MaterialDocument } from "../models/material.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import _ from "lodash";
import { UserActivityType } from "../models/user_activity.model";

@injectable()
export class MaterialController extends Controller {
    public readonly router = Router();
    public readonly path = "/material";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.UserActivity)
        private userActivityService: UserActivityService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));

        this.router.get("/:materialId", this.getById.bind(this));
        this.router.get("/:materialId/download", this.download.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_MATERIAL);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const materialId = new Types.ObjectId(req.params.materialId);
            const material = await this.materialService.getByIdPopulated(
                materialId,
                {
                    __v: 0,
                    resource: 0,
                    createdBy: 0,
                    createdAt: 0,
                    lastUpdatedAt: 0,
                },
                ["subject", "chapter"]
            );

            if (!material) {
                throw new Error(`Material not found`);
            }

            const result = _.omit(material.toObject(), [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
                "chapter.__v",
                "chapter.createdAt",
                "chapter.createdBy",
                "chapter.lastUpdatedAt",
            ]);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_MATERIAL);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const materialId = new Types.ObjectId(req.params.materialId);
            const material = await this.materialService.getById(materialId);

            if (!material) {
                throw new Error(`Material doesn't exist`);
            }

            const file = await this.fileUploadService.downloadFile(
                material.resource
            );

            if (req.tokenMeta?.userId) {
                await this.userActivityService.create(
                    UserActivityType.VIEW_MATERIAL,
                    req.tokenMeta.userId,
                    materialId
                );
            }

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${encodeURI(file.originalName)}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_MATERIAL);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<MaterialDocument> = {};
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
            }
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

            const hiddenFields = [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
                "chapter.__v",
                "chapter.createdAt",
                "chapter.createdBy",
                "chapter.lastUpdatedAt",
            ];

            if (req.query.pagination === "false") {
                const result = (
                    await this.materialService.getPopulated(
                        query,
                        {
                            __v: 0,
                            resource: 0,
                            createdBy: 0,
                            createdAt: 0,
                            lastUpdatedAt: 0,
                        },
                        ["subject", "chapter"]
                    )
                ).map((material) => _.omit(material.toObject(), hiddenFields));
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, unmappedResult] =
                    await this.materialService.getPaginated(
                        query,
                        {
                            __v: 0,
                            resource: 0,
                            createdBy: 0,
                            createdAt: 0,
                            lastUpdatedAt: 0,
                        },
                        ["subject", "chapter"],
                        pageSize,
                        pageNumber
                    );
                const result = unmappedResult.map((material) =>
                    _.omit(material.toObject(), hiddenFields)
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
}
