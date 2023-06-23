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
import mongoose, { Types } from "mongoose";
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

        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId", this.download.bind(this));
        this.router.get("/get", this.getAvaliableMaterial.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.patch("/edit/:docId", this.editMaterial.bind(this));
        this.router.delete("/delete/:docId", this.deleteById.bind(this));
        this.router.post("/create", fileUploader.any(), this.create.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject, chapter, subtitle, description } = req.body;
            if (!subtitle) subtitle = "";
            if (!description) description = "";

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
            if (!subject) {
                throw new Error(`Missing 'subject' field`);
            }
            if (!chapter) {
                throw new Error(`Missing 'chapter' field`);
            }
            subject = new Types.ObjectId(subject);
            chapter = toNumber(chapter);

            if (!(await this.subjectService.findById(subject))) {
                throw new Error(`Subject doesn't exist`);
            }

            if (
                await this.materialService.findOne({
                    subject: subject,
                    chapter: chapter,
                })
            ) {
                throw new Error(`This chapter already exists`);
            }

            const fileValidator = new UploadValidator(
                new MaterialUploadValidation()
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
            const doc = await this.materialService.create(
                name,
                subtitle,
                description,
                subject,
                chapter,
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
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
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
                await this.materialService.find({
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
                    Permission.VIEW_MATERIAL,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
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

    async getAvaliableMaterial(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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

            const ans = (await this.materialService.find({})).filter((d) =>
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

    async editMaterial(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
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
            const doc = await this.materialService.findOne({
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
                "chapter",
                "visibleTo",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
                if (!(await this.subjectService.findById(info.subject))) {
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
                    !(await this.accessLevelService.accessLevelsExist(
                        info.visibleTo
                    ))
                ) {
                    throw new Error(`One or more access levels don't exist`);
                }
            }
            // subject must be empty or valid, so we check if it collides with any other document
            const changedLoc =
                (info.subject && info.subject != doc.subject) ||
                (info.chapter && info.chapter != doc.chapter);
            if (changedLoc) {
                const nSubject = info.subject ? info.subject : doc.subject;
                const nChapter = info.chapter ? info.chapter : doc.chapter;
                if (
                    await this.materialService.findOne({
                        subject: nSubject,
                        chapter: nChapter,
                    })
                ) {
                    throw new Error(
                        `A document with the same subject and chapter id already exists`
                    );
                }
            }

            await this.materialService.findOneAndUpdate(
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
                    Permission.DELETE_MATERIAL,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
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

            await this.materialService.deleteById(docId);
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
