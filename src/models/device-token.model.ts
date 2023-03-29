import _ from "lodash";
import mongoose, { Schema } from "mongoose";

export interface DeviceTokenDocument {
    readonly _id?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    token: string;
    createdAt: number;
}

const deviceTokenSchema = new Schema<DeviceTokenDocument>({
    _id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    token: String,
    createdAt: Number,
});

const DeviceToken = mongoose.model<DeviceTokenDocument>(
    "device_tokens",
    deviceTokenSchema
);
export default DeviceToken;
