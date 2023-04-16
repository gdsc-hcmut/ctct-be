import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { UserService, AuthService } from "../services";
import { ErrorNotFound } from "../lib/errors";
import { fileUploader } from "../upload-storage";
import { FileUploadService } from "../services/file-upload.service";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { Types } from "mongoose";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous-exams";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        this.router.post(
            "/upload",
            fileUploader.any(),
            this.uploadPreviousExam.bind(this)
        );
        this.router.get("/getexam/:fileId", this.getPreviousExam.bind(this));
    }

    async uploadPreviousExam(req: Request, res: Response) {
        try {
            const files = await this.fileUploadService.uploadFiles(
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );
            res.composer.success(files);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getPreviousExam(req: Request, res: Response) {
        try {
            const fileId = new Types.ObjectId(req.params.fileId);
            const file = await this.fileUploadService.downloadFile(fileId);
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
}
