import { injectable } from "inversify";
import { toNumber } from "lodash";
import crypto from "crypto";

import User, { UserDocument } from "../models/user.model";
import mongoose, {
    FilterQuery,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import DeviceToken, { DeviceTokenDocument } from "../models/device-token.model";
import { logger } from "../lib/logger";

@injectable()
export class UserService {
    constructor() {
        this.setupIndexes();
        logger.info("Constructing User service");
    }

    private async setupIndexes() {
        // TODO: build indexes once app reaches stable
        // TODO: hash googleId for faster authentication?
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

    async findUserById(id: Types.ObjectId) {
        return await User.findById(id);
    }

    async verifyAccountRequest(email: string) {
        let user = null;
        try {
            user = await this.findOne({ email }, true);
        } catch (err) {
            throw new Error(
                `The email address that you've entered doesn't match any account.`
            );
        }

        const verifyAccountCode = crypto
            .randomBytes(toNumber(process.env.VERIFY_CODE_LENGTH))
            .toString("hex");
        await this.updateOne(user._id, { verifyAccountCode });
    }

    async verifyAccount(verifyAccountCode: string) {
        let user = null;
        try {
            user = await this.findOne({ verifyAccountCode }, true);
        } catch (err) {
            throw new Error(
                `The email address that you've entered doesn't match any account.`
            );
        }

        await this.updateOne(user._id, {
            verifyAccountCode: "",
            isVerified: true,
        });
    }

    async find(query: any = {}) {
        return await User.find(query);
    }

    async findOne(query: any = {}, keepAll = false) {
        return await User.findOne(query);
    }

    async updateOne(userId: mongoose.Types.ObjectId, data: any) {
        const opUpdateResult = await User.findOneAndUpdate(
            { _id: userId },
            { $set: data }
        );
        return opUpdateResult;
    }

    async increase(
        userId: mongoose.Types.ObjectId,
        field: string,
        value: number
    ) {
        const opUpdateResult = await User.updateOne(
            { _id: userId },
            { $inc: { [field]: value } }
        );
        return opUpdateResult.modifiedCount;
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
