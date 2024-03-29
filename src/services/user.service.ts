import { injectable } from "inversify";

import User, { UserDocument } from "../models/user.model";
import mongoose, {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import DeviceToken, { DeviceTokenDocument } from "../models/device-token.model";
import { logger } from "../lib/logger";
import { userInfo } from "os";

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

    async getUserById(id: Types.ObjectId) {
        return await User.findOne({ _id: id });
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await User.findById(id).populate(populateOptions);
    }

    public async getByEmail(
        email: string,
        projection: ProjectionType<UserDocument> = {},
        options: QueryOptions<UserDocument> = {}
    ) {
        return await this.findOne({ email }, projection, options);
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

    async getById(id: Types.ObjectId) {
        return await User.findById(id);
    }

    async edit(
        id: Types.ObjectId,
        update: UpdateQuery<UserDocument>,
        options: QueryOptions<UserDocument> = {}
    ) {
        return await User.findOneAndUpdate({ _id: id }, update, {
            ...options,
            new: true,
        });
    }
}
