import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { UserRole } from "../models/user.model";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services";
import { SubjectService } from "../services/subject.service";
import { MaterialService } from "../services/material.service";
import { FileUploadService } from "../services/file-upload.service";
import { fileUploader } from "../upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { userMayUploadMaterial } from "../models/user.model";
import { Types } from "mongoose";
import { toNumber } from "lodash";
import _ from "lodash";

@injectable()
export class MaterialController extends Controller {
    public readonly router = Router();
    public readonly path = "/material";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        this.router.post("/create", fileUploader.any(), this.create.bind(this));
        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId/:index", this.download.bind(this));
        this.router.get("/get", this.getAvaliableMaterial.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );

        this.router.patch("/edit/:docId", this.editMaterial.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject, chapter } = req.body;

            if (!userMayUploadMaterial(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have the permission required to upload material`
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
            const doc = await this.materialService.create(
                name,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
                _id: docId,
                readAccess: req.tokenMeta.role,
            });
            if (!doc) {
                throw new Error(`Document not found`);
            }
            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getBySubject(req: Request, res: Response) {
        try {
            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = await this.materialService.find({
                subject: subject,
                readAccess: req.tokenMeta.role,
            });
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const index = toNumber(req.params.index);
            const doc = await this.materialService.findOne({
                _id: docId,
                readAccess: req.tokenMeta.role,
            });
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }
            if (index < 0 || index >= doc.resource.length) {
                throw new Error(`Invalid index`);
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource[index]
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${file.originalName}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAvaliableMaterial(req: Request, res: Response) {
        try {
            const role = req.tokenMeta.role;
            const ans = await this.materialService.find({
                readAccess: role,
            });
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async editMaterial(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const userRole = req.tokenMeta.role;
            const doc = await this.materialService.findOne({
                _id: docId,
                writeAccess: userRole,
            });
            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }

            const info = _.pick(req.body, [
                "name",
                "subject",
                "chapter",
                "readAccess",
                "writeAccess",
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
            if (info.readAccess) {
                const ra: UserRole[] = info.readAccess;
                if (!ra.every((r) => Object.values(UserRole).includes(r))) {
                    throw new Error(`Read access contains unrecognized role`);
                }
                if (
                    doc.readAccess.includes(userRole) &&
                    !ra.includes(userRole)
                ) {
                    throw new Error(
                        `You cannot remove your own role's read access to this document`
                    );
                }
            }
            if (info.writeAccess) {
                const wa: UserRole[] = info.writeAccess;
                if (!wa.every((r) => Object.values(UserRole).includes(r))) {
                    throw new Error(`Write access contains unrecognized role`);
                }
                if (
                    doc.writeAccess.includes(userRole) &&
                    !wa.includes(userRole)
                ) {
                    throw new Error(
                        `You cannot remove your own role's write access to this document`
                    );
                }
            }
            // subject must be empty or valid, so we check if it collides with any other document
            const changedLoc =
                (info.subject && info.subject != doc.subject) ||
                (info.chapter && info.chapter != doc.chapter);
            if (changedLoc) {
                const nSubject = info.subject ? info.subject : doc.subject;
                const nChapter = info.chapter ? info.chapter : doc.chapter;
                console.log(
                    await this.materialService.find({
                        subject: nSubject,
                        chapter: nChapter,
                    })
                );
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
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
