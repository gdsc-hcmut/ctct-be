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
} from "../services/index";
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { FilterQuery, Types } from "mongoose";
import { toNumber } from "lodash";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import { MaterialDocument } from "../models/material.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

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
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.get(
            "/:docId",
            authService.authenticate(false),
            this.getById.bind(this)
        );
        this.router.get(
            "/download/:docId",
            authService.authenticate(false),
            this.download.bind(this)
        );
        this.router.get(
            "/",
            authService.authenticate(false),
            this.getAvailable.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
        this.router.post("/", fileUploader.any(), this.create.bind(this));
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

            if (
                await this.materialService.materialWithSubjectChapterExists(
                    subject,
                    chapter
                )
            ) {
                throw new Error(`This chapter already exists`);
            }

            const fileValidator = new UploadValidator(
                new MaterialUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            const doc = await this.materialService.create(
                name,
                description,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            res.composer.success(doc);
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
            if (
                !(await canPerform(Permission.VIEW_MATERIAL)) &&
                !(await canPerform(Permission.ADMIN_VIEW_MATERIAL))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getByIdPopulated(docId, [
                "subject",
                "chapter",
            ]);

            if (!doc) {
                throw new Error(`Document not found`);
            }

            res.composer.success(doc);
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
            if (
                !(await canPerform(Permission.VIEW_MATERIAL)) &&
                !(await canPerform(Permission.ADMIN_VIEW_MATERIAL))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getById(docId);

            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource
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
            if (
                !(await canPerform(Permission.VIEW_MATERIAL)) &&
                !(await canPerform(Permission.ADMIN_VIEW_MATERIAL))
            ) {
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
                const result = await this.materialService.getPopulated(query, [
                    "subject",
                    "chapter",
                ]);
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.materialService.getPaginated(
                    query,
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

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getById(docId);

            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }

            const info = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "chapter",
            ]);

            if (info.chapter) {
                info.chapter = toNumber(info.chapter);
            }
            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
            }
            if (info.chapter) {
                info.chapter = new Types.ObjectId(info.chapter);
            }
            {
                const oldSubject = doc.subject,
                    newSubject: Types.ObjectId = info.subject ?? oldSubject;
                const oldChapter = doc.chapter,
                    newChapter: Types.ObjectId = info.chapter ?? oldChapter;
                if (
                    !(await this.chapterService.isChildOfSubject(
                        newChapter,
                        newSubject
                    ))
                ) {
                    throw new Error(
                        `The specified chapter doesn't belong to the specified subject`
                    );
                }
                const changedLocation =
                    !oldSubject.equals(newSubject) ||
                    !oldChapter.equals(newChapter);
                if (changedLocation) {
                    if (
                        await this.materialService.materialWithSubjectChapterExists(
                            newSubject,
                            newChapter
                        )
                    ) {
                        throw new Error(
                            `A material with the same subject and chapter already exists`
                        );
                    }
                }
            }

            const result = await this.materialService.editOneMaterial(
                docId,
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

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getById(docId);

            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
            }

            const result = await this.materialService.markAsDeleted(docId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
