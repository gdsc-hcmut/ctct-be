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

        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId", this.download.bind(this));
        this.router.get("/get", this.getAvailablePreviousExams.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.post("/create", fileUploader.any(), this.create.bind(this));
        this.router.patch("/edit/:docId", this.editPreviousExam.bind(this));
        this.router.delete("/delete/:docId", this.deleteById.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject, subtitle, description } = req.body;
            if (!subtitle) subtitle = "";
            if (!description) description = "";

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
            if (!subject) {
                throw new Error(`Missing 'subject' field`);
            }
            subject = new Types.ObjectId(subject);

            if (!(await this.subjectService.findById(subject))) {
                throw new Error(`Subject doesn't exist`);
            }

            const fileValidator = new UploadValidator(
                new PreviousExamUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            await this.subjectService.findOneAndUpdate(
                { _id: subject },
                {
                    lastUpdatedAt: Date.now(),
                }
            );
            const allAccessLevels = (
                await this.accessLevelService.findAccessLevels({})
            ).map((d) => d._id as Types.ObjectId);
            const doc = await this.previousExamService.create(
                name,
                subtitle,
                description,
                subject,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression(),
                allAccessLevels
            );

            res.composer.success(doc);
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

    async getById(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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
            const doc = await this.previousExamService.findOne({
                _id: docId,
            });
            if (!doc) {
                throw new Error(`Document not found`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }
            res.composer.success(doc);
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

    async getBySubject(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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
                await this.previousExamService.find({
                    subject: subject,
                })
            ).filter((d) =>
                this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    d.visibleTo
                )
            );
            res.composer.success(ans);
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

    async download(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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
            const doc = await this.previousExamService.findOne({
                _id: docId,
            });
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo
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

    async getAvailablePreviousExams(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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

            const ans = (await this.previousExamService.find({})).filter((d) =>
                this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    d.visibleTo
                )
            );
            res.composer.success(ans);
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

    async editPreviousExam(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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

            const doc = await this.previousExamService.findOne({
                _id: docId,
            });
            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo
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
                    !(await this.accessLevelService.accessLevelsExist(
                        info.visibleTo
                    ))
                ) {
                    throw new Error(`One or more access levels don't exist`);
                }
            }
            if (info.subject) {
                const subject = new Types.ObjectId(info.subject);
                if (!this.subjectService.findById(subject)) {
                    throw new Error(`Subject doesn't exist`);
                }
            }

            await this.previousExamService.findOneAndUpdate(
                { _id: docId },
                {
                    ...info,
                    lastUpdatedAt: Date.now(),
                }
            );
            res.composer.success(true);
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

    async deleteById(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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
            const doc = await this.previousExamService.findOne({
                _id: docId,
            });
            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            await this.previousExamService.deleteById(docId);
            res.composer.success(true);
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
