import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Router } from "express";
import { logger } from "../../lib/logger";
import { Request, Response, ServiceType } from "../../types";
import { Permission } from "../../models/access_level.model";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    FileUploadService,
    MaterialService,
    SubjectService,
} from "../../services/index";
import { FilterQuery, Types } from "mongoose";
import { UploadValidator } from "../../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../../lib/upload-validator/upload-validator-strategies";
import { AgressiveFileCompression } from "../../lib/file-compression/strategies";
import { fileUploader } from "../../lib/upload-storage";
import _ from "lodash";
import { MaterialDocument } from "../../models/material.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";

@injectable()
export class AdminMaterialController extends Controller {
    public readonly router = Router();
    public readonly path = "/material";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService
    ) {
        super();

        this.router.all("*", this.authService.authenticate());

        this.router.post("/", fileUploader.any(), this.create.bind(this));
        this.router.patch("/:materialId", this.edit.bind(this));
        this.router.delete("/:materialId", this.delete.bind(this));

        this.router.get("/:materialId", this.getById.bind(this));
        this.router.get("/:materialId/download", this.download.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const {
                name,
                subject: subjectString,
                chapter: chapterString,
                description = "",
            } = req.body;

            const canUpload = await canPerform(
                Permission.ADMIN_UPLOAD_MATERIAL
            );
            if (!canUpload) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }
            if (!subjectString) {
                throw new Error(`Missing 'subject' field`);
            }
            if (!chapterString) {
                throw new Error(`Missing 'chapter' field`);
            }
            const subject = new Types.ObjectId(subjectString);
            const chapter = new Types.ObjectId(chapterString);

            const subjectExists = await this.subjectService.subjectExists(
                subject
            );
            if (!subjectExists) {
                throw new Error(`Subject doesn't exist`);
            }
            if (
                !(await this.chapterService.isChildOfSubject(chapter, subject))
            ) {
                throw new Error(
                    `Chapter doesn't exist or does not belong to this subject`
                );
            }

            const fileValidator = new UploadValidator(
                new MaterialUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            const material = await this.materialService.create(
                name,
                description,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            res.composer.success(material);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canEdit = await canPerform(Permission.ADMIN_EDIT_MATERIAL);
            if (!canEdit) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const materialId = new Types.ObjectId(req.params.materialId);
            const material = await this.materialService.getById(materialId);

            if (!material) {
                throw new Error(`The required material doesn't exist`);
            }

            const info = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "chapter",
                "isHidden",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
            }
            if (info.chapter) {
                info.chapter = new Types.ObjectId(info.chapter);
            }

            const result = await this.materialService.editOneMaterial(
                materialId,
                info
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canDelete = await canPerform(
                Permission.ADMIN_DELETE_MATERIAL
            );
            if (!canDelete) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const materialId = new Types.ObjectId(req.params.materialId);
            const material = await this.materialService.getById(materialId);

            if (!material) {
                throw new Error(`Requested material doesn't exist`);
            }

            const result = await this.materialService.markAsDeleted(materialId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_MATERIAL);
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
                },
                ["subject", "chapter"]
            );

            if (!material) {
                throw new Error(`Material not found`);
            }

            res.composer.success(material);
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
            const canView = await canPerform(Permission.ADMIN_VIEW_MATERIAL);
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

            if (req.query.pagination === "false") {
                const result = await this.materialService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    ["subject", "chapter"]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.materialService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    ["subject", "chapter"],
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

    async download(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_MATERIAL);
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
}
