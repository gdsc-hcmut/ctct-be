import { Router } from "express";
import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { NextFunction } from "connect";
import { Request, Response, ServiceType } from "../types";
import { AuthService, EventService, UserService } from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import {
    EventCheckInQRCodeData,
    EventDocument,
    EventType,
} from "../models/event.model";
import { FilterQuery, Types } from "mongoose";
import { DEFAULT_PAGINATION_SIZE } from "../config";

@injectable()
export class EventController implements Controller {
    public readonly router = Router();
    public readonly path = "/event";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Event) private eventService: EventService
    ) {
        this.router.all("*", authService.authenticate());

        this.router.post(
            "/:eventId/register",
            this.prohibitIfNotFilledProfile.bind(this),
            this.register.bind(this)
        );
        this.router.post("/:eventId/unregister", this.unregister.bind(this));

        this.router.get("/qr/my", this.getMyQr.bind(this));

        this.router.get("/", this.getAll.bind(this));
        this.router.get("/my", this.getMyEvents.bind(this));
        this.router.get("/:eventId", this.getById.bind(this));
    }

    private async prohibitIfNotFilledProfile(
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

    public async register(request: Request, response: Response) {
        try {
            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (_.isNil(event)) {
                throw new Error(`Event not found`);
            }

            const { userId } = request.tokenMeta;
            const user = await this.userService.getUserById(userId);

            let canRegister = true;
            const now = Date.now();
            if (event.hasRegistrationTime) {
                if (
                    now < event.registrationStartedAt ||
                    now > event.registrationEndedAt
                ) {
                    canRegister = false;
                }
            } else {
                if (now > event.endedAt) {
                    canRegister = false;
                }
            }

            if (!canRegister) {
                throw new Error(
                    `Registration for this event is not available at the moment`
                );
            }

            const userIndex = event.registeredUsers.findIndex(
                (registeredUser) => registeredUser.userId.equals(userId)
            );
            if (userIndex !== -1) {
                throw new Error(`You have already registered for this event`);
            }

            event.registeredUsers.push({
                userId,
                givenName: user.givenName,
                familyAndMiddleName: user.familyAndMiddleName,
                dateOfBirth: user.dateOfBirth,
                studentId: user.studentId,
                major: user.major,
                gender: user.gender,
                phoneNumber: user.phoneNumber,

                registeredAt: now,
            });
            event.markModified("registeredUsers");
            await event.save();

            response.composer.success(
                this.eventService.censorEventInformationForUser(event)
            );
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async unregister(request: Request, response: Response) {
        try {
            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (_.isNil(event)) {
                throw new Error(`Event not found`);
            }

            const { userId } = request.tokenMeta;

            const now = Date.now();
            const canUnregister = now < event.startedAt;

            if (!canUnregister) {
                throw new Error(
                    `You cannot unregister from this event at the moment`
                );
            }

            const userIndex = event.registeredUsers.findIndex(
                (registeredUser) => registeredUser.userId.equals(userId)
            );
            if (userIndex === -1) {
                throw new Error(`You have not registered for this event`);
            }

            event.registeredUsers = _.filter(
                event.registeredUsers,
                (registeredUser) => !registeredUser.userId.equals(userId)
            );
            event.markModified("registeredUsers");
            await event.save();

            response.composer.success(
                this.eventService.censorEventInformationForUser(event)
            );
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getById(request: Request, response: Response) {
        try {
            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(
                eventId,
                {},
                {
                    populate: [
                        { path: "lhotMetadata.subject" },
                        { path: "createdBy" },
                    ],
                }
            );

            if (!event) {
                throw new Error(`Event not found`);
            }

            response.composer.success(
                this.eventService.censorEventInformationForUser(event)
            );
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getAll(request: Request, response: Response) {
        try {
            const query: FilterQuery<EventDocument> = {};

            if (request.query.name) {
                query.name = {
                    $regex: decodeURIComponent(request.query.name as string),
                };
            }
            if (request.query.eventType) {
                query.eventType = request.query.eventType as EventType;
            }

            if (request.query.startedAtMin) {
                query.startedAt = {
                    $gte: parseInt(request.query.startedAtMin as string),
                };
            }
            if (request.query.startedAtMax) {
                query.startedAt = {
                    $lte: parseInt(request.query.startedAtMax as string),
                };
            }
            if (request.query.endedAtMin) {
                query.endedAt = {
                    $gte: parseInt(request.query.endedAtMin as string),
                };
            }
            if (request.query.endedAtMax) {
                query.endedAt = {
                    $lte: parseInt(request.query.endedAtMax as string),
                };
            }

            // querying event-type-specific metadata only works if type is specified
            if (request.query.eventType === EventType.LHOT) {
                if (request.query.subject) {
                    query["lhotMetadata.subject"] = new Types.ObjectId(
                        request.query.subject as string
                    );
                }
            }

            const isUsePagination =
                request.query.pagination === undefined ||
                request.query.pagination === "true";

            const pageSize: number = request.query.pageSize
                ? parseInt(request.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = request.query.pageNumber
                ? parseInt(request.query.pageNumber as string)
                : 1;

            if (isUsePagination) {
                const [total, tempResult] =
                    await this.eventService.getPaginated(
                        query,
                        {
                            __v: 0,
                        },
                        [
                            { path: "lhotMetadata.subject" },
                            { path: "createdBy" },
                        ],
                        pageSize,
                        pageNumber
                    );

                const result = _.map(tempResult, (event) =>
                    this.eventService.censorEventInformationForUser(event)
                );

                response.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const tempResult = await this.eventService.get(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "lhotMetadata.subject" }, { path: "createdBy" }]
                );

                const result = _.map(tempResult, (event) =>
                    this.eventService.censorEventInformationForUser(event)
                );

                response.composer.success({
                    total: tempResult.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getMyEvents(request: Request, response: Response) {
        try {
            const { userId } = request.tokenMeta;
            const query: FilterQuery<EventDocument> = {
                "registeredUsers.userId": userId,
            };

            if (request.query.name) {
                query.name = {
                    $regex: decodeURIComponent(request.query.name as string),
                };
            }
            if (request.query.eventType) {
                query.eventType = request.query.eventType as EventType;
            }

            if (request.query.startedAtMin) {
                query.startedAt = {
                    $gte: parseInt(request.query.startedAtMin as string),
                };
            }
            if (request.query.startedAtMax) {
                query.startedAt = {
                    $lte: parseInt(request.query.startedAtMax as string),
                };
            }
            if (request.query.endedAtMin) {
                query.endedAt = {
                    $gte: parseInt(request.query.endedAtMin as string),
                };
            }
            if (request.query.endedAtMax) {
                query.endedAt = {
                    $lte: parseInt(request.query.endedAtMax as string),
                };
            }

            // querying event-type-specific metadata only works if type is specified
            if (request.query.eventType === EventType.LHOT) {
                if (request.query.subject) {
                    query["lhotMetadata.subject"] = new Types.ObjectId(
                        request.query.subject as string
                    );
                }
            }

            const isUsePagination =
                request.query.pagination === undefined ||
                request.query.pagination === "true";

            const pageSize: number = request.query.pageSize
                ? parseInt(request.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = request.query.pageNumber
                ? parseInt(request.query.pageNumber as string)
                : 1;

            if (isUsePagination) {
                const [total, tempResult] =
                    await this.eventService.getPaginated(
                        query,
                        {
                            __v: 0,
                        },
                        [
                            { path: "lhotMetadata.subject" },
                            { path: "createdBy" },
                        ],
                        pageSize,
                        pageNumber
                    );

                const result = _.map(tempResult, (event) =>
                    this.eventService.censorEventInformationForUser(event)
                );

                response.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const tempResult = await this.eventService.get(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "lhotMetadata.subject" }, { path: "createdBy" }]
                );

                const result = _.map(tempResult, (event) =>
                    this.eventService.censorEventInformationForUser(event)
                );

                response.composer.success({
                    total: tempResult.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getMyQr(request: Request, response: Response) {
        try {
            const { userId } = request.tokenMeta;

            const qrCodeData: EventCheckInQRCodeData = {
                userId: userId.toString(),
            };
            const qrCode = this.eventService.getUserQrCode(qrCodeData);

            response.composer.success(qrCode);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }
}
