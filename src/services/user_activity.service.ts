import { injectable } from "inversify";
import UserActivityModel, {
    UserActivityDocument,
    UserActivityType,
} from "../models/user_activity.model";
import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
} from "mongoose";
import { logger } from "../lib/logger";

@injectable()
export class UserActivityService {
    constructor() {
        logger.info("[UserActivity] Initializing...");
    }

    public async create(
        type: UserActivityType,
        userId: Types.ObjectId,
        entityId: Types.ObjectId
    ) {
        console.debug(
            `Creating new activity: [type: ${type.toString()}, userId: ${userId.toString()}, entityId: ${entityId.toString()}]`
        );
        return await UserActivityModel.create({
            type,
            userId,
            materialId:
                type === UserActivityType.VIEW_MATERIAL ? entityId : undefined,
            previousExamId:
                type === UserActivityType.VIEW_PREVIOUS_EXAM
                    ? entityId
                    : undefined,
            quizSessionId:
                type === UserActivityType.START_QUIZ_SESSION
                    ? entityId
                    : undefined,
            createdAt: Date.now(),
        });
    }

    public async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<UserActivityDocument> = {}
    ) {
        console.debug(`Marking activity ${id.toString()} as deleted`);
        return await UserActivityModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public async getPaginated(
        query: FilterQuery<UserActivityDocument>,
        projection: ProjectionType<UserActivityDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            UserActivityModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            UserActivityModel.find(
                {
                    ...query,
                    deletedAt: { $exists: false },
                },
                projection
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .sort({ createdAt: "desc" })
                .populate(populateOptions),
        ]);
    }

    public async getById(
        id: Types.ObjectId,
        projection: ProjectionType<UserActivityDocument> = {}
    ) {
        return await UserActivityModel.findOne(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            projection
        );
    }

    public async getTypeCountOfUser(
        userId: Types.ObjectId,
        type: UserActivityType
    ) {
        return await UserActivityModel.count({
            userId,
            type,
            deletedAt: { $exists: false },
        });
    }
}
