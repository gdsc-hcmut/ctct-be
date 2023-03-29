import { injectable } from "inversify";
import _, { toNumber } from "lodash";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/user.model";
import { ErrorUserInvalid } from "../lib/errors";
import { UserDocument } from "../models/user.model";
import mongoose from "mongoose";
import DeviceToken, { DeviceTokenDocument } from "../models/device-token.model";

@injectable()
export class UserService {
    constructor() {
        this.setupIndexes();
    }

    private async setupIndexes() {
        console.log("Setting up indexes for UserService");
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

    async create(user: any): Promise<UserDocument> {
        if (_.isEmpty(user.password) || _.isEmpty(user.username)) {
            throw new ErrorUserInvalid("Missing input fields");
        }

        user.password = await bcrypt.hash(
            user.password,
            process.env.HASH_ROUNDS
        );
        const addedUser = await User.create(user);
        return addedUser._id;
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

    async findOne(query: any = {}, keepAll = false): Promise<UserDocument> {
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

    async changePassword(
        userId: mongoose.Types.ObjectId,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await User.findOne({ _id: userId });

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );
        if (!passwordMatch) {
            throw new Error("Your current password does not match.");
        }

        newPassword = await bcrypt.hash(newPassword, process.env.HASH_ROUNDS);
        const opUpdateResult = await User.updateOne(
            { _id: userId },
            { $set: { password: newPassword } }
        );
        return opUpdateResult.modifiedCount;
    }
}
