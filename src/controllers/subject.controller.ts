import { id, inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    SubjectService,
    MaterialService,
    PreviousExamService,
    AccessLevelService,
    QuestionTemplateService,
    QuizTemplateService,
    ChapterService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { logger } from "../lib/logger";
import { SubjectDocument } from "../models/subject.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class SubjectController extends Controller {
    public readonly router = Router();
    public readonly path = "/subject";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.get("/", this.getAll.bind(this));

        this.router.all("*", authService.authenticate());
        this.router.post("/", this.create.bind(this));
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.ADMIN_CREATE_SUBJECT))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const { userId } = req.tokenMeta;
            const { name, description = "" } = req.body;

            if (!name) {
                throw new Error(`Missing 'name' field`);
            }

            const doc = await this.subjectService.create(
                name,
                userId,
                description
            );
            res.composer.success(doc);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const query: FilterQuery<SubjectDocument> = {};
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

            const [total, result] = await this.subjectService.getPaginated(
                query,
                [],
                pageSize,
                pageNumber
            );
            res.composer.success({
                total,
                pageCount: Math.ceil(total / pageSize),
                pageSize,
                result,
            });
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
            if (!(await canPerform(Permission.ADMIN_EDIT_SUBJECT))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.subjectService.getSubjectById(docId);

            if (!doc) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            const info = _.pick(req.body, ["name", "description"]);

            const result = await this.subjectService.editOneSubject(
                docId,
                info,
                {
                    new: true,
                }
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
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.ADMIN_DELETE_SUBJECT))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const sub = await this.subjectService.getSubjectById(docId);

            if (!sub) {
                throw new Error(`Subject doesn't exist or has been deleted`);
            }

            // check if anything holds a reference to this subject
            const [
                materialWithThisSubject,
                previousExamWithThisSubject,
                questionTemplateWithThisSubject,
                quizTemplateWithThisSubject,
                chapterWithThisSubject,
            ] = await Promise.all([
                this.materialService.materialWithSubjectExists(docId),
                this.previousExamService.previousExamWithSubjectExists(docId),
                this.questionTemplateService.questionTemplateWithSubjectExists(
                    docId
                ),
                this.quizTemplateService.quizTemplateWithSubjectExists(docId),
                this.chapterService.chapterWithSubjectExists(docId),
            ]);
            if (materialWithThisSubject) {
                throw new Error(
                    `There are still materials that belong to this subject. Please delete them first`
                );
            }
            if (previousExamWithThisSubject) {
                throw new Error(
                    `There are still previous exams that belong to this subject. Please delete them first`
                );
            }
            if (questionTemplateWithThisSubject) {
                throw new Error(
                    `There are still question templates that belong to this subject. Please delete them first`
                );
            }
            if (quizTemplateWithThisSubject) {
                throw new Error(
                    `There are still quiz templates that belong to this subject. Please delete them first`
                );
            }
            if (chapterWithThisSubject) {
                throw new Error(
                    `There are still chapters that belong to this subject. Please delete them first`
                );
            }

            const result = await this.subjectService.markAsDeleted(docId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
