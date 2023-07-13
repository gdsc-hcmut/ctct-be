import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    QuestionTemplateService,
    QuizService,
    QuizTemplateService,
    SubjectService,
} from "../services/index";
import { Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import _ from "lodash";

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
        @inject(ServiceType.Quiz) private quizService: QuizService
    ) {
        super();

        this.router.get("/limited", authService.authenticate(false));

        this.router.all("*", authService.authenticate());

        this.router.post("/", this.create.bind(this));
        this.router.patch("/:quizTemplateId", this.edit.bind(this));
        this.router.delete("/:quizTemplateId", this.delete.bind(this));
        this.router.get("/full", this.getAllQuizTemplates.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;
            const userId = req.tokenMeta.userId;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.CREATE_QUIZ_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            req.body = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "visibleTo",
                "duration",
                "potentialQuestions",
                "sampleSize",
            ]);
            const [subject, levels, questions, sampleSize] = [
                req.body.subject as Types.ObjectId,
                (req.body.visibleTo as string[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                (req.body.potentialQuestions as any[]).map((x) => ({
                    questionId: new Types.ObjectId(x.questionId),
                    point: x.point as number[],
                    attempts: x.attempts as number,
                })),
                req.body.sampleSize as number,
            ];
            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
            }
            if (!(await this.accessLevelService.accessLevelsExist(levels))) {
                throw new Error(`One or more access levels does not exist`);
            }
            if (sampleSize <= 0 || sampleSize > questions.length) {
                throw new Error(`Sample size is invalid`);
            }
            if (
                !(await this.questionTemplateService.questionTemplatesExist(
                    questions.map((question) => question.questionId)
                ))
            ) {
                throw new Error(`One or more questions does not exist`);
            }
            // check that for all questions, the points provided must be of same length as the subquestion count
            // and that all points are non-negative
            const pointCondition = await Promise.all(
                questions.map((question) =>
                    (async () => {
                        const questionTemplate =
                            await this.questionTemplateService.findById(
                                question.questionId
                            );
                        return (
                            questionTemplate.questions.length ===
                                question.point.length &&
                            question.point.every((x) => x >= 0)
                        );
                    })()
                )
            );
            if (!pointCondition.every((x) => x)) {
                throw new Error(
                    `Point and number of subquestions must be the same for each question, and every point must be non-negative`
                );
            }
            // check that number of attempts for each question is positive
            if (!questions.every((question) => question.attempts > 0)) {
                throw new Error(`Number of attempts must be positive`);
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
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.EDIT_QUIZ_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );
            const quizTemplate = await this.quizTemplateService.findOne({
                _id: quizTemplateId,
                deletedAt: { $exists: false },
            });
            if (!quizTemplate) {
                throw new Error(`Quiz template not found`);
            }

            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    req.tokenMeta.accessLevels,
                    quizTemplate.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            req.body = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "visibleTo",
                "duration",
                "potentialQuestions",
                "sampleSize",
            ]);
            const [subject, levels, questions, sampleSize] = [
                req.body.subject as Types.ObjectId,
                (req.body.visibleTo as string[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                (req.body.potentialQuestions as any[]).map((x) => ({
                    questionId: new Types.ObjectId(x.questionId),
                    point: x.point as number[],
                    attempts: x.attempts as number,
                })),
                req.body.sampleSize as number,
            ];
            if (!(await this.subjectService.subjectExists(subject))) {
                throw new Error(`Subject doesn't exist`);
            }
            if (!(await this.accessLevelService.accessLevelsExist(levels))) {
                throw new Error(`One or more access levels does not exist`);
            }
            if (sampleSize <= 0 || sampleSize > questions.length) {
                throw new Error(`Sample size is invalid`);
            }
            if (
                !(await this.questionTemplateService.questionTemplatesExist(
                    questions.map((question) => question.questionId)
                ))
            ) {
                throw new Error(`One or more questions does not exist`);
            }
            // check that for all questions, the points provided must be of same length as the subquestion count
            // and that all points are non-negative
            const pointCondition = await Promise.all(
                questions.map((question) =>
                    (async () => {
                        const questionTemplate =
                            await this.questionTemplateService.findById(
                                question.questionId
                            );
                        return (
                            questionTemplate.questions.length ===
                                question.point.length &&
                            question.point.every((x) => x >= 0)
                        );
                    })()
                )
            );
            if (!pointCondition.every((x) => x)) {
                throw new Error(
                    `Point and number of subquestions must be the same for each question, and every point must be non-negative`
                );
            }
            // check that number of attempts for each question is positive
            if (!questions.every((question) => question.attempts > 0)) {
                throw new Error(`Number of attempts must be positive`);
            }

            const result = await this.quizTemplateService.findOneAndUpdate(
                { _id: quizTemplateId },
                { ...req.body },
                { new: true }
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAllQuizTemplates(req: Request, res: Response) {
        try {
            const userAccessLevels = req.tokenMeta?.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_FULL_QUIZ_TEMPLATE,
                    req.tokenMeta?.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const result = (
                await this.quizTemplateService.find({
                    deletedAt: { $exists: false },
                })
            ).filter((quizTemplate) =>
                this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    quizTemplate.visibleTo,
                    req.tokenMeta?.isManager
                )
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
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.DELETE_QUIZ_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );
            const quizTemplate = await this.quizTemplateService.findOne({
                _id: quizTemplateId,
                deletedAt: { $exists: false },
            });
            if (!quizTemplate) {
                throw new Error(`Quiz template not found`);
            }

            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    req.tokenMeta.accessLevels,
                    quizTemplate.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
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
