import mongoose, { Document, Types, Schema } from "mongoose";
import { ConcreteQuestion } from "./question.model";

/**
 * There is no REGISTERED state, since taking a quiz means starting it instantly,
 * maybe add schedule quiz start time?
 */
export enum QuizStatus {
    ONGOING = "ONGOING",
    ENDED = "ENDED",
}

export type QuizSessionDocument = Document & {
    userId: Types.ObjectId;
    status: QuizStatus;

    createdAt: number;
    duration: number;
    startTime: number;
    // the time at which the user finished the test, not necessarily startTime + duration
    endTime?: number;

    // score standardized to [0, 10]
    standardizedScore: number;

    fromQuiz: Types.ObjectId;
    questions: ConcreteQuestion[];
};

const quizSessionSchema = new Schema<QuizSessionDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    status: { type: String, required: true, enum: QuizStatus },

    createdAt: { type: Number, required: true },
    duration: { type: Number, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: false },
    standardizedScore: { type: Number, required: false, default: 0 },

    fromQuiz: { type: Schema.Types.ObjectId, ref: "quizzes" },
    questions: Array<ConcreteQuestion>,
});

const QuizSessionModel = mongoose.model<QuizSessionDocument>(
    "quiz_sessions",
    quizSessionSchema
);
export default QuizSessionModel;
