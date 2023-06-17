import _ from "lodash";
import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "./user.model";

export type TokenDocument = Document & {
    googleId: string;
    userId: mongoose.Types.ObjectId;
    createdAt: number;
    expiredAt: number;
    roles: UserRole[];

    userAgent: string;
};

const tokenSchema = new Schema<TokenDocument>({
    googleId: String,
    userId: Schema.Types.ObjectId,
    createdAt: Number,
    expiredAt: Number,
    roles: Array<UserRole>,

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
