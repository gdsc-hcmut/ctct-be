import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../../types";
import {
    AccessLevelService,
    AuthService,
    EventService,
    SubjectService,
    UserService,
} from "../../services";
import { logger } from "../../lib/logger";
import { Permission } from "../../models/access_level.model";
import { CreateEventDto } from "../../lib/dto/create_event.dto";
import { EventDocument, EventType } from "../../models/event.model";
import { FilterQuery, Types } from "mongoose";
import _ from "lodash";
import { DEFAULT_PAGINATION_SIZE } from "../../config";
import { EditEventDto } from "../../lib/dto/edit_event.dto";

@injectable()
export class AdminEventController implements Controller {
    public readonly path = "/event";
    public readonly router = Router();

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Event) private eventService: EventService,
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.Subject) private subjectService: SubjectService
    ) {
        this.router.all("*", authService.authenticate());

        this.router.post("/", this.create.bind(this));

        this.router.patch("/:eventId", this.editOne.bind(this));

        this.router.get("/:eventId", this.getById.bind(this));
        this.router.get("/", this.getAll.bind(this));

        this.router.delete("/:eventId", this.deleteOne.bind(this));

        // check-in an event
        this.router.post("/:eventId/checkin", this.checkIn.bind(this));
        this.router.post(
            "/:eventId/checkin/email",
            this.checkInEmail.bind(this)
        );
    }

    private getHasRegistrationTime(
        eventType: EventType,
        defaultValue: boolean
    ) {
        switch (eventType) {
            case EventType.LHOT:
                return false;
            default:
                return defaultValue;
        }
    }

    private getHasThumbnailAndBanner(
        eventType: EventType,
        defaultValue: boolean
    ) {
        switch (eventType) {
            case EventType.LHOT:
                return false;
            default:
                return defaultValue;
        }
    }

    public async create(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canCreateEvent = await canPerform(
                Permission.ADMIN_CREATE_EVENT
            );
            if (!canCreateEvent) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const hasRegistrationTime = this.getHasRegistrationTime(
                request.body.eventType,
                request.body.hasRegistrationTime
            );

            const getHasThumbnailAndBanner = this.getHasThumbnailAndBanner(
                request.body.eventType,
                request.body.hasThumbnailAndBanner
            );

            const eventInfo: CreateEventDto = {
                name: request.body.name,
                description: request.body.description,

                eventType: request.body.eventType,
                venue: request.body.venue,

                hasRegistrationTime,
                registrationStartedAt: hasRegistrationTime
                    ? request.body.registrationStartedAt
                    : undefined,
                registrationEndedAt: hasRegistrationTime
                    ? request.body.registrationEndedAt
                    : undefined,

                startedAt: request.body.startedAt,
                endedAt: request.body.endedAt,

                lhotMetadata:
                    request.body.eventType === EventType.LHOT
                        ? {
                              subject: new Types.ObjectId(
                                  request.body.lhotMetadata.subject
                              ),
                          }
                        : undefined,

                hasThumbnailAndBanner: getHasThumbnailAndBanner,
                thumbnailUrl:
                    request.body.eventType === EventType.OTHER
                        ? request.body.thumbnailUrl
                        : undefined,
                bannerUrl:
                    request.body.eventType === EventType.OTHER
                        ? request.body.bannerUrl
                        : undefined,
            };

            // check validity of eventInfo
            if (_.isEmpty(eventInfo.name)) {
                throw new Error("Event name is required");
            }

            if (!Object.values(EventType).includes(eventInfo.eventType)) {
                throw new Error(`Invalid event type: ${eventInfo.eventType}`);
            }

            if (_.isEmpty(eventInfo.venue)) {
                throw new Error("Event venue is required");
            }

            if (_.isNil(eventInfo.hasRegistrationTime)) {
                throw new Error("Missing whether event has registration time");
            }

            if (
                eventInfo.hasRegistrationTime &&
                (_.isNil(eventInfo.registrationStartedAt) ||
                    _.isNil(eventInfo.registrationEndedAt))
            ) {
                throw new Error("Registration start and end time are required");
            }

            if (
                eventInfo.hasRegistrationTime &&
                eventInfo.registrationStartedAt > eventInfo.registrationEndedAt
            ) {
                throw new Error(
                    "Registration start time cannot be greater than registration end time"
                );
            }

            if (
                _.isNil(eventInfo.startedAt) ||
                _.isNil(eventInfo.endedAt) ||
                eventInfo.startedAt > eventInfo.endedAt
            ) {
                throw new Error("Event time is invalid");
            }

            if (
                eventInfo.hasRegistrationTime &&
                eventInfo.registrationEndedAt > eventInfo.startedAt
            ) {
                throw new Error(
                    "Registration time and event time cannot overlap"
                );
            }

            // check valid metadata
            if (eventInfo.eventType === EventType.LHOT) {
                const { subject: subjectId } = eventInfo.lhotMetadata;
                const subjectExists = await this.subjectService.subjectExists(
                    subjectId
                );
                if (!subjectExists) {
                    throw new Error(`Subject for Lop Hoc On Tap not found`);
                }
            }

            if (_.isNil(eventInfo.hasThumbnailAndBanner)) {
                throw new Error(
                    "Missing whether event has thumbnail and banner"
                );
            }

            if (
                eventInfo.hasThumbnailAndBanner &&
                (_.isNil(eventInfo.thumbnailUrl) ||
                    _.isNil(eventInfo.bannerUrl))
            ) {
                throw new Error("Thumbnail and banner URLs are required");
            }

            const { userId: createdBy } = request.tokenMeta;
            const event = await this.eventService.create(eventInfo, createdBy);

            response.composer.success(event);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async editOne(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canEditEvent = await canPerform(Permission.ADMIN_EDIT_EVENT);
            if (!canEditEvent) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (!event) {
                throw new Error(`Event not found`);
            }

            const info: EditEventDto = {
                name: request.body.name || event.name,
                description: request.body.description || event.description,

                eventType: request.body.eventType || event.eventType,
                venue: request.body.venue || event.venue,

                hasRegistrationTime: _.isNil(request.body.hasRegistrationTime)
                    ? event.hasRegistrationTime
                    : request.body.hasRegistrationTime, // will be set later based on event type
                registrationStartedAt:
                    request.body.registrationStartedAt ||
                    event.registrationStartedAt,
                registrationEndedAt:
                    request.body.registrationEndedAt ||
                    event.registrationEndedAt,

                startedAt: request.body.startedAt || event.startedAt,
                endedAt: request.body.endedAt || event.endedAt,

                lhotMetadata: _.isNil(request.body.lhotMetadata)
                    ? event.lhotMetadata
                    : {
                          subject: new Types.ObjectId(
                              request.body.lhotMetadata.subject
                          ),
                      },

                hasThumbnailAndBanner: _.isNil(
                    request.body.hasThumbnailAndBanner
                )
                    ? event.hasThumbnailAndBanner
                    : request.body.hasThumbnailAndBanner,
                thumbnailUrl: request.body.thumbnailUrl || event.thumbnailUrl,
                bannerUrl: request.body.bannerUrl || event.bannerUrl,
            };

            info.hasRegistrationTime = this.getHasRegistrationTime(
                info.eventType,
                info.hasRegistrationTime
            );
            info.registrationStartedAt = info.hasRegistrationTime
                ? info.registrationStartedAt
                : undefined;
            info.registrationEndedAt = info.hasRegistrationTime
                ? info.registrationEndedAt
                : undefined;

            // check validity of eventInfo
            if (_.isEmpty(info.name)) {
                throw new Error("Event name is required");
            }

            if (!Object.values(EventType).includes(info.eventType)) {
                throw new Error(`Invalid event type: ${info.eventType}`);
            }

            if (_.isEmpty(info.venue)) {
                throw new Error("Event venue is required");
            }

            if (_.isNil(info.hasRegistrationTime)) {
                throw new Error("Missing whether event has registration time");
            }

            if (
                info.hasRegistrationTime &&
                (_.isNil(info.registrationStartedAt) ||
                    _.isNil(info.registrationEndedAt))
            ) {
                throw new Error("Registration start and end time are required");
            }

            if (
                info.hasRegistrationTime &&
                info.registrationStartedAt > info.registrationEndedAt
            ) {
                throw new Error(
                    "Registration start time cannot be greater than registration end time"
                );
            }

            if (
                _.isNil(info.startedAt) ||
                _.isNil(info.endedAt) ||
                info.startedAt > info.endedAt
            ) {
                throw new Error("Event time is invalid");
            }

            if (
                info.hasRegistrationTime &&
                info.registrationEndedAt > info.startedAt
            ) {
                throw new Error(
                    "Registration time and event time cannot overlap"
                );
            }

            // check valid metadata
            if (info.eventType === EventType.LHOT) {
                const { subject: subjectId } = info.lhotMetadata;
                const subjectExists = await this.subjectService.subjectExists(
                    subjectId
                );
                if (!subjectExists) {
                    throw new Error(`Subject for Lop Hoc On Tap not found`);
                }
            }

            info.hasThumbnailAndBanner = this.getHasThumbnailAndBanner(
                info.eventType,
                info.hasThumbnailAndBanner
            );
            info.thumbnailUrl = info.hasThumbnailAndBanner
                ? info.thumbnailUrl
                : undefined;
            info.bannerUrl = info.hasThumbnailAndBanner
                ? info.bannerUrl
                : undefined;

            if (_.isNil(info.hasThumbnailAndBanner)) {
                throw new Error(
                    "Missing whether event has thumbnail and banner"
                );
            }

            if (
                info.hasThumbnailAndBanner &&
                (_.isNil(info.thumbnailUrl) || _.isNil(info.bannerUrl))
            ) {
                throw new Error("Thumbnail and banner URLs are required");
            }

            const updatedEvent = await this.eventService.editOne(eventId, info);

            response.composer.success(updatedEvent);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getById(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canViewEvent = await canPerform(Permission.ADMIN_VIEW_EVENT);
            if (!canViewEvent) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

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

            response.composer.success(event);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getAll(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canView = await canPerform(Permission.ADMIN_VIEW_EVENT);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

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
                const [total, result] = await this.eventService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "lhotMetadata.subject" }, { path: "createdBy" }],
                    pageSize,
                    pageNumber
                );

                response.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const result = await this.eventService.get(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "lhotMetadata.subject" }, { path: "createdBy" }]
                );

                response.composer.success({
                    total: result.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async deleteOne(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canDeleteEvent = await canPerform(
                Permission.ADMIN_DELETE_EVENT
            );
            if (!canDeleteEvent) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (!event) {
                throw new Error(`Event not found`);
            }

            const deletedEvent = await this.eventService.markAsDeleted(eventId);

            response.composer.success(deletedEvent);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async checkIn(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );
            const canCheckin = await canPerform(Permission.ADMIN_CHECKIN_EVENT);
            if (!canCheckin) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (!event) {
                throw new Error(`Event not found`);
            }

            const now = Date.now();
            if (now < event.startedAt || now > event.endedAt) {
                throw new Error(`Event is not happening now`);
            }

            const { qrCode } = request.body;
            const qrCodeData = this.eventService.decodeUserQrCode(qrCode);
            const userId = new Types.ObjectId(qrCodeData.userId);

            const userIndex = event.registeredUsers.findIndex(
                (registeredUsers) => registeredUsers.userId.equals(userId)
            );
            if (userIndex === -1) {
                throw new Error(`User not registered for this event`);
            }

            event.registeredUsers[userIndex].checkedInAt = now;
            event.markModified("registeredUsers");
            await event.save();

            response.composer.success(event);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async checkInEmail(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );
            const canCheckin = await canPerform(Permission.ADMIN_CHECKIN_EVENT);
            if (!canCheckin) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const eventId = new Types.ObjectId(request.params.eventId);
            const event = await this.eventService.getById(eventId);

            if (!event) {
                throw new Error(`Event not found`);
            }

            const now = Date.now();
            if (now < event.startedAt || now > event.endedAt) {
                throw new Error(`Event is not happening now`);
            }

            const { email } = request.body;
            const user = await this.userService.getByEmail(email);

            if (!user) {
                throw new Error(`User not found`);
            }

            const userIndex = event.registeredUsers.findIndex(
                (registeredUsers) => registeredUsers.userId.equals(user._id)
            );

            if (userIndex === -1) {
                throw new Error(`User not registered for this event`);
            }

            event.registeredUsers[userIndex].checkedInAt = now;
            event.markModified("registeredUsers");
            await event.save();

            response.composer.success(event);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }
}
