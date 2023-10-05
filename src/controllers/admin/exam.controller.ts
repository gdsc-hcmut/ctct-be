import { Router } from "express";
import { Controller } from "../controller";
import { Request, Response, ServiceType } from "../../types";
import { logger } from "../../lib/logger";
import { inject, injectable } from "inversify";
import {
    AccessLevelService,
    AuthService,
    ExamService,
    QuestionService,
    SubjectService,
    TaskSchedulingService,
} from "../../services/index";
import { Permission } from "../../models/access_level.model";
import {
    CreateExamDto,
    CreateExamSlotDto,
} from "../../lib/dto/create_exam.dto";
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";
import { DEFAULT_PAGINATION_SIZE, Semester } from "../../config";
import { ExamDocument, ExamType } from "../../models/exam.model";
import { EditExamDto, EditExamSlotDto } from "../../lib/dto/edit_exam.dto";

@injectable()
export class AdminExamController implements Controller {
    public readonly router = Router();
    public readonly path = "/exam";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Exam) private examService: ExamService,
        @inject(ServiceType.TaskScheduling)
        private taskSchedulingService: TaskSchedulingService
    ) {
        this.router.all("*", authService.authenticate());
        this.router.post("/", this.create.bind(this));
        this.router.patch("/:examId", this.editExam.bind(this));
        this.router.delete("/:examId", this.deleteExam.bind(this));

        this.router.post("/:examId/slot", this.createExamSlot.bind(this));
        this.router.patch(
            "/:examId/slot/:slotId",
            this.editExamSlot.bind(this)
        );
        this.router.delete(
            "/:examId/slot/:slotId",
            this.deleteExamSlot.bind(this)
        );

        this.router.get("/:examId", this.getById.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    public async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canCreateExam = await canPerform(
                Permission.ADMIN_CREATE_EXAM
            );
            if (!canCreateExam) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const examInfo: CreateExamDto = {
                name: req.body.name || "",
                description: req.body.description || "",

                subject: new Types.ObjectId(req.body.subject),
                semester: req.body.semester,
                type: req.body.type,

                registrationStartedAt: req.body.registrationStartedAt,
                registrationEndedAt: req.body.registrationEndedAt,

                slots: req.body.slots.map((slot: CreateExamSlotDto) => ({
                    name: slot.name,
                    userLimit: slot.userLimit,
                    questions: slot.questions.map(
                        (question) => new Types.ObjectId(question)
                    ),
                    startedAt: slot.startedAt,
                    endedAt: slot.endedAt,
                })),
            };

            const slotWithNegativeUserLimit = _.findIndex(
                examInfo.slots,
                (slot) => slot.userLimit < 0
            );
            if (slotWithNegativeUserLimit !== -1) {
                throw new Error(
                    `Slot ${
                        slotWithNegativeUserLimit + 1
                    } has negative user limit`
                );
            }

            const slotWithDuplicateQuestion = _.findIndex(
                examInfo.slots,
                (slot) => {
                    return slot.questions.some((question, index) =>
                        slot.questions.some((otherQuestion, otherIndex) => {
                            question.equals(otherQuestion) &&
                                index !== otherIndex;
                        })
                    );
                }
            );

            if (slotWithDuplicateQuestion !== -1) {
                throw new Error(
                    `Slot ${
                        slotWithDuplicateQuestion + 1
                    } has duplicate questions`
                );
            }

            // check if all timestamps are valid
            const validRegistrationTime =
                Date.now() < examInfo.registrationStartedAt &&
                examInfo.registrationStartedAt < examInfo.registrationEndedAt;
            if (!validRegistrationTime) {
                throw new Error(`Invalid registration time`);
            }

            const validSlotTime = _.every(
                examInfo.slots,
                (slot) =>
                    slot.startedAt < slot.endedAt &&
                    examInfo.registrationEndedAt < slot.startedAt
            );
            if (!validSlotTime) {
                throw new Error(`Invalid slot time`);
            }

            // valid subject, semester, type
            const validSubject = await this.subjectService.subjectExists(
                examInfo.subject
            );
            if (!validSubject) {
                throw new Error(`Subject does not exist`);
            }

            const validSemester = Object.values(Semester).includes(
                examInfo.semester
            );
            if (!validSemester) {
                throw new Error(`Invalid semester: ${examInfo.semester}`);
            }

            const validExamType = Object.values(ExamType).includes(
                examInfo.type
            );
            if (!validExamType) {
                throw new Error(`Invalid exam type: ${examInfo.type}`);
            }

            await Promise.all(
                examInfo.slots.map((slot, index) =>
                    (async () => {
                        const questionsOfSlotExists =
                            await this.questionService.questionExists(
                                slot.questions
                            );
                        if (!questionsOfSlotExists) {
                            throw new Error(
                                `Slot ${
                                    index + 1
                                } has question IDs that do not exist`
                            );
                        }
                    })()
                )
            );

            const createdExam = await this.examService.create(userId, examInfo);
            res.composer.success(createdExam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    /**
     * Only allow editing of exam name, description, registration time
     * There are other APIs for editing slots
     */
    public async editExam(req: Request, res: Response) {
        try {
            const examId = new Types.ObjectId(req.params.examId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canEditExam = await canPerform(Permission.ADMIN_EDIT_EXAM);
            if (!canEditExam) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const exam = await this.examService.getExamById(examId);
            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            const info: EditExamDto = {
                name: req.body.name || exam.name,
                description: req.body.description || exam.description,

                subject: req.body.subject
                    ? new Types.ObjectId(req.body.subject)
                    : exam.subject,
                semester: req.body.semester || exam.semester,
                type: req.body.type || exam.type,

                registrationStartedAt:
                    req.body.registrationStartedAt ||
                    exam.registrationStartedAt,
                registrationEndedAt:
                    req.body.registrationEndedAt || exam.registrationEndedAt,
            };

            const minSlotStartTime = _.min(
                _.map(exam.slots, (slot) => slot.startedAt)
            );
            const validRegistrationTime =
                Date.now() < info.registrationStartedAt &&
                info.registrationStartedAt < info.registrationEndedAt &&
                (minSlotStartTime === undefined ||
                    info.registrationEndedAt < minSlotStartTime);
            if (!validRegistrationTime) {
                throw new Error(`Invalid registration time`);
            }

            // valid subject, semester, type
            const validSubject = await this.subjectService.subjectExists(
                info.subject
            );
            if (!validSubject) {
                throw new Error(`Subject does not exist`);
            }

            const validSemester = Object.values(Semester).includes(
                info.semester
            );
            if (!validSemester) {
                throw new Error(`Invalid semester: ${info.semester}`);
            }

            const validExamType = Object.values(ExamType).includes(info.type);
            if (!validExamType) {
                throw new Error(`Invalid exam type: ${info.type}`);
            }

            const editedExam = await this.examService.editOneExam(examId, info);
            res.composer.success(editedExam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async deleteExam(req: Request, res: Response) {
        try {
            const examId = new Types.ObjectId(req.params.examId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canDeleteExam = await canPerform(
                Permission.ADMIN_DELETE_EXAM
            );
            if (!canDeleteExam) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const exam = await this.examService.getExamById(examId);
            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            const deletedExam = await this.examService.markAsDeleted(examId);
            res.composer.success(deletedExam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async createExamSlot(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canAddExamSlot = await canPerform(Permission.ADMIN_EDIT_EXAM);
            if (!canAddExamSlot) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const examId = new Types.ObjectId(req.params.examId);
            const exam = await this.examService.getExamById(examId);

            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            if (Date.now() > exam.registrationEndedAt) {
                throw new Error(`Cannot add slot after registration ended`);
            }

            const slotInfo: CreateExamSlotDto = {
                name: req.body.name,
                userLimit: req.body.userLimit,
                questions: req.body.questions.map(
                    (question: string) => new Types.ObjectId(question)
                ),
                startedAt: req.body.startedAt,
                endedAt: req.body.endedAt,
            };

            if (!slotInfo.name) {
                throw new Error(`Slot name is required`);
            }
            if (slotInfo.userLimit === undefined || slotInfo.userLimit < 0) {
                throw new Error(`Invalid user limit`);
            }
            if (
                slotInfo.startedAt === undefined ||
                slotInfo.endedAt === undefined ||
                exam.registrationEndedAt >= slotInfo.startedAt ||
                slotInfo.startedAt >= slotInfo.endedAt
            ) {
                throw new Error(`Invalid slot time`);
            }

            const slotHasDuplicateQuestion = _.some(
                slotInfo.questions,
                (question, index) =>
                    _.some(
                        slotInfo.questions,
                        (otherQuestion, otherIndex) =>
                            question.equals(otherQuestion) &&
                            index !== otherIndex
                    )
            );

            if (slotHasDuplicateQuestion) {
                throw new Error(`Slot has duplicate questions`);
            }

            const maxSlotId = _.max(_.map(exam.slots, (slot) => slot.slotId));
            const slotId = maxSlotId === undefined ? 0 : maxSlotId + 1;

            exam.slots.push({
                slotId,
                registeredUsers: [],
                ...slotInfo,
            });
            exam.lastUpdatedAt = Date.now();
            exam.markModified("slots");
            await exam.save();

            res.composer.success(exam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async editExamSlot(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canEditExamSlot = await canPerform(
                Permission.ADMIN_EDIT_EXAM
            );
            if (!canEditExamSlot) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const examId = new Types.ObjectId(req.params.examId);
            const slotId = parseInt(req.params.slotId);
            const exam = await this.examService.getExamById(examId);

            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            const index = _.findIndex(
                exam.slots,
                (slot) => slot.slotId === slotId
            );

            if (index === -1) {
                throw new Error(`Slot with ID ${slotId} does not exist`);
            }

            // cannot edit if slot is in progress
            const slotHasStarted = exam.slots[index].startedAt <= Date.now();
            if (slotHasStarted) {
                throw new Error(`Cannot edit a slot that has already started`);
            }

            const editSlotInfo: EditExamSlotDto = {
                name: req.body.name || exam.slots[index].name,
                userLimit: req.body.userLimit || exam.slots[index].userLimit,
                questions: req.body.questions
                    ? _.map(
                          req.body.questions,
                          (question: string) => new Types.ObjectId(question)
                      )
                    : exam.slots[index].questions,
                startedAt: req.body.startedAt || exam.slots[index].startedAt,
                endedAt: req.body.endedAt || exam.slots[index].endedAt,
            };

            const validUserLimit =
                editSlotInfo.userLimit >=
                exam.slots[index].registeredUsers.length;
            if (!validUserLimit) {
                throw new Error(`Invalid user limit`);
            }

            const questionsExists = await this.questionService.questionExists(
                editSlotInfo.questions
            );
            if (!questionsExists) {
                throw new Error(`One or more questions does not exist`);
            }

            const slotHasDuplicateQuestion = _.some(
                editSlotInfo.questions,
                (question, index) =>
                    _.some(
                        editSlotInfo.questions,
                        (otherQuestion, otherIndex) =>
                            question.equals(otherQuestion) &&
                            index !== otherIndex
                    )
            );
            if (slotHasDuplicateQuestion) {
                throw new Error(`Slot has duplicate questions`);
            }

            const validSlotTime =
                Date.now() < editSlotInfo.startedAt &&
                editSlotInfo.startedAt < editSlotInfo.endedAt &&
                exam.registrationEndedAt < editSlotInfo.startedAt;
            if (!validSlotTime) {
                throw new Error(`Invalid slot time`);
            }

            exam.slots[index] = {
                slotId: exam.slots[index].slotId,
                registeredUsers: exam.slots[index].registeredUsers,
                ...editSlotInfo,
            };
            exam.markModified("slots");
            await exam.save();

            res.composer.success(exam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async deleteExamSlot(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canDeleteExamSlot = await canPerform(
                Permission.ADMIN_EDIT_EXAM
            );
            if (!canDeleteExamSlot) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const examId = new Types.ObjectId(req.params.examId);
            const exam = await this.examService.getExamById(examId);

            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            const slotId = parseInt(req.params.slotId);
            const index = _.findIndex(
                exam.slots,
                (slot) => slot.slotId === slotId
            );

            if (index === -1) {
                throw new Error(`Slot with ID ${slotId} does not exist`);
            }

            // cannot delete if slot past slot start date
            const slotHasStarted = exam.slots[index].startedAt <= Date.now();
            if (slotHasStarted) {
                throw new Error(
                    `Cannot delete a slot that has already started`
                );
            }

            exam.slots.splice(index, 1);
            exam.markModified("slots");
            await exam.save();

            res.composer.success(exam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canView = await canPerform(Permission.ADMIN_VIEW_EXAM);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const examId = new Types.ObjectId(req.params.examId);
            const exam = await this.examService.getByIdPopulated(
                examId,
                {
                    __v: 0,
                },
                [
                    { path: "subject", select: "_id name" },
                    { path: "slots.questions" },
                ]
            );

            if (!exam) {
                throw new Error(`Exam does not exist`);
            }

            res.composer.success(exam);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canView = await canPerform(Permission.ADMIN_VIEW_EXAM);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<ExamDocument> = {};

            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.semester) {
                query.semester = req.query.semester as Semester;
            }
            if (req.query.type) {
                query.type = req.query.type as ExamType;
            }

            const isUsePagination =
                req.query.pagination === undefined ||
                req.query.pagination === "true";

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (isUsePagination) {
                const [total, result] = await this.examService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    [
                        { path: "subject", select: "_id name" },
                        { path: "slots.questions" },
                    ],
                    pageSize,
                    pageNumber
                );
                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const result = await this.examService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    [
                        { path: "subject", select: "_id name" },
                        { path: "slots.questions" },
                    ]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
