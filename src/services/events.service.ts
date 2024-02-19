import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { CreateEventDto } from "../lib/dto/create_event.dto";
import EventModel, { EventDocument, EventType } from "../models/event.model";
import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";

@injectable()
export class EventService {
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
            options
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
            options
        );
    }

    async getPaginated(
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
                projection
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
}
