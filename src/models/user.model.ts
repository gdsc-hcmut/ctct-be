import mongoose, { Document, Types } from "mongoose";

const Schema = mongoose.Schema;

export enum UserRole {
    STUDENT = "STUDENT",
    ADMIN = "ADMIN",
}

export type UserDocument = Document & {
    googleId: string;
    role: UserRole;

    name: string;
    picture: string;
    dateOfBirth: number;
    email: string;
    phoneNumber: string;
    universityName: Types.ObjectId;
};

const userSchema = new Schema<UserDocument>({
    googleId: { type: String, unique: true },
    role: { type: String, enum: UserRole },

    name: { type: String, required: true },
    picture: String,
    dateOfBirth: Number,
    email: String,
    phoneNumber: String,
    universityName: Types.ObjectId,

    // TODO: add tracking data for subjects
});

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
