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
} from "../services/index";
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { Types } from "mongoose";
import { toNumber } from "lodash";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";

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
        private accessLevelService: AccessLevelService
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
        this.router.get(
            "/subject/:subjectId",
            authService.authenticate(false),
            this.getBySubject.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
        this.router.post("/", fileUploader.any(), this.create.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const {
                name,
                subject: subjectString,
                chapter: chapterNumber,
                description = "",
            } = req.body;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    req.tokenMeta.accessLevels,
                    Permission.UPLOAD_MATERIAL,
                    req.tokenMeta.isManager
                ))
            ) {
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
            if (!chapterNumber) {
                throw new Error(`Missing 'chapter' field`);
            }
            const subject = new Types.ObjectId(subjectString);
            const chapter = toNumber(chapterNumber);

            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
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

            if (!req.body.visibleTo) {
                throw new Error(`Missing 'visibleTo' field`);
            }
            const visibleTo = (JSON.parse(req.body.visibleTo) as string[]).map(
                (x) => new Types.ObjectId(x)
            );
            if (
                !(await this.accessLevelService.checkAccessLevelsExist(
                    visibleTo
                ))
            ) {
                throw new Error(`One or more access levels does not exist`);
            }

            const doc = await this.materialService.create(
                name,
                description,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression(),
                visibleTo
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
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getMaterialById(docId);

            if (!doc) {
                throw new Error(`Document not found`);
            }

            if (
                !this.accessLevelService.checkAllowedListOverlaps(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta?.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }
            res.composer.success(doc);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getBySubject(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }
            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = (
                await this.materialService.getMaterialBySubject(subject)
            ).filter((d) =>
                this.accessLevelService.checkAllowedListOverlaps(
                    userAccessLevels,
                    d.visibleTo,
                    req.tokenMeta?.isManager
                )
            );
            res.composer.success(ans);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getMaterialById(docId);

            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }

            if (
                !this.accessLevelService.checkAllowedListOverlaps(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta?.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
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
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const ans = (await this.materialService.getAllMaterial()).filter(
                (d) =>
                    this.accessLevelService.checkAllowedListOverlaps(
                        userAccessLevels,
                        d.visibleTo,
                        req.tokenMeta?.isManager
                    )
            );
            res.composer.success(ans);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.EDIT_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getMaterialById(docId);

            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }

            if (
                !this.accessLevelService.checkAllowedListOverlaps(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            const info = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "chapter",
                "visibleTo",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
                if (!(await this.subjectService.subjectExists(info.subject))) {
                    throw new Error(`Subject doesn't exist`);
                }
            }
            if (info.chapter) {
                info.chapter = toNumber(info.chapter);
            }
            if (info.visibleTo) {
                info.visibleTo = (info.visibleTo as string[]).map(
                    (x) => new Types.ObjectId(x)
                );
                if (
                    !(await this.accessLevelService.checkAccessLevelsExist(
                        info.visibleTo
                    ))
                ) {
                    throw new Error(`One or more access levels don't exist`);
                }
            }
            // subject must be empty or valid, so we check if it collides with any other document
            const changedSubjectOrChapter =
                (info.subject && info.subject != doc.subject) ||
                (info.chapter && info.chapter != doc.chapter);
            if (changedSubjectOrChapter) {
                const newSubject = info.subject ?? doc.subject;
                const newChapter = info.chapter ?? doc.chapter;
                if (
                    await this.materialService.materialWithSubjectChapterExists(
                        newSubject,
                        newChapter
                    )
                ) {
                    throw new Error(
                        `A document with the same subject and chapter already exists`
                    );
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
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.DELETE_MATERIAL,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.getMaterialById(docId);

            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
            }

            if (
                !this.accessLevelService.checkAllowedListOverlaps(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
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
