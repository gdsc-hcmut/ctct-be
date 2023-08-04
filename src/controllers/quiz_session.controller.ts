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
import { Types } from "mongoose";
import { logger } from "../lib/logger";
import { QuizSessionDocument, QuizStatus } from "../models/quiz_session.model";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { EndQuizTask } from "../services/task-scheduling/tasks/end_quiz_task";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import { UserAnswer } from "../models/question.model";
import { QueryQuizSessionDto } from "../lib/dto/query_quiz_session.dto";

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
            "/:quizSessionId/:questionId/answer",
            this.saveAnswer.bind(this)
        );
        this.router.post(
            "/:quizSessionId/submit",
            this.submitQuizSession.bind(this)
        );
        this.router.post(
            "/:quizSessionId/:questionId/flag",
            this.flagQuestion.bind(this)
        );
        this.router.post(
            "/:quizSessionId/:questionId/note",
            this.noteQuestion.bind(this)
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
                potentialQuestions.map((questionId, index) =>
                    (async () => {
                        const question = await this.questionService.getById(
                            questionId
                        );
                        return this.questionService.generateConcreteQuestion(
                            question,
                            index
                        );
                    })()
                )
            );

            const startedAt = Date.now();
            const quizDeadline = startedAt + quiz.duration;

            const quizSession = await this.quizSessionService.create(
                userId,
                quiz.duration,
                startedAt,
                quizId,
                concreteQuestions
            );
            // schedule a task to end this quiz
            logger.debug(
                `Scheduling quiz ${quiz._id} to start at ${new Date(
                    startedAt
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

            const query: QueryQuizSessionDto = {
                name:
                    req.query.name !== undefined
                        ? decodeURIComponent(req.query.name as string)
                        : undefined,
                subject:
                    req.query.subject !== undefined
                        ? new Types.ObjectId(req.query.subject as string)
                        : undefined,
                chapter:
                    req.query.chapter !== undefined
                        ? new Types.ObjectId(req.query.chapter as string)
                        : undefined,
            };

            const quizSessionFilter = (quizSession: QuizSessionDocument) => {
                if (query.name) {
                    const quizSessionName = (quizSession.fromQuiz as any)
                        .name as string;
                    if (!quizSessionName.match(query.name)) {
                        return false;
                    }
                }
                if (query.subject) {
                    const quizSessionSubject = (quizSession.fromQuiz as any)
                        .subject as Types.ObjectId;
                    if (!quizSessionSubject.equals(query.subject)) {
                        return false;
                    }
                }
                if (query.chapter) {
                    const quizSessionChapter = (quizSession.fromQuiz as any)
                        .chapter as Types.ObjectId;
                    if (!quizSessionChapter.equals(query.chapter)) {
                        return false;
                    }
                }
                return true;
            };

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = (
                    await this.quizSessionService.getExpanded(
                        {
                            userId: userId,
                        },
                        {
                            path: "fromQuiz",
                            populate: [
                                {
                                    path: "subject",
                                },
                                {
                                    path: "chapter",
                                },
                            ],
                        }
                    )
                ).filter(quizSessionFilter);

                const adjustedResult = result.map((quizSession) =>
                    this.mapperService.adjustQuizSessionAccordingToStatus(
                        quizSession
                    )
                );

                res.composer.success({
                    total: result.length,
                    result: adjustedResult,
                });
            } else {
                const [total, unmappedResult] =
                    await this.quizSessionService.getPaginated(
                        { userId: userId },
                        {
                            path: "fromQuiz",
                            populate: [
                                {
                                    path: "subject",
                                },
                                {
                                    path: "chapter",
                                },
                            ],
                        },
                        pageSize,
                        pageNumber
                    );

                const adjustedResult = unmappedResult
                    .filter(quizSessionFilter)
                    .map((quizSession) =>
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
            const quizSession = await this.quizSessionService.getByIdPopulated(
                quizSessionId,
                {
                    path: "fromQuiz",
                    populate: [
                        {
                            path: "subject",
                        },
                        {
                            path: "chapter",
                        },
                    ],
                }
            );

            if (!quizSession) {
                throw new Error(`Quiz doesn't exist`);
            }

            if (!quizSession.userId.equals(userId)) {
                throw new Error(`This quiz was not taken by you`);
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
            const questionId = parseInt(req.params.questionId);

            const quizSession =
                await this.quizSessionService.getUserOngoingQuizById(
                    quizSessionId,
                    userId
                );
            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist or has ended`);
            }

            const answer = req.body as UserAnswer;

            const questionExists = _.some(
                quizSession.questions,
                (question) => question.questionId === questionId
            );
            if (!questionExists) {
                throw new Error(`Question doesn't exist`);
            }

            quizSession.questions.forEach((question) => {
                if (question.questionId === questionId) {
                    this.questionService.attachUserAnswerToQuestion(
                        question,
                        answer
                    );
                }
            });
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

    async flagQuestion(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);

            const quizSession =
                await this.quizSessionService.getUserOngoingQuizById(
                    quizSessionId,
                    userId
                );
            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist or has ended`);
            }

            const questionId = parseInt(req.params.questionId);

            const questionExists = _.some(
                quizSession.questions,
                (question) => question.questionId === questionId
            );
            if (!questionExists) {
                throw new Error(`Question doesn't exist`);
            }

            quizSession.questions.forEach((question) => {
                if (question.questionId === questionId) {
                    question.isFlagged = !question.isFlagged;
                }
            });
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

    async noteQuestion(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);

            const quizSession = await this.quizSessionService.getQuizById(
                quizSessionId
            );
            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist or has ended`);
            }
            if (!quizSession.userId.equals(userId)) {
                throw new Error(`You didn't take this quiz`);
            }
            if (quizSession.status !== QuizStatus.ENDED) {
                throw new Error(`Can only note after quiz session has ended`);
            }

            const questionId = parseInt(req.params.questionId);

            const questionExists = _.some(
                quizSession.questions,
                (question) => question.questionId === questionId
            );
            if (!questionExists) {
                throw new Error(`Question doesn't exist`);
            }

            quizSession.questions.forEach((question) => {
                if (question.questionId === questionId) {
                    question.userNote = req.body.note as string;
                }
            });
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
}
