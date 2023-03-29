import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type UserDocument = Document & {
    username: string;
    password: string;
    googleId: string;
    email: string;
};

const userSchema = new Schema<UserDocument>({
    username: String,
    password: String,
    googleId: String,
    email: String,
});

const User = mongoose.model<UserDocument>("User", userSchema);

export default User;
