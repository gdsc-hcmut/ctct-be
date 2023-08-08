import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    UserService,
    AuthService,
    UserActivityService,
    QuizSessionService,
} from "../services/index";
import { ErrorNotFound } from "../lib/errors";
import { logger } from "../lib/logger";
import { EditProfileDto } from "../lib/dto/edit_profile.dto";
import { Gender } from "../models/user.model";
import { FilterQuery, Types } from "mongoose";
import {
    UserActivityDocument,
    UserActivityType,
} from "../models/user_activity.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class MeController extends Controller {
    public readonly router = Router();
    public readonly path = "/me";

    constructor(
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.UserActivity)
        private userActivityService: UserActivityService,
        @inject(ServiceType.QuizSession)
        private quizSessionService: QuizSessionService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        // My profile
        this.router.get("/", this.getMyProfile.bind(this));
        this.router.patch("/", this.editProfile.bind(this));
        this.router.get("/activity", this.getActivities.bind(this));
        this.router.delete(
            "/activity/:activityId",
            this.deleteActivity.bind(this)
        );
        this.router.get("/statistics/quiz", this.getQuizStatistics.bind(this));
    }

    async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;
            const user = await this.userService.getByIdPopulated(userId, [
                "accessLevels",
            ]);

            if (!user) {
                throw new ErrorNotFound(`Requested user is not found`);
            }

            res.composer.success(user);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async editProfile(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const user = await this.userService.getById(userId);

            const info: EditProfileDto = {
                familyAndMiddleName:
                    req.body.familyAndMiddleName ?? user.familyAndMiddleName,
                givenName: req.body.givenName ?? user.givenName,
                studentId: req.body.studentId ?? user.studentId,
                major: req.body.major ?? user.major,
                dateOfBirth: req.body.dateOfBirth ?? user.dateOfBirth,
                gender: (req.body.gender as Gender) ?? user.gender,
                phoneNumber: req.body.phoneNumber ?? user.phoneNumber,
            };

            const validDob =
                info.dateOfBirth === undefined ||
                info.dateOfBirth <= Date.now();
            if (!validDob) {
                throw new Error("Invalid date of birth");
            }

            const validGender =
                info.gender === undefined ||
                Object.values(Gender).includes(info.gender);
            if (!validGender) {
                throw new Error(`Gender ${info.gender} is invalid`);
            }

            const validPhoneNumber =
                info.phoneNumber === undefined ||
                /^[0-9]*$/.test(info.phoneNumber);
            if (!validPhoneNumber) {
                throw new Error("Invalid phone number");
            }

            const result = await this.userService.edit(userId, info);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getActivities(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;

            const query: FilterQuery<UserActivityDocument> = {
                userId: userId,
            };

            if (req.query.type) {
                const isValidType = Object.values(UserActivityType).includes(
                    req.query.type as UserActivityType
                );
                if (!isValidType) {
                    throw new Error(`Invalid activity type ${req.query.type}`);
                }

                query.type = req.query.type as UserActivityType;
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            const [total, activities] =
                await this.userActivityService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    [
                        {
                            // case type = UserActivityType.VIEW_MATERIAL
                            path: "materialId",
                            select: "_id name subject chapter",
                            populate: [
                                { path: "subject", select: "_id name" },
                                { path: "chapter", select: "_id name" },
                            ],
                        },
                        {
                            // case type = UserActivityType.VIEW_PREVIOUS_EXAM
                            path: "previousExamId",
                            select: "_id name subject semester type",
                            populate: [{ path: "subject", select: "_id name" }],
                        },
                        {
                            // case type = UserActivityType.START_QUIZ_SESSION
                            path: "quizSessionId",
                            select: "_id status fromQuiz",
                            populate: {
                                path: "fromQuiz",
                                select: "_id name subject chapter",
                                populate: [
                                    { path: "subject", select: "_id name" },
                                    { path: "chapter", select: "_id name" },
                                ],
                            },
                        },
                    ],
                    pageSize,
                    pageNumber
                );

            res.composer.success({
                total,
                pageCount: Math.max(Math.ceil(total / pageSize), 1),
                pageSize,
                results: activities,
            });
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async deleteActivity(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const activityId = new Types.ObjectId(req.params.activityId);

            const activity = await this.userActivityService.getById(activityId);

            if (!activity) {
                throw new Error(`Activity not found`);
            }

            if (!activity.userId.equals(userId)) {
                throw new Error(`You can only delete your own activity`);
            }

            const result = await this.userActivityService.markAsDeleted(
                activityId
            );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    public async getQuizStatistics(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;

            const result =
                await this.quizSessionService.getStatisticsGroupedBySubject(
                    userId
                );

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
