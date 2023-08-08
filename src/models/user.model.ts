import mongoose, { Document, Types } from "mongoose";

const Schema = mongoose.Schema;

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
}

export type UserDocument = Document & {
    googleId: string;
    accessLevels: Types.ObjectId[];
    isManager: boolean;
    picture: string;

    familyAndMiddleName: string;
    givenName: string;
    studentId: string;
    major: string;
    dateOfBirth: number;
    gender: Gender;
    email: string;
    phoneNumber: string;
};

const userSchema = new Schema<UserDocument>({
    googleId: { type: String, unique: true },
    accessLevels: [
        {
            type: Schema.Types.ObjectId,
            ref: "access_levels",
        },
    ],
    isManager: { type: Boolean, default: false },
    picture: String,

    familyAndMiddleName: { type: String, default: "" },
    givenName: { type: String, default: "" },
    studentId: { type: String, default: "" },
    major: { type: String, default: "" },
    dateOfBirth: Number,
    gender: { type: String, enum: Gender },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
});

const User = mongoose.model<UserDocument>("User", userSchema);
export default User;
