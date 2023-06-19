import mongoose, { Document, Types } from "mongoose";

const Schema = mongoose.Schema;

export type UserDocument = Document & {
    googleId: string;
    accessLevels: Types.ObjectId[];
    isManager: boolean;
    name: string;
    picture: string;
    dateOfBirth: number;
    email: string;
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
    name: { type: String, required: true },
    picture: String,
    dateOfBirth: Number,
    email: String,
});

const User = mongoose.model<UserDocument>("User", userSchema);
export default User;
