import mongoose, { Document, Schema, Types } from "mongoose";

export type QuizDocument = Document & {
    name: string;
    description: string;
    subject: Types.ObjectId;
    chapter: Types.ObjectId;

    duration: number;
    potentialQuestions: Types.ObjectId[];
    sampleSize: number;

    createdBy: Types.ObjectId;
    createdAt: number;

    lastUpdatedAt?: number;
    isHidden: boolean;
    deletedAt: number;
};

const quizSchema = new Schema<QuizDocument>({
    name: { type: String, required: true, default: "" },
    description: { type: String, required: false, default: "" },
    subject: { type: Schema.Types.ObjectId, ref: "subjects", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "chapters", required: true },

    duration: { type: Number, required: true },
    potentialQuestions: [
        { type: Schema.Types.ObjectId, ref: "questions", required: true },
    ],
    sampleSize: { type: Number, required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    createdAt: Number,
    lastUpdatedAt: Number,
    isHidden: { type: Boolean, default: false },
    deletedAt: Number,
});

const QuizModel = mongoose.model<QuizDocument>("quizzes", quizSchema);
export default QuizModel;
