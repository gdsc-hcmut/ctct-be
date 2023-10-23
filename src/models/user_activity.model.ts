import mongoose, { Schema, Types } from "mongoose";
import { logger } from "../lib/logger";

export enum UserActivityType {
    VIEW_MATERIAL = "VIEW_MATERIAL",
    VIEW_PREVIOUS_EXAM = "VIEW_PREVIOUS_EXAM",
    START_QUIZ_SESSION = "START_QUIZ_SESSION",
    START_EXAM_SESSION = "START_EXAM_SESSION",
}

export type UserActivityDocument = Document & {
    type: UserActivityType;
    userId: Types.ObjectId;

    materialId?: Types.ObjectId;
    previousExamId?: Types.ObjectId;
    quizSessionId?: Types.ObjectId;
    examSessionId?: Types.ObjectId;

    createdAt: number;
    deletedAt: number;
};

const userActivitySchema = new Schema<UserActivityDocument>({
    type: { type: String, required: true, enum: UserActivityType },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },

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
    examSessionId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "exam_sessions",
    },

    createdAt: { type: Number, required: true },
    deletedAt: { type: Number, required: false },
});

userActivitySchema.index({ userId: "hashed" });

const UserActivityModel = mongoose.model<UserActivityDocument>(
    "user_activities",
    userActivitySchema
);

UserActivityModel.on("index", (err) => {
    if (err) {
        logger.error("User activity index error: %s", err);
    } else {
        logger.info("Created index for user actitivity");
    }
});

export default UserActivityModel;
