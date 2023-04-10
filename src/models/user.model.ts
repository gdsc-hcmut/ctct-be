import mongoose, { Document, Types } from "mongoose";

const Schema = mongoose.Schema;

export enum UserRole {
    STUDENT = "STUDENT",
    ADMIN = "ADMIN",
}

export type UserDocument = Document & {
    username: string;
    password: string;
    roles: UserRole[];

    name: string;
    picture: string;
    dateOfBirth: number;
    email: string;
    phoneNumber: string;
    universityName: Types.ObjectId;

    examsPendingPayment: {
        _id: Types.ObjectId;
        requestedAt: number;
    }[];
    examsRegistered: {
        _id: Types.ObjectId;
        registeredAt: number;
    }[];
    examsParticipated: {
        _id: Types.ObjectId;
        completedAt: number;
        result: number;
    }[];
};

const userSchema = new Schema<UserDocument>({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    roles: Array<UserRole>,

    name: { type: String, required: true },
    picture: String,
    dateOfBirth: Number,
    email: String,
    phoneNumber: String,
    universityName: Types.ObjectId,

    examsPendingPayment: Array<{
        _id: Types.ObjectId;
        requestedAt: number;
    }>,
    examsRegistered: Array<{
        _id: Types.ObjectId;
        registeredAt: number;
    }>,
    examsParticipated: Array<{
        _id: Types.ObjectId;
        completedAt: number;
        result: number;
    }>,
});

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
