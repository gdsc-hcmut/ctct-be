import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export enum UserRole {
    STUDENT = "STUDENT",
    ADMIN = "ADMIN",
}

export type UserDocument = Document & {
    googleId: string;
    roles: UserRole[];

    name: string;
    picture: string;
    dateOfBirth: number;
    email: string;
};

const userSchema = new Schema<UserDocument>({
    googleId: { type: String, unique: true },
    roles: Array<UserRole>,

    name: { type: String, required: true },
    picture: String,
    dateOfBirth: Number,
    email: String,

    // TODO: add tracking data for subjects
});

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
