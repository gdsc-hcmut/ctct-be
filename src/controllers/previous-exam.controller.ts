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
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import {
    PreviousExamDocument,
    PreviousExamType,
    Semester,
} from "../models/previous-exam.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous-exam";

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

        this.router.all("*", authService.authenticate());
        this.router.post("/", fileUploader.any(), this.create.bind(this));
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name, subject: subjectString, description = "" } = req.body;

            const semester = req.body.semester as Semester;
            if (!semester || !Object.values(Semester).includes(semester)) {
                throw new Error(`Invalid semester`);
            }

            const type = req.body.type as PreviousExamType;
            if (!type || !Object.values(PreviousExamType).includes(type)) {
                throw new Error(`Invalid type`);
            }

            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.ADMIN_UPLOAD_PREVIOUS_EXAM))) {
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

            const doc = await this.previousExamService.create(
                name,
                description,
                subject,
                semester,
                type,
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
                !(await canPerform(Permission.VIEW_PREVIOUS_EXAM)) &&
                !(await canPerform(Permission.ADMIN_VIEW_PREVIOUS_EXAM))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getByIdPopulated(docId, [
                "subject",
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
                !(await canPerform(Permission.VIEW_PREVIOUS_EXAM)) &&
                !(await canPerform(Permission.ADMIN_VIEW_PREVIOUS_EXAM))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getById(docId);

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
                !(await canPerform(Permission.VIEW_PREVIOUS_EXAM)) &&
                !(await canPerform(Permission.ADMIN_VIEW_PREVIOUS_EXAM))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<PreviousExamDocument> = {};

            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.semester) {
                query.semester = req.query.semester as Semester;
            }
            if (req.query.type) {
                query.type = req.query.type as PreviousExamType;
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
                const result = await this.previousExamService.getPopulated(
                    query,
                    ["subject"]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] =
                    await this.previousExamService.getPaginated(
                        query,
                        ["subject"],
                        pageSize,
                        pageNumber
                    );
                res.composer.success({
                    total,
                    pageCount: Math.ceil(total / pageSize),
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
            if (!(await canPerform(Permission.ADMIN_EDIT_PREVIOUS_EXAM))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getById(docId);

            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }

            const info = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "semester",
                "type",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
            }
            if (info.subject) {
                const subject = new Types.ObjectId(info.subject);
                if (!this.subjectService.subjectExists(subject)) {
                    throw new Error(`Subject doesn't exist`);
                }
            }
            if (info.semester) {
                info.semester = info.semester as Semester;
                if (!Object.values(Semester).includes(info.semester)) {
                    throw new Error(`Invalid semester`);
                }
            }
            if (info.type) {
                info.type = info.type as PreviousExamType;
                if (!Object.values(PreviousExamType).includes(info.type)) {
                    throw new Error(`Invalid type`);
                }
            }

            const result = await this.previousExamService.editOne(docId, info);
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
            if (!(await canPerform(Permission.ADMIN_DELETE_PREVIOUS_EXAM))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.getById(docId);

            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
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
