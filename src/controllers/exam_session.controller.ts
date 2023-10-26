import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ExamService,
    ExamSessionService,
    MapperService,
    QuestionService,
    SocketService,
    TaskSchedulingService,
    UserActivityService,
} from "../services/index";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";
import { ScheduledTaskType } from "../services/task-scheduling/schedule_task_type";
import { UserActivityType } from "../models/user_activity.model";
import { UserAnswer } from "../models/question.model";
import { EndExamTask } from "../services/task-scheduling/tasks/end_exam_task";
import {
    ExamSessionDocument,
    ExamSessionStatus,
} from "../models/exam_session.model";
import { DEFAULT_PAGINATION_SIZE, Semester } from "../config";
import { ExamType } from "../models/exam.model";

@injectable()
export class ExamSessionController implements Controller {
    public readonly router = Router();
    public readonly path: string = "/exam_session";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private AccessLevel: AccessLevelService,
        @inject(ServiceType.ExamSession)
        private examSessionService: ExamSessionService,
        @inject(ServiceType.Exam) private examService: ExamService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.TaskScheduling)
        private taskSchedulingService: TaskSchedulingService,
        @inject(ServiceType.Mapper) private mapperService: MapperService,
        @inject(ServiceType.UserActivity)
        private userActivityService: UserActivityService,
        @inject(ServiceType.Socket) private socketService: SocketService
    ) {
        this.router.all("*", authService.authenticate());
        this.router.post("/:examId", this.create.bind(this));

        this.router.get("/exam/:examId", this.getSessionOfExam.bind(this));
        this.router.get("/:examSessionId", this.getById.bind(this));
        this.router.get("/", this.getMy.bind(this));
        this.router.post(
            "/:examSessionId/question/:questionId/save",
            this.saveAnswer.bind(this)
        );
        this.router.post(
            "/:examSessionId/submit",
            this.submitExamSession.bind(this)
        );
        this.router.post(
            "/:examSessionId/question/:questionId/note",
            this.noteQuestion.bind(this)
        );

        this.router.get(
            "/:examSessionId/slot/summary",
            this.getSlotSummaryOfSession.bind(this)
        );
    }

    public async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const examId = new Types.ObjectId(req.params.examId);

            const hasDoneExam =
                await this.examSessionService.userHasDoneThisExam(
                    userId,
                    examId
                );
            if (hasDoneExam) {
                throw new Error(`You have already taken this exam`);
            }

            const exam = await this.examService.getExamById(examId);

            if (!exam || exam.isHidden) {
                throw new Error(`Exam not found`);
            }

            const slotIndex = _.findIndex(exam.slots, (slot) =>
                _.some(slot.registeredUsers, (user) =>
                    user.userId.equals(userId)
                )
            );
            if (slotIndex === -1) {
                throw new Error(`You are not registered for this exam`);
            }

            const now = Date.now();
            const inSlotTime =
                exam.slots[slotIndex].startedAt <= now &&
                now <= exam.slots[slotIndex].endedAt;
            if (!inSlotTime) {
                throw new Error(`Slot time hasn't started`);
            }

            const questions = await Promise.all(
                exam.slots[slotIndex].questions.map((questionId, index) =>
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

            const sessionDuration =
                exam.slots[slotIndex].endedAt - exam.slots[slotIndex].startedAt;
            const examSessionDeadline = exam.slots[slotIndex].endedAt;

            const examSession = await this.examSessionService.create(
                userId,
                examId,
                exam.slots[slotIndex].slotId,
                exam.slots[slotIndex].startedAt,
                sessionDuration,
                questions
            );
            // schedule a task to end this exam
            logger.debug(
                `Scheduling exam ${exam._id} to start at ${new Date(
                    now
                ).toString()} and end at ${new Date(
                    examSessionDeadline
                ).toString()}`
            );
            await this.taskSchedulingService.schedule(
                new Date(examSessionDeadline),
                ScheduledTaskType.END_EXAM_SESSION,
                {
                    userId: userId,
                    examSessionId: examSession._id,
                }
            );

            const result =
                this.mapperService.adjustExamSessionAccordingToStatus(
                    examSession
                );

            await this.userActivityService.create(
                UserActivityType.START_EXAM_SESSION,
                userId,
                examSession._id
            );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getSessionOfExam(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const examId = new Types.ObjectId(req.params.examId);

            const examSession =
                await this.examSessionService.getUserSessionOfExam(
                    userId,
                    examId
                );

            res.composer.success(
                examSession
                    ? this.mapperService.adjustExamSessionAccordingToStatus(
                          examSession
                      )
                    : examSession
            );
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const examSessionId = new Types.ObjectId(req.params.examSessionId);
            const examSession = await this.examSessionService.getByIdPopulated(
                examSessionId,
                {
                    __v: 0,
                },
                {
                    path: "fromExam",
                    select: "_id name subject",
                    populate: [
                        {
                            path: "subject",
                            select: "_id name",
                        },
                    ],
                }
            );

            if (!examSession) {
                throw new Error(`Exam session doesn't exist`);
            }

            if (!examSession.userId.equals(userId)) {
                throw new Error(`Exam session was not taken by you`);
            }

            const result =
                this.mapperService.adjustExamSessionAccordingToStatus(
                    examSession
                );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getMy(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;

            const prePopulateQuery: FilterQuery<ExamSessionDocument> = {
                userId: userId,
            };

            if (req.query.status) {
                prePopulateQuery.status = req.query.status as ExamSessionStatus;
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

            const postPopulateQuery: FilterQuery<ExamSessionDocument> =
                _.omitBy(
                    {
                        "fromExam.name": req.query.name
                            ? {
                                  $regex: decodeURIComponent(
                                      req.query.name as string
                                  ),
                              }
                            : undefined,
                        "fromExam.subject._id": req.query.subject
                            ? new Types.ObjectId(req.query.subject as string)
                            : undefined,
                        "fromExam.semester": req.query.semester as Semester,
                        "fromExam.type": req.query.type as ExamType,
                    },
                    _.isNil
                );

            logger.debug(postPopulateQuery);

            const isUsePagination =
                req.query.pagination === undefined ||
                req.query.pagination === "true";

            const { total, result } = !isUsePagination
                ? (
                      await this.examSessionService.getAllPopulated(
                          prePopulateQuery,
                          postPopulateQuery
                      )
                  )[0]
                : (
                      await this.examSessionService.getPaginated(
                          prePopulateQuery,
                          postPopulateQuery,
                          pageSize,
                          pageNumber
                      )
                  )[0];

            for (let i = 0; i < result.length; i++) {
                result[i] = _.omit(result[i], [
                    "fromExam.slots.questions",
                    "fromExam.slots.registeredUsers",
                ]);
                if (result[i].status === ExamSessionStatus.ONGOING) {
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

    public async saveAnswer(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const examSessionId = new Types.ObjectId(req.params.examSessionId);
            const questionId = parseInt(req.params.questionId);

            const examSession =
                await this.examSessionService.getOngoingSessionOfUser(
                    userId,
                    examSessionId
                );
            if (!examSession) {
                throw new Error(`Exam session doesn't exist or has ended`);
            }

            const answer = req.body as UserAnswer;

            const isQuestionExists = _.some(
                examSession.questions,
                (question) => question.questionId === questionId
            );
            if (!isQuestionExists) {
                throw new Error(`Question doesn't exist`);
            }

            examSession.questions.forEach((question) => {
                if (question.questionId === questionId) {
                    this.questionService.attachUserAnswerToQuestion(
                        question,
                        answer
                    );
                }
            });
            examSession.markModified("questions");
            await examSession.save();

            const result =
                this.mapperService.adjustExamSessionAccordingToStatus(
                    examSession
                );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async submitExamSession(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const examSessionId = new Types.ObjectId(req.params.examSessionId);

            const result = await new EndExamTask(
                userId,
                examSessionId,
                this.examSessionService,
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
            const examSessionId = new Types.ObjectId(req.params.examSessionId);

            const examSession = await this.examSessionService.getById(
                examSessionId
            );
            if (!examSession) {
                throw new Error(`Exam session doesn't exist or has ended`);
            }
            if (!examSession.userId.equals(userId)) {
                throw new Error(`You didn't take this exam`);
            }
            if (examSession.status !== ExamSessionStatus.ENDED) {
                throw new Error(`Can only note after exam session has ended`);
            }

            const questionId = parseInt(req.params.questionId);

            const isQuestionExists = _.some(
                examSession.questions,
                (question) => question.questionId === questionId
            );
            if (!isQuestionExists) {
                throw new Error(`Question doesn't exist`);
            }

            examSession.questions.forEach((question) => {
                if (question.questionId === questionId) {
                    question.userNote = req.body.note as string;
                }
            });
            examSession.markModified("questions");
            await examSession.save();

            const result =
                this.mapperService.adjustExamSessionAccordingToStatus(
                    examSession
                );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    /**
     * Get summary of the slot that contains this session
     */
    public async getSlotSummaryOfSession(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;

            const examSessionId = new Types.ObjectId(req.params.examSessionId);
            const examSession = await this.examSessionService.getById(
                examSessionId
            );

            if (!examSession || !examSession.userId.equals(userId)) {
                throw new Error(`Exam session does not exist or is not yours`);
            }

            if (examSession.status !== ExamSessionStatus.ENDED) {
                throw new Error(
                    `Can only view summary after exam session has ended`
                );
            }

            const { slotId, fromExam: examId } = examSession;

            const sessions = await this.examSessionService.getAllSessionOfSlot(
                examId,
                slotId
            );
            const completedSessions = _.filter(
                sessions,
                (session) => session.status === ExamSessionStatus.ENDED
            );
            const exam = await this.examService.getExamById(examId);
            const slotIndex = _.findIndex(
                exam.slots,
                (slot) => slot.slotId === slotId
            );

            res.composer.success({
                registeredCount: exam.slots[slotIndex].registeredUsers.length,
                startedCount: sessions.length,
                completedCount: completedSessions.length,
                completedScores: _.map(
                    completedSessions,
                    (session) => session.standardizedScore
                ),
            });
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
