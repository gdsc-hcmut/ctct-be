import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { UserRole } from "../models/user.model";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    PreviousExamService,
    FileUploadService,
    SubjectService,
    PermissionService,
} from "../services/index";
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { PreviousExamUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import mongoose, { Types } from "mongoose";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/permission.model";

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
        @inject(ServiceType.Permission)
        private permissionService: PermissionService
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
                !(await this.permissionService.rolesCanPerformAction(
                    req.tokenMeta.roles,
                    Permission.UPLOAD_PREVIOUS_EXAM
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
            const doc = await this.previousExamService.create(
                name,
                subtitle,
                description,
                subject,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            await session.commitTransaction();
            res.composer.success(doc);
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
            const userRoles: UserRole[] = req.tokenMeta
                ? req.tokenMeta.roles
                : [UserRole.STUDENT];

            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.VIEW_PREVIOUS_EXAM
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
                !this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
                    doc.visibleTo
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }
            await session.commitTransaction();
            res.composer.success(doc);
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
            const userRoles: UserRole[] = req.tokenMeta
                ? req.tokenMeta.roles
                : [UserRole.STUDENT];
            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.VIEW_PREVIOUS_EXAM
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
                this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
                    d.visibleTo
                )
            );
            await session.commitTransaction();
            res.composer.success(ans);
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
            const userRoles: UserRole[] = req.tokenMeta
                ? req.tokenMeta.roles
                : [UserRole.STUDENT];

            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.VIEW_PREVIOUS_EXAM
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
                !this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
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
            await session.commitTransaction();
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${file.originalName}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
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
            const userRoles: UserRole[] = req.tokenMeta
                ? req.tokenMeta.roles
                : [UserRole.STUDENT];

            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.VIEW_PREVIOUS_EXAM
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const ans = (await this.previousExamService.find({})).filter((d) =>
                this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
                    d.visibleTo
                )
            );
            await session.commitTransaction();
            res.composer.success(ans);
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
            const userRoles = req.tokenMeta.roles;

            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.EDIT_PREVIOUS_EXAM
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
                !this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
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
                // permissions can only be changed by ADMIN
                if (!userRoles.includes(UserRole.ADMIN)) {
                    throw new Error(
                        `Only role ${UserRole.ADMIN} can change permission of previous exams`
                    );
                }
                info.visibleTo = info.visibleTo as UserRole[];
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
            await session.commitTransaction();
            res.composer.success(true);
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
            const userRoles = req.tokenMeta.roles;

            if (
                !(await this.permissionService.rolesCanPerformAction(
                    userRoles,
                    Permission.DELETE_PREVIOUS_EXAM
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
                !this.permissionService.rolesOverlapWithAllowedList(
                    userRoles,
                    doc.visibleTo
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            await this.previousExamService.deleteById(docId);
            await session.commitTransaction();
            res.composer.success(true);
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
