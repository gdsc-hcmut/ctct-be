import { injectable } from "inversify";

import User, { UserDocument } from "../models/user.model";
import mongoose, {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import DeviceToken, { DeviceTokenDocument } from "../models/device-token.model";
import { logger } from "../lib/logger";

@injectable()
export class UserService {
    constructor() {
        logger.info("[User] Initializing...");
    }

    async registerNewDevice(token: string): Promise<DeviceTokenDocument> {
        const deviceToken: DeviceTokenDocument = {
            token: token,
            createdAt: Date.now(),
        };
        const addedDeviceToken = await DeviceToken.create(deviceToken);

        return addedDeviceToken;
    }

    async registerNewUserToDeviceToken(
        tokenId: mongoose.Types.ObjectId,
        userId: mongoose.Types.ObjectId
    ) {
        const opUpdateResult = await DeviceToken.updateOne(
            { _id: tokenId },
            {
                $set: {
                    userId: userId,
                },
            }
        );

        return opUpdateResult.modifiedCount;
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findById(id, projection, options);
    }

    async find(
        query: FilterQuery<UserDocument>,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.find(query, projection, options);
    }

    async findOne(
        query: FilterQuery<UserDocument>,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOne(query, projection, options);
    }

    async updateMany(
        query: FilterQuery<UserDocument>,
        update: UpdateQuery<UserDocument>,
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.updateMany(query, update, options);
    }

    async findOneAndUpdate(
        query: FilterQuery<UserDocument>,
        update: UpdateQuery<UserDocument>,
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOneAndUpdate(query, update, options);
    }
}
