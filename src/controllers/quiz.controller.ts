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
import mongoose, { Types } from "mongoose";
import { logger } from "../lib/logger";
import { QuizStatus } from "../models/quiz.model";
import _ from "lodash";
import { Permission } from "../models/access_level.model";
import { EndQuizTask } from "../services/task-scheduling/tasks/end_quiz_task";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";

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
        this.router.post("/answer/:quizId/:index", this.answer.bind(this));
        this.router.post("/end/:quizId", this.endQuiz.bind(this));
    }

    async take(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const {
                userId,
                accessLevels: userAccessLevels,
                isManager,
            } = req.tokenMeta;
            const quizTemplateId = new Types.ObjectId(
                req.params.quizTemplateId
            );

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.TAKE_QUIZ,
                    isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            if (
                await this.quizService.userHasUnfinishedQuiz(
                    userId,
                    quizTemplateId,
                    { session: session }
                )
            ) {
                throw new Error(
                    `You have not finished this quiz, and cannot take a new one`
                );
            }

            const quizTemplate = await this.quizTemplateService.findById(
                quizTemplateId,
                {},
                { session: session }
            );

            if (
                !quizTemplate ||
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    quizTemplate.visibleTo,
                    isManager
                )
            ) {
                throw new Error(
                    `This quiz does not exist or has been configured to be hidden from you`
                );
            }

            const potentialQuestions = _.sampleSize(
                quizTemplate.potentialQuestions,
                quizTemplate.sampleSize
            );
            const concreteQuestions = await Promise.all(
                potentialQuestions.map(({ questionId, point, attempts }) =>
                    (async () => {
                        const questionTemplate =
                            await this.questionTemplateService.findById(
                                questionId,
                                {},
                                { session: session }
                            );
                        return this.questionTemplateService.generateConcreteQuestion(
                            questionTemplate,
                            point,
                            attempts
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
                concreteQuestions,
                { session: session }
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
                this.mapperService.maskQuizDocumentAccordingToStatus(quiz);
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getMy(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.tokenMeta.userId;
            const quizzes = await this.quizService.getAllQuizByUser(userId, {
                session: session,
            });
            const result = (quizzes as any[]).map((quiz) =>
                this.mapperService.maskQuizDocumentAccordingToStatus(quiz)
            );
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getById(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);
            const quiz = await this.quizService.getUserQuizById(
                userId,
                quizId,
                { session: session }
            );
            if (!quiz) {
                throw new Error(`Quiz doesn't exist`);
            }

            const result = this.mapperService.maskQuizDocumentAccordingToStatus(
                quiz as any
            );
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async answer(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);
            const index = parseInt(req.params.index);

            const data = req.body.answer as any[];
            if (!data) {
                throw new Error(`Missing 'answer' field`);
            }

            const quiz = await this.quizService.findOne(
                {
                    _id: quizId,
                    userId: userId,
                    status: QuizStatus.ONGOING,
                },
                {},
                { session: session }
            );
            if (!quiz) {
                throw new Error(
                    `The requested quiz does not exist, or it has already finished`
                );
            }
            if (index < 0 || index >= quiz.questions.length) {
                throw new Error(`Index out of bounds`);
            }
            if (data.length !== quiz.questions[index].questions.length) {
                throw new Error(
                    `Number of answers doesn't match that of the question`
                );
            }

            const questionResult = this.questionTemplateService.processAnswer(
                quiz.questions[index],
                data
            );

            this.questionTemplateService.attachUserAnswerToQuestion(
                quiz.questions[index],
                data
            );
            console.log(quiz.questions[index]);
            quiz.markModified("questions");
            await quiz.save();

            const result = await this.quizService.updateQuestionResult(
                quizId,
                index,
                questionResult,
                { session: session }
            );
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async endQuiz(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const quizId = new Types.ObjectId(req.params.quizId);

            const result = await new EndQuizTask(
                userId,
                quizId,
                this.quizService,
                this.socketService,
                this.taskSchedulingService
            ).execute();

            res.composer.success(
                this.mapperService.maskQuizDocumentAccordingToStatus(result)
            );
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
