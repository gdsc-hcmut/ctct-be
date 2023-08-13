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
    UserActivityService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { QuizSessionDocument, QuizStatus } from "../models/quiz_session.model";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { EndQuizTask } from "../services/task-scheduling/tasks/end_quiz_task";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import { UserAnswer } from "../models/question.model";
import { UserActivityType } from "../models/user_activity.model";

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
        private taskSchedulingService: TaskSchedulingService,
        @inject(ServiceType.UserActivity)
        private userActivityService: UserActivityService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.get("/", this.getMy.bind(this));
        this.router.get("/:quizSessionId", this.getById.bind(this));
        this.router.post("/:quizId", this.create.bind(this));
        this.router.get(
            "/quiz/:quizId",
            this.getOngoingSessionOfQuiz.bind(this)
        );
        this.router.post(
            "/:quizSessionId/:questionId/answer",
            this.saveAnswer.bind(this)
        );
        this.router.post(
            "/:quizSessionId/submit",
            this.submitQuizSession.bind(this)
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

            const ongoingSessionFromSameQuiz =
                await this.quizSessionService.findOngoingSessionFromQuiz(
                    userId,
                    quizId
                );
            if (ongoingSessionFromSameQuiz) {
                throw new Error(
                    `You already have an ongoing quiz session from this quiz`
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
                            index + 1
                        );
                    })()
                )
            );

            const startedAt = Date.now();
            const quizSessionDeadline = startedAt + quiz.duration;

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
                ).toString()} and end at ${new Date(
                    quizSessionDeadline
                ).toString()}`
            );
            await this.taskSchedulingService.schedule(
                new Date(quizSessionDeadline),
                ScheduledTaskType.END_QUIZ_SESSION,
                {
                    userId: userId,
                    quizSessionId: quizSession._id,
                }
            );

            const result =
                this.mapperService.adjustQuizSessionAccordingToStatus(
                    quizSession
                );

            await this.userActivityService.create(
                UserActivityType.START_QUIZ_SESSION,
                userId,
                quizSession._id
            );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getOngoingSessionOfQuiz(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);

            const quizSession =
                await this.quizSessionService.findOngoingSessionFromQuiz(
                    userId,
                    quizId
                );

            res.composer.success(
                quizSession
                    ? this.mapperService.adjustQuizSessionAccordingToStatus(
                          quizSession
                      )
                    : quizSession
            );
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getMy(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;

            const prePopulateQuery: FilterQuery<QuizSessionDocument> = {
                userId: userId,
            };

            if (req.query.status) {
                const validStatus = Object.values(QuizStatus).includes(
                    req.query.status as QuizStatus
                );
                if (!validStatus) {
                    throw new Error(
                        `Invalid status received ${req.query.status}`
                    );
                }

                prePopulateQuery.status = req.query.status as QuizStatus;
            }

            if (req.query.startedAtMin || req.query.startedAtMax) {
                prePopulateQuery.startedAt = {
                    $gte: req.query.startedAtMin
                        ? parseInt(req.query.startedAtMin as string)
                        : undefined,
                    $lte: req.query.startedAtMax
                        ? parseInt(req.query.startedAtMax as string)
                        : undefined,
                };
                prePopulateQuery.startedAt = _.omitBy(
                    prePopulateQuery.startedAt,
                    _.isNil
                );
            }

            if (req.query.endedAtMin || req.query.endedAtMax) {
                prePopulateQuery.endedAt = {
                    $gte: req.query.endedAtMin
                        ? parseInt(req.query.endedAtMin as string)
                        : undefined,
                    $lte: req.query.endedAtMax
                        ? parseInt(req.query.endedAtMax as string)
                        : undefined,
                };
                prePopulateQuery.endedAt = _.omitBy(
                    prePopulateQuery.endedAt,
                    _.isNil
                );
            }

            logger.debug(prePopulateQuery);

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            const postPopulateQuery: FilterQuery<QuizSessionDocument> =
                _.omitBy(
                    {
                        "fromQuiz.name": req.query.name
                            ? {
                                  $regex: decodeURIComponent(
                                      req.query.name as string
                                  ),
                              }
                            : undefined,
                        "fromQuiz.subject._id": req.query.subject
                            ? new Types.ObjectId(req.query.subject as string)
                            : undefined,
                        "fromQuiz.chapter._id": req.query.chapter
                            ? new Types.ObjectId(req.query.chapter as string)
                            : undefined,
                    },
                    _.isNil
                );

            logger.debug(postPopulateQuery);

            const isValidPaginationOption =
                req.query.pagination !== undefined &&
                ["true", "false"].includes(req.query.pagination as string);
            if (!isValidPaginationOption) {
                throw new Error(
                    `Invalid pagination option received '${req.query.pagination}'`
                );
            }

            const isUsePagination =
                req.query.pagination === undefined ||
                req.query.pagination === "true";

            const { total, result } = !isUsePagination
                ? (
                      await this.quizSessionService.getAllPopulated(
                          prePopulateQuery,
                          postPopulateQuery
                      )
                  )[0]
                : (
                      await this.quizSessionService.getPaginated(
                          prePopulateQuery,
                          postPopulateQuery,
                          pageSize,
                          pageNumber
                      )
                  )[0];

            for (let i = 0; i < result.length; i++) {
                result[i] = _.omit(result[i], [
                    "fromQuiz.__v",
                    "fromQuiz.potentialQuestions",
                    "fromQuiz.createdAt",
                    "fromQuiz.lastUpdatedAt",
                    "fromQuiz.createdBy",
                    "fromQuiz.chapter.createdBy",
                    "fromQuiz.chapter.createdAt",
                    "fromQuiz.chapter.lastUpdatedAt",
                    "fromQuiz.chapter.__v",
                    "fromQuiz.subject.createdBy",
                    "fromQuiz.subject.createdAt",
                    "fromQuiz.subject.lastUpdatedAt",
                    "fromQuiz.subject.__v",
                ]);
                if (result[i].status === QuizStatus.ONGOING) {
                    result[i] = _.omit(result[i], ["standardizedScore"]);
                }
            }

            if (!isUsePagination) {
                res.composer.success({
                    total,
                    result,
                });
            } else {
                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    results: result,
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
                    __v: 0,
                },
                {
                    path: "fromQuiz",
                    select: "_id name subject chapter",
                    populate: [
                        {
                            path: "subject",
                            select: "_id name",
                        },
                        {
                            path: "chapter",
                            select: "_id name",
                        },
                    ],
                }
            );

            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist`);
            }

            if (!quizSession.userId.equals(userId)) {
                throw new Error(`Quiz session was not taken by you`);
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
                await this.quizSessionService.getOngoingQuizSessionOfUser(
                    quizSessionId,
                    userId
                );
            if (!quizSession) {
                throw new Error(`Quiz session doesn't exist or has ended`);
            }

            const answer = req.body as UserAnswer;

            const isQuestionExists = _.some(
                quizSession.questions,
                (question) => question.questionId === questionId
            );
            if (!isQuestionExists) {
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

    async noteQuestion(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizSessionId = new Types.ObjectId(req.params.quizSessionId);

            const quizSession = await this.quizSessionService.getById(
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

            const isQuestionExists = _.some(
                quizSession.questions,
                (question) => question.questionId === questionId
            );
            if (!isQuestionExists) {
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
