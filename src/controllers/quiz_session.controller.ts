import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    MapperService,
    QuestionService,
    QuizService,
    QuizSessionService,
    SocketService,
    TaskSchedulingService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { QuizSessionDocument } from "../models/quiz_session.model";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { EndQuizTask } from "../services/task-scheduling/tasks/end_quiz_task";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import { UserAnswer } from "../models/question.model";

@injectable()
export class QuizSessionController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz_session";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Mapper) private mapperService: MapperService,

        @inject(ServiceType.QuizSession)
        private quizSessionService: QuizSessionService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Socket) private socketService: SocketService,
        @inject(ServiceType.TaskScheduling)
        private taskSchedulingService: TaskSchedulingService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.get("/", this.getMy.bind(this));
        this.router.get("/:quizSessionId", this.getById.bind(this));
        this.router.post("/:quizId", this.create.bind(this));
        this.router.post(
            "/:quizSessionId/:index/answer",
            this.saveAnswer.bind(this)
        );
        this.router.post(
            "/:quizSessionId/submit",
            this.submitQuizSession.bind(this)
        );
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);

            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canTakeQuiz = await canPerform(Permission.TAKE_QUIZ);
            if (!canTakeQuiz) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const isDoingSimilarQuiz =
                await this.quizSessionService.userIsDoingQuiz(userId, quizId);
            if (isDoingSimilarQuiz) {
                throw new Error(
                    `You have not finished this quiz, and cannot take a new one`
                );
            }

            const quiz = await this.quizService.getQuizById(quizId);

            if (!quiz) {
                throw new Error(`Quiz doesn't exist`);
            }

            const potentialQuestions = _.sampleSize(
                quiz.potentialQuestions,
                quiz.sampleSize
            );

            const concreteQuestions = await Promise.all(
                potentialQuestions.map((questionId) =>
                    (async () => {
                        const question = await this.questionService.getById(
                            questionId
                        );
                        console.debug(question);
                        return this.questionService.generateConcreteQuestion(
                            question
                        );
                    })()
                )
            );

            const startTime = Date.now();
            const quizDeadline = startTime + quiz.duration;

            const quizSession = await this.quizSessionService.create(
                userId,
                quiz.duration,
                startTime,
                quizId,
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
                this.mapperService.adjustQuizSessionAccordingToStatus(
                    quizSession
                );
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

            const query: FilterQuery<QuizSessionDocument> = {
                userId: userId,
            };
            if (req.query.name) {
                query.fromQuiz.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.fromQuiz.subject = new Types.ObjectId(
                    req.query.subject as string
                );
            }
            if (req.query.chapter) {
                query.fromQuiz.chapter = new Types.ObjectId(
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
                const result = await this.quizSessionService.getPopulated(
                    query,
                    ["fromQuiz", "fromQuiz.subject", "fromQuiz.chapter"]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] =
                    await this.quizSessionService.getPaginated(
                        query,
                        ["fromQuiz", "fromQuiz.subject", "fromQuiz.chapter"],
                        pageSize,
                        pageNumber
                    );
                const adjustedResult = result.map((quizSession) =>
                    this.mapperService.adjustQuizSessionAccordingToStatus(
                        quizSession
                    )
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
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);
            const quizSession =
                await this.quizSessionService.getOneQuizOfUserExpanded(
                    userId,
                    quizSessionId
                );
            if (!quizSession) {
                throw new Error(`Quiz doesn't exist`);
            }

            const result =
                this.mapperService.adjustQuizSessionAccordingToStatus(
                    quizSession
                );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async saveAnswer(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);
            const questionIndex = parseInt(req.params.index);

            const quizSession =
                await this.quizSessionService.getUserOngoingQuizById(
                    quizSessionId,
                    userId
                );
            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist or has ended`);
            }

            const answer = req.body as UserAnswer;

            if (
                !(
                    questionIndex >= 0 &&
                    questionIndex < quizSession.questions.length
                )
            ) {
                throw new Error(`Question index out of range`);
            }

            this.questionService.attachUserAnswerToQuestion(
                quizSession.questions[questionIndex],
                answer
            );
            quizSession.markModified("questions");
            await quizSession.save();

            const result =
                this.mapperService.adjustQuizSessionAccordingToStatus(
                    quizSession
                );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async submitQuizSession(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);

            const result = await new EndQuizTask(
                userId,
                quizSessionId,
                this.quizSessionService,
                this.socketService,
                this.taskSchedulingService,
                this.questionService
            ).execute();

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
