import mongoose, { Document, Schema, Types } from "mongoose";

export type QuizTemplateDocument = Document & {
    name: string;
    description: string;
    subject: Types.ObjectId;
    visibleTo: Types.ObjectId[];

    duration: number;
    potentialQuestions: {
        questionId: Types.ObjectId;
        point: number;
    }[];
    sampleSize: number;

    createdBy: Types.ObjectId;
    createdAt: number;
};

const quizTemplateSchema = new Schema<QuizTemplateDocument>({
    name: { type: String, required: true, default: "" },
    description: { type: String, required: false, default: "" },
    subject: { type: Schema.Types.ObjectId, ref: "subjects" },
    visibleTo: [{ type: Schema.Types.ObjectId, required: true }],

    duration: { type: Number, required: true },
    potentialQuestions: [
        {
            questionId: {
                type: Schema.Types.ObjectId,
                ref: "question_templates",
            },
            point: { type: Number, default: 0 },
        },
    ],
    sampleSize: { type: Number, required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    createdAt: Number,
});

const QuizTemplateModel = mongoose.model<QuizTemplateDocument>(
    "quiz_templates",
    quizTemplateSchema
);
export default QuizTemplateModel;
