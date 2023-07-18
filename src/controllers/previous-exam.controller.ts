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
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { PreviousExamUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import mongoose, { Types } from "mongoose";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous-exams";

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
        this.router.post("/", fileUploader.any(), this.create.bind(this));
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const {
                name,
                subject: subjectString,
                subtitle = "",
                description = "",
            } = req.body;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    req.tokenMeta.accessLevels,
                    Permission.UPLOAD_PREVIOUS_EXAM,
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
            const subject = new Types.ObjectId(subjectString);

            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
            }

            const fileValidator = new UploadValidator(
                new PreviousExamUploadValidation()
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

            const doc = await this.previousExamService.create(
                name,
                subtitle,
                description,
                subject,
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
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getPreviousExamById(
                docId
            );

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
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = (
                await this.previousExamService.getPreviousExamBySubject(subject)
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
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getPreviousExamById(
                docId
            );

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
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const ans = (
                await this.previousExamService.getAllPreviousExam()
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

    async edit(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.EDIT_PREVIOUS_EXAM,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const doc = await this.previousExamService.getPreviousExamById(
                docId
            );

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
                "subtitle",
                "description",
                "subject",
                "visibleTo",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
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
            if (info.subject) {
                const subject = new Types.ObjectId(info.subject);
                if (!this.subjectService.subjectExists(subject)) {
                    throw new Error(`Subject doesn't exist`);
                }
            }

            const result = await this.previousExamService.editOnePreviousExam(
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
                    Permission.DELETE_PREVIOUS_EXAM,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getPreviousExamById(
                docId
            );

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

            const result = await this.previousExamService.markAsDeleted(docId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
