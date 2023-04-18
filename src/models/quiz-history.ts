import mongoose, { Types, Schema } from "mongoose";

/**
 * A log of which quiz a user has registered, and has taken part in
 * Could have been made a part of user model, but it's too expensive
 * to call ref on, so it's now a separate part
 */

export type QuizHistoryDocument = Document & {
    // id that matches the user that owns this history
    _id: Types.ObjectId;

    quizRegistered: {
        _id: Types.ObjectId;
        registeredAt: number;
    }[];
    quizCompleted: {
        _id: Types.ObjectId;
        completedAt: number;
        result: number;
    }[];
};

const quizHistorySchema = new Schema<QuizHistoryDocument>({
    _id: Schema.Types.ObjectId,

    quizRegistered: [
        {
            _id: Schema.Types.ObjectId,
            registeredAt: Number,
        },
    ],
    quizCompleted: [
        {
            _id: Schema.Types.ObjectId,
            completedAt: Number,
            result: Number,
        },
    ],
});

const QuizHistoryModel = mongoose.model<QuizHistoryDocument>(
    "quiz_histories",
    quizHistorySchema
);
export default QuizHistoryModel;
