import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services";
import { PreviousExamService } from "../services/previous-exams.service";
import { fileUploader } from "../upload-storage";
import { FileUploadService } from "../services/file-upload.service";
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
        private fileUploadService: FileUploadService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        this.router.post("/create", fileUploader.any(), this.create.bind(this));
        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId", this.download.bind(this));
        this.router.get("/get", this.getAvailablePreviousExams.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;

            if (!userMayUploadPreviousExam(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have the permission required to upload a previous exam`
                );
            }
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }

            const fileValidator = new UploadValidator(
                new PreviousExamUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            // TODO: validate tags

            const doc = await this.previousExamService.create(
                name,
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
            const doc = await this.previousExamService.findOne(docId);
            if (!doc) {
                throw new Error(`Document not found`);
            }
            if (!doc.readAccess.includes(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have permission to access this document`
                );
            }
            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.findOnePopulated(
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
