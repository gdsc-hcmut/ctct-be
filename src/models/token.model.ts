import _ from "lodash";
import mongoose, { Document, Schema, Types } from "mongoose";

export type TokenDocument = Document & {
    googleId: string;
    userId: mongoose.Types.ObjectId;
    accessLevels: Types.ObjectId[];
    isManager: boolean;
    createdAt: number;
    expiredAt: number;

    userAgent: string;
};

const tokenSchema = new Schema<TokenDocument>({
    googleId: String,
    userId: Schema.Types.ObjectId,
    accessLevels: [{ type: Schema.Types.ObjectId }],
    isManager: Boolean,
    createdAt: Number,
    expiredAt: Number,

    userAgent: String,
});

export function parseTokenMeta(tokenMeta: any): TokenDocument {
    return {
        ...tokenMeta,
        _id: mongoose.Types.ObjectId.createFromHexString(tokenMeta._id),
        userId: mongoose.Types.ObjectId.createFromHexString(tokenMeta.userId),
    };
}

const Token = mongoose.model<TokenDocument>("token", tokenSchema);
export default Token;
