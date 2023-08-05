import mongoose, { Schema, Types } from "mongoose";

export enum UserActivityType {
    VIEW_MATERIAL = "VIEW_MATERIAL",
    VIEW_PREVIOUS_EXAM = "VIEW_PREVIOUS_EXAM",
    START_QUIZ_SESSION = "START_QUIZ_SESSION",
}

export type UserActivityDocument = Document & {
    type: UserActivityType;
    userId: Types.ObjectId;

    materialId?: Types.ObjectId;
    previousExamId?: Types.ObjectId;
    quizSessionId?: Types.ObjectId;

    createdAt: number;
    deletedAt: number;
};

const userActivitySchema = new Schema<UserActivityDocument>({
    type: { type: String, required: true, enum: UserActivityType },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },

    materialId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "materials",
    },
    previousExamId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "previous_exams",
    },
    quizSessionId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "quiz_sessions",
    },

    createdAt: { type: Number, required: true },
    deletedAt: { type: Number, required: false },
});

const UserActivityModel = mongoose.model<UserActivityDocument>(
    "user_activities",
    userActivitySchema
);

export default UserActivityModel;
