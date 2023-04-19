import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services";
import { PreviousExamService } from "../services/previous-exams.service";
import { fileUploader } from "../upload-storage";
import { FileUploadService } from "../services/file-upload.service";
import { SubjectService } from "../services/subject.service";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { PreviousExamUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { userMayUploadPreviousExam } from "../models/user.model";
import { Types } from "mongoose";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous-exams";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService,
        @inject(ServiceType.Subject) private subjectService: SubjectService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        this.router.post("/create", fileUploader.any(), this.create.bind(this));
        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId", this.download.bind(this));
        this.router.get("/get", this.getAvailablePreviousExams.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject } = req.body;

            if (!userMayUploadPreviousExam(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have the permission required to upload a previous exam`
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

            await this.subjectService.update(subject, {
                lastUpdatedAt: Date.now(),
            });
            const doc = await this.previousExamService.create(
                name,
                subject,
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
            const doc = (
                await this.previousExamService.find({
                    _id: docId,
                    readAccess: req.tokenMeta.role,
                })
            )[0];
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
            const ans = await this.previousExamService.find({
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
            const doc = await this.previousExamService.findByIdPopulated(
                docId,
                "resource"
            );
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }
            if (!doc.readAccess.includes(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have permission to access this document`
                );
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource._id
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

    async getAvailablePreviousExams(req: Request, res: Response) {
        try {
            const role = req.tokenMeta.role;
            const ans = await this.previousExamService.find({
                readAccess: role,
            });
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
