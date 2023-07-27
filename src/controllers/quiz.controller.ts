import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    MapperService,
    QuestionTemplateService,
    QuizService,
    QuizTemplateService,
    SocketService,
    TaskSchedulingService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { QuizDocument, QuizStatus } from "../models/quiz.model";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { EndQuizTask } from "../services/task-scheduling/tasks/end_quiz_task";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class QuizController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Mapper) private mapperService: MapperService,

        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.Socket) private socketService: SocketService,
        @inject(ServiceType.TaskScheduling)
        private taskSchedulingService: TaskSchedulingService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.get("/", this.getMy.bind(this));
        this.router.get("/:quizId", this.getById.bind(this));
        this.router.post("/:quizTemplateId", this.take.bind(this));
        this.router.post("/save/:quizId", this.saveAnswers.bind(this));
        this.router.post("/end/:quizId", this.endQuiz.bind(this));
    }

    async take(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );

            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            if (!(await canPerform(Permission.TAKE_QUIZ))) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            if (
                await this.quizService.userHasUnfinishedQuiz(
                    userId,
                    quizTemplateId
                )
            ) {
                throw new Error(
                    `You have not finished this quiz, and cannot take a new one`
                );
            }

            const quizTemplate =
                await this.quizTemplateService.getQuizTemplateById(
                    quizTemplateId
                );

            if (!quizTemplate) {
                throw new Error(
                    `This quiz does not exist or has been configured to be hidden from you`
                );
            }

            const potentialQuestions = _.sampleSize(
                quizTemplate.potentialQuestions,
                quizTemplate.sampleSize
            );
            const concreteQuestions = await Promise.all(
                potentialQuestions.map((questionId) =>
                    (async () => {
                        const questionTemplate =
                            await this.questionTemplateService.getById(
                                questionId
                            );
                        console.debug(questionTemplate);
                        return this.questionTemplateService.generateConcreteQuestion(
                            questionTemplate
                        );
                    })()
                )
            );

            const startTime = Date.now();
            const quizDeadline = startTime + quizTemplate.duration;

            const quiz = await this.quizService.create(
                userId,
                QuizStatus.ONGOING,
                quizTemplate.duration,
                startTime,
                quizTemplateId,
                concreteQuestions
            );
            // schedule a task to end this quiz
            logger.debug(
                `Scheduling quiz ${quiz._id} to start at ${new Date(
                    startTime
                ).toString()} and end at ${new Date(quizDeadline).toString()}`
            );
            await this.taskSchedulingService.schedule(
                new Date(quizDeadline),
                ScheduledTaskType.END_QUIZ,
                {
                    userId: userId,
                    quizId: quiz._id,
                }
            );

            const result =
                this.mapperService.adjustQuizDocumentAccordingToStatus(quiz);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getMy(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;

            const query: FilterQuery<QuizDocument> = {
                userId: userId,
            };
            if (req.query.name) {
                query.fromTemplate.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.fromTemplate.subject = new Types.ObjectId(
                    req.query.subject as string
                );
            }
            if (req.query.chapter) {
                query.fromTemplate.chapter = new Types.ObjectId(
                    req.query.chapter as string
                );
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = await this.quizService.getPopulated(query, [
                    "fromTemplate",
                    "fromTemplate.subject",
                    "fromTemplate.chapter",
                ]);
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.quizService.getPaginated(
                    query,
                    [
                        "fromTemplate",
                        "fromTemplate.subject",
                        "fromTemplate.chapter",
                    ],
                    pageSize,
                    pageNumber
                );
                const adjustedResult = (result as any[]).map((quiz) =>
                    this.mapperService.adjustQuizDocumentAccordingToStatus(quiz)
                );

                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result: adjustedResult,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);
            const quiz = await this.quizService.getOneQuizOfUserExpanded(
                userId,
                quizId
            );
            if (!quiz) {
                throw new Error(`Quiz doesn't exist`);
            }

            const result =
                this.mapperService.adjustQuizDocumentAccordingToStatus(
                    quiz as any
                );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async saveAnswers(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);
            const answers = req.body.answers as any[];
            if (!answers) {
                throw new Error(`Missing 'answers' field`);
            }

            const quiz = await this.quizService.getUserOngoingQuizById(
                quizId,
                userId
            );

            if (!quiz) {
                throw new Error(`Quiz doesn't exist or has ended`);
            }

            quiz.questions.forEach((question, index) => {
                this.questionTemplateService.attachUserAnswerToQuestion(
                    question,
                    answers[index]
                );
            });
            quiz.markModified("questions");
            await quiz.save();
            res.composer.success(
                this.mapperService.adjustQuizDocumentAccordingToStatus(quiz)
            );
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async endQuiz(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);
            const answers = req.body.answers as any[];
            if (!answers) {
                throw new Error(`Missing 'answers' field`);
            }

            const quiz = await this.quizService.getUserOngoingQuizById(
                quizId,
                userId
            );

            if (!quiz) {
                throw new Error(`Quiz doesn't exist or has ended`);
            }

            quiz.questions.forEach((question, index) => {
                this.questionTemplateService.attachUserAnswerToQuestion(
                    question,
                    answers[index]
                );
            });
            quiz.markModified("questions");
            await quiz.save();

            const result = await new EndQuizTask(
                userId,
                quizId,
                this.quizService,
                this.socketService,
                this.taskSchedulingService,
                this.questionTemplateService
            ).execute();

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
