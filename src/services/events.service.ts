import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { CreateEventDto } from "../lib/dto/create_event.dto";
import EventModel, {
    EventCheckInQRCodeData,
    EventDocument,
    EventType,
} from "../models/event.model";
import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import { aes256Encrypt, aes256Decrypt } from "../lib/aes256/aes256";
import _ from "lodash";

@injectable()
export class EventService {
    private readonly EVENT_QR_ENCRYPTION_KEY =
        process.env.AES256_ENCRYPTION_KEY;

    constructor() {
        logger.info(`[Event] Initializing...`);
    }

    public async create(dto: CreateEventDto, createdBy: Types.ObjectId) {
        if (!Object.values(EventType).includes(dto.eventType)) {
            throw new Error(`Invalid event type: ${dto.eventType}`);
        }

        const now = Date.now();

        return await EventModel.create({
            ...dto,
            createdBy,
            createdAt: now,
            lastUpdatedAt: now,
        });
    }

    public async editOne(
        eventId: Types.ObjectId,
        update: UpdateQuery<EventDocument>,
        options: QueryOptions<EventDocument> = {}
    ) {
        return await EventModel.findOneAndUpdate(
            { _id: eventId, deletedAt: { $exists: false } },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public async getOne(
        query: FilterQuery<EventDocument>,
        projection: ProjectionType<EventDocument> = {},
        options: QueryOptions<EventDocument> = {}
    ): Promise<EventDocument> {
        return await EventModel.findOne(
            { ...query, deletedAt: { $exists: false } },
            projection,
            { ...options, sort: { startedAt: -1 } }
        );
    }

    public async getById(
        id: Types.ObjectId,
        projection: ProjectionType<EventDocument> = {},
        options: QueryOptions<EventDocument> = {}
    ): Promise<EventDocument> {
        return await this.getOne({ _id: id }, projection, options);
    }

    public async get(
        query: FilterQuery<EventDocument>,
        projection: ProjectionType<EventDocument>,
        options: QueryOptions<EventDocument>
    ) {
        return await EventModel.find(
            { ...query, deletedAt: { $exists: false } },
            projection,
            { ...options, sort: { startedAt: -1 } }
        );
    }

    public async getPaginated(
        query: FilterQuery<EventDocument>,
        projection: ProjectionType<EventDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            EventModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            EventModel.find(
                {
                    ...query,
                    deletedAt: { $exists: false },
                },
                projection,
                { sort: { startedAt: -1 } }
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(populateOptions),
        ]);
    }

    public async markAsDeleted(
        eventId: Types.ObjectId,
        options: QueryOptions<EventDocument> = {}
    ) {
        return await EventModel.findOneAndUpdate(
            { _id: eventId, deletedAt: { $exists: false } },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public getUserQrCode(data: EventCheckInQRCodeData): string {
        return aes256Encrypt(
            JSON.stringify(data),
            this.EVENT_QR_ENCRYPTION_KEY
        );
    }

    public decodeUserQrCode(qrCode: string): EventCheckInQRCodeData {
        return JSON.parse(aes256Decrypt(qrCode, this.EVENT_QR_ENCRYPTION_KEY));
    }

    public censorEventInformationForUser(event: EventDocument) {
        return {
            ..._.pick(event, [
                "_id",
                "name",
                "description",
                "eventType",
                "venue",
                "hasRegistrationTime",
                "registrationStartedAt",
                "registrationEndedAt",
                "startedAt",
                "endedAt",
                "lhotMetadata",
                "hasThumbnailAndBanner",
                "thumbnailUrl",
                "bannerUrl",
            ]),
            registeredUsers: _.map(event.registeredUsers, (user) =>
                _.pick(user, ["userId", "checkedInAt"])
            ),
        };
    }

    public async eventWithSubjectExists(subjectId: Types.ObjectId) {
        return !_.isNil(
            await this.getOne({
                $or: [{ "lhotMetadata.subject": subjectId }],
            })
        );
    }
}
