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

    async getUserById(
        id: Types.ObjectId,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOne({ _id: id }, projection, options);
    }

    async findOne(
        query: FilterQuery<UserDocument>,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOne(query, projection, options);
    }

    async setUserAccessLevel(
        userId: Types.ObjectId,
        accessLevelIds: Types.ObjectId[],
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    accessLevels: accessLevelIds,
                },
            },
            { ...options, new: true }
        );
    }

    async removeAccessLevelFromAllUsers(
        accessLevelId: Types.ObjectId,
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.updateMany(
            {},
            {
                $pull: {
                    accessLevels: accessLevelId,
                },
            },
            options
        );
    }
}
