import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { NextFunction, Router } from "express";
import { Response, Request, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ExamService,
    ExamSessionService,
    UserService,
} from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import { FilterQuery, Types } from "mongoose";
import { ExamDocument } from "../models/exam.model";
import { DEFAULT_PAGINATION_SIZE, Semester } from "../config";
import { ExamType } from "../models/exam.model";

@injectable()
export class ExamController implements Controller {
    public readonly router = Router();
    public readonly path = "/exam";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Exam) private examService: ExamService,
        @inject(ServiceType.ExamSession)
        private examSessionService: ExamSessionService
    ) {
        this.router.all("*", authService.authenticate());
        this.router.post(
            "/:examId/slot/:slotId",
            this.checkHcmutEmail.bind(this),
            this.hasFilledProfile.bind(this),
            this.register.bind(this)
        );
        this.router.post("/:examId/unregister", this.unregister.bind(this));

        this.router.get("/:examId", this.getById.bind(this));
        this.router.get("/:examId/summary");
        this.router.get("/", this.getAll.bind(this));

        this.router.get("/:examId/summary", this.getExamSummary.bind(this));
    }

    private async checkHcmutEmail(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = req.tokenMeta;
            const user = await this.userService.getUserById(userId);

            const isHcmutEmail = /.+@hcmut\.edu\.vn/.test(user.email);
            if (!isHcmutEmail) {
                throw new Error(`Please register with @hcmut.edu.vn email`);
            }

            next();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    /**
     * User should fill all their personal information
     */
    private async hasFilledProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = req.tokenMeta;
            const user = await this.userService.getUserById(userId);

            const givenNameInvalid =
                _.isEmpty(user.givenName) || _.isNil(user.givenName);
            const lastNameInvalid =
                _.isEmpty(user.familyAndMiddleName) ||
                _.isNil(user.familyAndMiddleName);
            if (givenNameInvalid || lastNameInvalid) {
                throw new Error(`Profile incomplete. Missing name`);
            }

            if (_.isNil(user.dateOfBirth)) {
                throw new Error(`Profile incomplete. Missing date of birth`);
            }

            if (_.isEmpty(user.studentId)) {
                throw new Error(`Profile incomplete. Missing student ID`);
            }

            if (_.isEmpty(user.major)) {
                throw new Error(`Profile incomplete. Missing major`);
            }

            if (_.isNil(user.gender)) {
                throw new Error(`Profile incomplete. Missing gender`);
            }

            if (_.isEmpty(user.phoneNumber)) {
                throw new Error(`Profile incomplete. Missing phone number`);
            }

            next();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async register(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const myUser = await this.userService.getUserById(userId);
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canRegister = await canPerform(Permission.REGISTER_EXAM);
            if (!canRegister) {
                throw new Error("You don't have permission to register exam");
            }

            const examId = new Types.ObjectId(req.params.examId);
            const slotId = parseInt(req.params.slotId);

            const exam = await this.examService.getExamById(examId);
            if (!exam || exam.isHidden) {
                throw new Error(`Exam not found`);
            }

            const currentTime = Date.now();
            const allowRegistration =
                exam.registrationStartedAt <= currentTime &&
                currentTime <= exam.registrationEndedAt;
            if (!allowRegistration) {
                throw new Error(`Registration is not open`);
            }

            const index = _.findIndex(
                exam.slots,
                (slot) => slot.slotId === slotId
            );
            if (index === -1) {
                throw new Error(`Slot with ID ${slotId} not found`);
            }

            const slotAtLimit =
                exam.slots[index].registeredUsers.length >=
                exam.slots[index].userLimit;
            if (slotAtLimit) {
                throw new Error(`Slot with ID ${slotId} is full`);
            }

            const alreadyRegistered = _.some(exam.slots, (slot) =>
                _.some(slot.registeredUsers, (user) =>
                    user.userId.equals(userId)
                )
            );
            if (alreadyRegistered) {
                throw new Error(`You have already registered this exam`);
            }

            exam.slots[index].registeredUsers.push({
                userId,
                givenName: myUser.givenName,
                familyAndMiddleName: myUser.familyAndMiddleName,
                dateOfBirth: myUser.dateOfBirth,
                studentId: myUser.studentId,
                major: myUser.major,
                gender: myUser.gender,
                phoneNumber: myUser.phoneNumber,
            });
            exam.markModified("slots");
            await exam.save();

            const result = this.examService.maskExam(exam);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async unregister(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;

            const examId = new Types.ObjectId(req.params.examId);
            const exam = await this.examService.getExamById(examId);

            if (!exam || exam.isHidden) {
                throw new Error(`Exam not found`);
            }

            const currentTime = Date.now();
            const allowRegistration =
                exam.registrationStartedAt <= currentTime &&
                currentTime <= exam.registrationEndedAt;
            if (!allowRegistration) {
                throw new Error(`Registration is not open`);
            }

            const userRegistered = _.some(exam.slots, (slot) =>
                _.some(slot.registeredUsers, (user) =>
                    user.userId.equals(userId)
                )
            );
            if (!userRegistered) {
                throw new Error(`You have not registered this exam`);
            }

            for (let i = 0; i < exam.slots.length; i++) {
                exam.slots[i].registeredUsers = _.filter(
                    exam.slots[i].registeredUsers,
                    (user) => !user.userId.equals(userId)
                );
            }
            exam.markModified("slots");
            await exam.save();

            const result = this.examService.maskExam(exam);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canView = await canPerform(Permission.VIEW_EXAM);
            if (!canView) {
                throw new Error("You don't have permission to view exam");
            }

            const examId = new Types.ObjectId(req.params.examId);
            const exam = await this.examService.getByIdPopulated(
                examId,
                {
                    __v: 0,
                },
                {
                    path: "subject",
                    select: "_id name",
                }
            );

            if (!exam || exam.isHidden) {
                throw new Error(`Exam not found`);
            }

            const result = this.examService.maskExam(exam);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );

            const canView = await canPerform(Permission.VIEW_EXAM);
            if (!canView) {
                throw new Error("You don't have permission to view exam");
            }

            const query: FilterQuery<ExamDocument> = {
                isHidden: false,
            };

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
                    [{ path: "subject", select: "_id name" }],
                    pageSize,
                    pageNumber
                );
                const maskedResult = _.map(result, (exam) =>
                    this.examService.maskExam(exam)
                );
                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result: maskedResult,
                });
            } else {
                const result = await this.examService.getPopulated(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "subject", select: "_id name" }]
                );
                const maskedResult = _.map(result, (exam) =>
                    this.examService.maskExam(exam)
                );
                res.composer.success({
                    total: result.length,
                    result: maskedResult,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getExamSummary(req: Request, res: Response) {
        try {
            const examId = new Types.ObjectId(req.params.examId);
            const sessions =
                await this.examSessionService.getCompletedSessionsOfExam(
                    examId
                );

            const result = _.map(
                sessions,
                (session) => session.standardizedScore
            );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
