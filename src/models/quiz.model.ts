import mongoose, { Document, Types, Schema } from "mongoose";
import { ConcreteQuestion } from "./question_template.model";

/**
 * There is no REGISTERED state, since taking a quiz means starting it instantly,
 * maybe add schedule quiz start time?
 */
export enum QuizStatus {
    ONGOING = "ONGOING",
    ENDED = "ENDED",
}

export type QuizDocument = Document & {
    userId: Types.ObjectId;
    status: QuizStatus;

    createdAt: number;
    startsAt: number;
    endsAt: number;

    // percentage of points ([0, 100])
    standardizedScore: number;

    fromTemplate: Types.ObjectId;
    questions: ConcreteQuestion[];
};

const quizSchema = new Schema<QuizDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    status: { type: String, required: true, enum: QuizStatus },

    createdAt: { type: Number, required: true },
    startsAt: { type: Number, required: true },
    endsAt: { type: Number, required: true },
    standardizedScore: { type: Number, required: false, default: 0 },

    fromTemplate: { type: Schema.Types.ObjectId, ref: "quiz_templates" },
    questions: Array<ConcreteQuestion>,
});

const QuizModel = mongoose.model<QuizDocument>("quizzes", quizSchema);
export default QuizModel;
