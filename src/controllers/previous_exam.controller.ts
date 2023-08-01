import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    PreviousExamService,
    FileUploadService,
    SubjectService,
    AccessLevelService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import {
    PreviousExamDocument,
    PreviousExamType,
    Semester,
} from "../models/previous-exam.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import _ from "lodash";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous_exam";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));
        this.router.get("/:previousExamId", this.getById.bind(this));
        this.router.get("/:previousExamId/download", this.download.bind(this));
        this.router.get("/", this.getAvailable.bind(this));
    }

    async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_PREVIOUS_EXAM);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const previousExamId = new Types.ObjectId(
                req.params.previousExamId
            );
            const previousExam =
                await this.previousExamService.getByIdPopulated(
                    previousExamId,
                    {
                        __v: 0,
                        resource: 0,
                        createdBy: 0,
                        createdAt: 0,
                        lastUpdatedAt: 0,
                    },
                    ["subject"]
                );

            if (!previousExam) {
                throw new Error(`Previous exam not found`);
            }

            const result = _.omit(previousExam.toObject(), [
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
            const canView = await canPerform(Permission.VIEW_PREVIOUS_EXAM);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const previousExamId = new Types.ObjectId(
                req.params.previousExamId
            );
            const previousExam = await this.previousExamService.getById(
                previousExamId
            );

            if (!previousExam) {
                throw new Error(`Previous exam doesn't exist`);
            }

            const file = await this.fileUploadService.downloadFile(
                previousExam.resource
            );
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

    async getAvailable(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_PREVIOUS_EXAM);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<PreviousExamDocument> = {};

            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.semester) {
                query.semester = req.query.semester as Semester;
            }
            if (req.query.type) {
                query.type = req.query.type as PreviousExamType;
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
                    await this.previousExamService.getPopulated(
                        query,
                        {
                            __v: 0,
                            resource: 0,
                            createdBy: 0,
                            createdAt: 0,
                            lastUpdatedAt: 0,
                        },
                        ["subject"]
                    )
                ).map((previousExam) =>
                    _.omit(previousExam.toObject(), hiddenFields)
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, unmappedResult] =
                    await this.previousExamService.getPaginated(
                        query,
                        {
                            __v: 0,
                            resource: 0,
                            createdBy: 0,
                            createdAt: 0,
                            lastUpdatedAt: 0,
                        },
                        ["subject"],
                        pageSize,
                        pageNumber
                    );

                const result = unmappedResult.map((previousExam) =>
                    _.omit(previousExam.toObject(), hiddenFields)
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
