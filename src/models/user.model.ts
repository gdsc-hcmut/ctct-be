import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export enum UserRole {
    STUDENT = "STUDENT",
    ADMIN = "ADMIN",
}

export function userMayUploadPreviousExam(r: UserRole) {
    return r == UserRole.ADMIN;
}

export function userMayUploadMaterial(r: UserRole) {
    return r == UserRole.ADMIN;
}

export type UserDocument = Document & {
    googleId: string;
    role: UserRole;

    name: string;
    picture: string;
    dateOfBirth: number;
    email: string;
};

const userSchema = new Schema<UserDocument>({
    googleId: { type: String, unique: true },
    role: { type: String, enum: UserRole },

    name: { type: String, required: true },
    picture: String,
    dateOfBirth: Number,

    // TODO: add tracking data for subjects
});

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
