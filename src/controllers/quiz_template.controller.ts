import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionTemplateService,
    QuizTemplateService,
    SubjectService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import _ from "lodash";
import { QuizTemplateDocument } from "../models/quiz_template.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class QuizTemplateController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz_template";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/", this.create.bind(this));
        this.router.patch("/:quizTemplateId", this.edit.bind(this));
        this.router.delete("/:quizTemplateId", this.delete.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.AMDIN_CREATE_QUIZ_TEMPLATE))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            req.body = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "chapter",
                "duration",
                "potentialQuestions",
                "sampleSize",
            ]);
            const [subject, chapter, questions, sampleSize] = [
                new Types.ObjectId(req.body.subject),
                new Types.ObjectId(req.body.chapter),
                (req.body.potentialQuestions as any[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                req.body.sampleSize as number,
            ];
            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
            }
            if (
                !(await this.chapterService.chapterIsChildOfSubject(
                    chapter,
                    subject
                ))
            ) {
                throw new Error(
                    `Chapter does not exist or is not a child of the subject`
                );
            }
            // check that all questions are unique
            const duplicateQuestions = questions.some((x, i) =>
                questions.some((y, j) => x.equals(y) && i !== j)
            );
            if (duplicateQuestions) {
                throw new Error(`One or more questions are duplicated`);
            }
            if (sampleSize <= 0 || sampleSize > questions.length) {
                throw new Error(`Sample size is invalid`);
            }
            if (
                !(await this.questionTemplateService.questionTemplatesExist(
                    questions
                ))
            ) {
                throw new Error(`One or more questions does not exist`);
            }

            const result = await this.quizTemplateService.create(
                userId,
                req.body
            );
            res.composer.success(result);
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
            if (!(await canPerform(Permission.ADMIN_EDIT_QUIZ_TEMPLATE))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );
            const quizTemplate =
                await this.quizTemplateService.getQuizTemplateById(
                    quizTemplateId
                );

            if (!quizTemplate) {
                throw new Error(`Quiz template not found`);
            }

            req.body = _.pick(req.body, [
                "name",
                "description",
                "duration",
                "potentialQuestions",
                "sampleSize",
            ]);
            const [questions, sampleSize] = [
                (req.body.potentialQuestions as any[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                req.body.sampleSize as number,
            ];
            if (sampleSize <= 0 || sampleSize > questions.length) {
                throw new Error(`Sample size is invalid`);
            }
            if (
                !(await this.questionTemplateService.questionTemplatesExist(
                    questions
                ))
            ) {
                throw new Error(`One or more questions does not exist`);
            }

            const result = await this.quizTemplateService.editOneQuizTemplate(
                quizTemplateId,
                req.body
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (
                !(await canPerform(Permission.VIEW_QUIZ_TEMPLATE)) &&
                !(await canPerform(Permission.ADMIN_VIEW_QUIZ_TEMPLATE))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<QuizTemplateDocument> = {};

            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = await this.quizTemplateService.getPopulated(
                    query,
                    ["subject", "chapter"]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] =
                    await this.quizTemplateService.getPaginated(
                        query,
                        ["subject", "chapter"],
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

    async delete(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.ADMIN_DELETE_QUIZ_TEMPLATE))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );
            const quizTemplate =
                await this.quizTemplateService.getQuizTemplateById(
                    quizTemplateId
                );

            if (!quizTemplate) {
                throw new Error(`Quiz template not found`);
            }

            // if we delete a quiz template, all quizzes that were created from it
            // still exist, and can be viewed by the user
            const result = await this.quizTemplateService.markAsDeleted(
                quizTemplateId
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
